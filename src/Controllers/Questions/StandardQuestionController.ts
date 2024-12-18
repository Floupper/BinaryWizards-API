import { SingleplayerQuestionControllerInterface } from "../../Interfaces/SingleplayerQuestionControllerInterface";
import { Request, Response } from 'express';
import { assert } from 'superstruct';
import { QuestionAnswerData } from '../../Validation/question';
import { get_current_question } from '../../Repositories/questionsRepository';
import { persist_answer } from '../../Repositories/answersRepository';
import { get_total_questions_count } from '../../Helpers/questionsHelper';
import { get_correct_answers_count } from '../../Helpers/answersHelper';
import { persist_game_update } from '../../Repositories/gamesRepository';

export class StandardQuestionController implements SingleplayerQuestionControllerInterface {
    async get_one(req: Request, res: Response) {
        const { game_id } = req.params;

        try {
            const game = req.game;

            if (game) { // The game is not null thanks to validation in the middleware
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

                // Find all the options for the question
                const options = question.options.map((option: any) => ({
                    option_index: option.option_index,
                    option_content: option.option_content
                }));

                // Build the response
                const correctAnswers = await get_correct_answers_count(game_id);
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
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }

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

            if (game) { // The game is not null thanks to validation in the middleware
                // Check for any desynchronization
                if (question_index !== game.current_question_index) {
                    res.status(400).json({ error: 'Question\'s index invalid' });
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

                // Find the chosen option
                const chosenOption = question.options.find(
                    (option: any) => option.option_index === option_index
                );

                if (!chosenOption) {
                    res.status(400).json({ error: 'Invalid option index' });
                    return;
                }

                // Determine if the answer is correct
                const isCorrect = chosenOption.is_correct_answer;

                // Find the index of the correct answer
                const correctOption = question.options.find(
                    (option: any) => option.is_correct_answer
                );

                if (!correctOption) {
                    res.status(500).json({ error: 'Correct answer not found' });
                    return;
                }

                const correctOptionIndex = correctOption.option_index;

                // Update the game in the database
                await persist_game_update(game_id, { current_question_index: game.current_question_index + 1 });

                // Add the answer
                await persist_answer(game_id, question.question_id, chosenOption.option_id, req.user?.user_id ? req.user.user_id : null);

                // Build the response
                res.status(200).json({
                    is_correct: isCorrect,
                    correct_option_index: correctOptionIndex,
                });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}