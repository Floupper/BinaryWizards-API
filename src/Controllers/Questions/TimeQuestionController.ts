import { SingleplayerQuestionControllerInterface } from "../../Interfaces/SingleplayerQuestionControllerInterface";
import { Request, Response } from 'express';
import { assert } from 'superstruct';
import { QuestionAnswerData } from '../../Validation/question';
import { get_current_question } from '../../Repositories/questionsRepository';
import { persist_answer } from '../../Repositories/answersRepository';
import { get_total_questions_count } from '../../Helpers/questionsHelper';
import { get_correct_answers_count } from '../../Helpers/answersHelper';
import { persist_game_update } from '../../Repositories/gamesRepository';


export class TimeQuestionController implements SingleplayerQuestionControllerInterface {
    // Set time limits based on difficulty
    private get_time_limit(difficulty: string): number {
        switch (difficulty.toLowerCase()) {
            case 'easy':
                return 30; // seconds
            case 'medium':
                return 15;
            case 'hard':
                return 5;
            default:
                return 30; // default to easy
        }
    }

    // Method to get a question
    async get_one(req: Request, res: Response): Promise<void> {
        const { game_id } = req.params;

        try {
            const game = req.game;

            if (game) { // The game is not null thanks to the validation in the middleware
                // Count the total number of questions
                const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);

                // Check if the game is finished
                if (game.current_question_index >= nb_questions_total) {
                    const correctAnswers = await get_correct_answers_count(game_id);
                    res.status(200).json({
                        game_finished: true,
                        correct_answers_nb: correctAnswers,
                        nb_questions_total: nb_questions_total,
                        quiz_id: game.quizzesQuiz_id
                    });
                    return;
                }

                // Find the current question
                const question = await get_current_question(game.quizzesQuiz_id, game.current_question_index);

                if (!question) {
                    res.status(404).json({ error: 'Question not found' });
                    return;
                }

                // Determine the time limit based on difficulty
                const time_limit = this.get_time_limit(question.question_difficulty);

                // Update the game with the question start time
                const start_time = new Date();
                await persist_game_update(game_id, {
                    question_start_time: start_time.toISOString(),
                });

                // Prepare the options
                const options = question.options.map((option: any) => ({
                    option_index: option.option_index,
                    option_content: option.option_content
                }));

                // Get the number of correct answers
                const correctAnswers = await get_correct_answers_count(game_id);

                // Build the response
                res.status(200).json({
                    game_finished: false,
                    question_text: question.question_text,
                    options: options,
                    question_index: question.question_index + 1,
                    nb_questions_total: nb_questions_total,
                    correct_answers_nb: correctAnswers,
                    question_type: question.question_type,
                    question_difficulty: question.question_difficulty,
                    question_category: question.question_category,
                    quiz_id: game.quizzesQuiz_id,
                    time_limit: time_limit // Include the time limit in the response
                });
            } else {
                res.status(400).json({ error: 'Invalid game data.' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

    // Method to submit an answer
    async send_answer(req: Request, res: Response): Promise<void> {
        const { game_id } = req.params;
        let { question_index, option_index } = req.body;

        try {
            // Validate the request data
            assert(req.body, QuestionAnswerData);
        } catch (error) {
            res.status(400).json({
                error: 'Data is invalid: \n- question_index must be between 1 and 50\n- option_index must be between 0 and 3'
            });
            return;
        }

        // In the database, question index starts at 0
        question_index--;

        try {
            const game = req.game;

            if (game) { // The game is not null thanks to the validation in the middleware
                // Check for any desynchronization
                if (question_index !== game.current_question_index) {
                    res.status(400).json({ error: 'Question\'s index invalid' });
                    return;
                }

                if (!game.difficulty_level) {
                    res.status(400).json({ error: 'Difficulty level not found' });
                    return;
                }

                // Count the total number of questions
                const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);

                if (question_index >= nb_questions_total) {
                    res.status(400).json({ error: 'Quiz is finished' });
                    return;
                }

                // Find the corresponding question
                const question = await get_current_question(game.quizzesQuiz_id, question_index);

                if (!question) {
                    res.status(404).json({ error: 'Question not found' });
                    return;
                }

                // Determine the time limit based on difficulty
                const time_limit = this.get_time_limit(game.difficulty_level);

                // Get the question start time
                const start_time_str = game.question_start_time;
                if (!start_time_str) {
                    res.status(400).json({ error: 'Question start time not recorded' });
                    return;
                }
                const start_time = new Date(start_time_str);
                const current_time = new Date();
                const elapsed_seconds = (current_time.getTime() - start_time.getTime()) / 1000;

                if (elapsed_seconds > time_limit) {
                    res.status(400).json({ error: 'Time limit exceeded for this question' });
                    return;
                }

                // Find the selected option
                const chosenOption = question.options.find(
                    (option: any) => option.option_index === option_index
                );

                if (!chosenOption) {
                    res.status(400).json({ error: 'Invalid option index' });
                    return;
                }

                // Determine if the answer is correct
                const isCorrect = chosenOption.is_correct_answer;

                // Find the correct answer index
                const correctOption = question.options.find(
                    (option: any) => option.is_correct_answer
                );

                if (!correctOption) {
                    res.status(500).json({ error: 'Correct answer not found' });
                    return;
                }

                const correctOptionIndex = correctOption.option_index;

                // Update the game in the database: increment the question index and reset the question time
                await persist_game_update(game_id, {
                    current_question_index: game.current_question_index + 1,
                    question_start_time: null // Reset the question start time
                });

                // Add the answer
                await persist_answer(game_id, question.question_id, chosenOption.option_id);

                // Build the response
                res.status(200).json({
                    is_correct: isCorrect,
                    correct_option_index: correctOptionIndex,
                });
            } else {
                res.status(400).json({ error: 'Invalid game data.' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}