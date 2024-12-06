import { Request, Response } from 'express';
import { QuizCreationData, QUIZID, QuizUpdateData } from '../Validation/quiz';
import { assert } from 'superstruct';
import axios from 'axios';
import he from 'he';
import { persist_question } from '../Repositories/questionsRepository';
import { persist_option } from '../Repositories/optionsRepository';
import { count_quizzes_with_filters, find_quizzes_with_filters, get_quiz_informations, persist_quiz, quiz_id_exists, update_quiz } from '../Repositories/quizzesRepository';

export async function create_one(req: Request, res: Response) {
    try {
        assert(req.body, QuizCreationData);
    } catch (error) {
        res.status(400).json({ error: 'Data is invalid: \n- category must be a number between 9 and 32\n- difficulty must be a string\n- amount must be a number between 1 and 50\n- title is optional and must be a string' });
        return;
    }

    try {
        const { category, difficulty, amount, title } = req.body;

        // Build object params
        const params: any = { amount };

        if (category) {
            params.category = category;
        }

        if (difficulty) {
            params.difficulty = difficulty;
        }

        /**** Get questions from API Open Trivia Database ****/
        // Build request string
        const queryString = new URLSearchParams(params).toString();

        // CBuild the full URL for the API request
        const fullURL = `https://opentdb.com/api.php?${queryString}`;

        // Get questions from API Open Trivia Database
        const apiResponse = await axios.get(fullURL);

        const { response_code, results } = apiResponse.data;

        if (response_code !== 0) {
            if (response_code == 1) {
                res.status(422).json({ error: 'The API have not enough questions with this parameters' })
                return;
            }
            res.status(400).json({ error: 'Error retrieving questions from the API.' });
            return;
        }

        const user_id = req.user?.user_id || null;

        // Create quiz
        const quiz = await persist_quiz(difficulty, title?.toLowerCase() || "", 2, user_id, "");

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

        res.status(201).json({ message: 'Quiz created', quiz_id: quiz.quiz_id });
    } catch (error: any) {
        if (String(error.message).includes('429')) {
            res.status(429).json({ error: 'Too Many Requests (Rate Limit Exceeded)' });
            return;
        }
        console.error('Erreur while creating quiz:', error);
        res.status(500).json({ error: 'Erreur while creating quiz', details: error.message });
    }
}

export async function init_one(req: Request, res: Response) {
    try {
        const user_id = req.user?.user_id || null;

        // Create quiz
        const quiz = await persist_quiz("easy", "", 0, user_id, "");

        res.status(201).json({ message: 'Quiz initialized', quiz_id: quiz.quiz_id });
    }
    catch (error: any) {
        console.error('Erreur while initializing quiz:', error);
        res.status(500).json({ error: 'Erreur while initializing quiz', details: error.message });
    }
}



export async function get_informations(req: Request, res: Response) {
    const { quiz_id } = req.params;

    try {
        const quiz = await get_quiz_informations(quiz_id);

        if (!quiz) {
            res.status(404).json({ error: 'Quiz not found' });
            return;
        }

        res.status(201).json({ message: 'Quiz found', quiz });
    } catch (error: any) {
        console.error('Error while retrieving quiz :', error);
        res.status(500).json({ error: 'Error while retrieving quiz', details: error.message });
    }
}


export async function get_publics_with_params(req: Request, res: Response) {
    const text = req.query.text as string || '';
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;
    const difficulty = req.query.difficulty as string | undefined;
    const minQuestions = parseInt(req.query.minQuestions as string) || 0;
    const maxQuestions = parseInt(req.query.maxQuestions as string) || Infinity;


    const skip = (page - 1) * pageSize;

    try {
        const total_quizzes = await count_quizzes_with_filters(text.toLowerCase(), difficulty, minQuestions, maxQuestions);
        const quizzes = await find_quizzes_with_filters(text.toLowerCase(), skip, pageSize, difficulty, minQuestions, maxQuestions);

        const quizzesWithQuestionCount = quizzes.map((quiz: any) => ({
            quiz_id: quiz.quiz_id,
            title: quiz.title,
            difficulty: quiz.difficulty,
            created_at: quiz.created_at,
            nb_questions: quiz._count.questions
        }));

        const response: any = {
            pageSize: pageSize,
            quizzes: quizzesWithQuestionCount,
            total_quizzes: total_quizzes
        };

        const totalPages = Math.ceil(total_quizzes / pageSize);
        if (page < totalPages) {
            response.nextPage = page + 1;
        }

        res.status(200).json(response);
    } catch (error) {
        console.error('Error searching public quizzes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}



export async function update_one(req: Request, res: Response) {
    const { quiz_id } = req.params;

    try {
        assert(req.body, QuizUpdateData);
    } catch (error) {
        res.status(400).json({ error: 'Data is invalid' });
        return;
    }

    try {

        await update_quiz(quiz_id, req.body);



        res.status(200).json({ message: 'Quiz updated successfully' });
    } catch (error) {
        console.error('Error updating quiz:', error);
        res.status(500).json({ error: 'An error occurred while updating the quiz' });
    }
}