import { Request, Response } from 'express';
import { assert } from 'superstruct';
import { QuestionAnswerData } from '../Validation/question';
import { get_current_question, persist_question } from '../Repositories/questionsRepository';
import { persist_answer } from '../Repositories/answersRepository';
import { get_total_questions_count } from '../Helpers/questionsHelper';
import { get_correct_answers_count } from '../Helpers/answersHelper';
import { get_game, persist_game_update } from '../Repositories/gamesRepository';
import { GAMEID } from '../Validation/game';
import { QuestionImportData, QUIZID } from '../Validation/quiz';
import { get_quiz } from '../Repositories/quizzesRepository';
import axios from 'axios';
import he from 'he';
import { persist_option } from '../Repositories/optionsRepository';


export async function get_one(req: Request, res: Response) {
    const { game_id } = req.params;

    try {
        assert(game_id, GAMEID);
    } catch (error) {
        res.status(400).json({ message: 'The game id is invalid' });
        return;
    }

    try {
        // Find quiz by id
        const game = await get_game(game_id);

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Count the number of questions
        const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);


        // Verify if the game is finished
        if (game.current_question_index >= nb_questions_total) {

            return res.status(200).json({
                game_finished: true,
                correct_answers_nb: await get_correct_answers_count(game_id),
                nb_questions_total: nb_questions_total
            });
        }

        // Find actual question
        const question = await get_current_question(game.quizzesQuiz_id, game.current_question_index);

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // Find all options for questions
        const options = question.options.map((option) => option.option_text);



        // Build the response
        res.status(200).json({
            game_finished: false,
            question_text: question.question_text,
            options: options,
            question_index: question.question_index + 1,
            nb_questions_total: nb_questions_total,
            correct_answers_nb: await get_correct_answers_count(game_id),
            question_type: question.question_type,
            question_difficulty: question.question_difficulty,
            question_category: question.question_category,
            quiz_id: game.quizzesQuiz_id,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


export async function send_answer(req: Request, res: Response) {
    const { game_id } = req.params;
    try {
        assert(game_id, GAMEID);
    } catch (error) {
        res.status(400).json({ message: 'The game id is invalid' });
        return;
    }


    let { question_index, option_index } = req.body;

    try {
        assert(req.body, QuestionAnswerData);
    } catch (error) {
        res.status(400).json({ message: 'Data is invalid: \n- question_index must be between 1 and 50\n- option_index must be between 0 and 3' });
        return;
    }

    // In DB, question_index starts at 0
    question_index--;

    try {
        // Find the game by his id
        const game = await get_game(game_id);

        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }

        // Verify that there in no desynchronization
        if (question_index !== game.current_question_index) {
            return res.status(400).json({ error: 'Question\'s index invalid' });
        }

        // Count the number of questions
        const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);

        if (question_index >= nb_questions_total) {
            return res.status(400).json({ error: 'Quiz is finished' });
        }

        // Find corresponding question
        const question = await get_current_question(game.quizzesQuiz_id, question_index);

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // Find chosen option
        const chosenOption = question.options.find(
            (option) => option.option_index === option_index
        );

        if (!chosenOption) {
            return res.status(400).json({ error: 'Invalid option index' });
        }

        // Determine if the answer is correct
        const isCorrect = chosenOption.is_correct_answer;

        // Find correct answer's index
        const correctOption = question.options.find(
            (option) => option.is_correct_answer
        );

        if (!correctOption) {
            return res.status(500).json({ error: 'Correct answer not found' });
        }

        const correctOptionIndex = correctOption.option_index;

        // Update game in DB
        await persist_game_update(game_id, game.current_question_index + 1);

        // Add answer
        await persist_answer(game_id, question.question_id, chosenOption.option_id,);

        // Build the response
        res.status(200).json({
            is_correct: isCorrect,
            correct_option_index: correctOptionIndex,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
}



export async function import_questions(req: Request, res: Response) {
    const { quiz_id } = req.params;

    try {
        assert(quiz_id, QUIZID);
    } catch (error) {
        res.status(400).json({ message: 'The quiz id is invalid' });
        return;
    }

    try {
        assert(req.body, QuestionImportData);
    } catch (error) {
        res.status(400).json({ message: 'Data is invalid: \n- category must be a number between 9 and 32\n- difficulty must be a string\n- amount must be a number between 1 and 50' });
        return;
    }

    try {
        const quiz = await get_quiz(quiz_id);

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        const { category, difficulty, amount } = req.body;

        // Build object params
        const params: any = {
            amount,
            category,
            difficulty
        };

        /**** Get questions from API Open Trivia Database ****/
        // Build request string
        const queryString = new URLSearchParams(params).toString();

        // CBuild the full URL for the API request
        const fullURL = `https://opentdb.com/api.php?${queryString}`;

        // Get questions from API Open Trivia Database
        const apiResponse = await axios.get(fullURL);

        const { response_code, results } = apiResponse.data;

        if (response_code !== 0) {
            return res.status(400).json({ error: 'Error retrieving questions from the API.' });
        }

        // Browsing questions and options
        for (let index = 0; index < results.length; index++) {
            const questionData = results[index];

            // Decode texts
            const questionText = he.decode(questionData.question);
            const correctAnswer = he.decode(questionData.correct_answer);
            const incorrectAnswers = questionData.incorrect_answers.map((ans: string) => he.decode(ans));

            // Create question
            const question = await persist_question(index, questionText, questionData.category, questionData.difficulty, questionData.type, quiz.quiz_id);

            // Prepare the options
            const optionsData = [];

            // Add the correct answer
            optionsData.push({
                option_text: correctAnswer,
                option_index: 0,
                is_correct_answer: true,
                questionsQuestion_id: question.question_id,
            });

            // Add incorrect answers
            incorrectAnswers.forEach((incorrectAnswer: string, index: number) => {
                optionsData.push({
                    option_text: incorrectAnswer,
                    option_index: index + 1,
                    is_correct_answer: false,
                    questionsQuestion_id: question.question_id,
                });
            });

            // Sort questions randomly
            optionsData.sort(() => Math.random() - 0.5);

            // Update option_index after random
            optionsData.forEach((option, index) => {
                option.option_index = index;
            });

            // Save options to database
            for (const option of optionsData) {
                persist_option(option);
            }
        }

        res.status(201).json({ message: 'Questions added' });
    } catch (error: any) {
        console.error('Erreur while importing questions:', error);
        res.status(500).json({ error: 'Erreur while importing questions', details: error.message });
    }
}

