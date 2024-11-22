import { Request, Response } from 'express';
import { QuizCreationData, QUIZID } from '../Validation/quiz';
import { assert } from 'superstruct';
import axios from 'axios';
import he from 'he';
import { persist_question } from '../Repositories/questionsRepository';
import { persist_option } from '../Repositories/optionsRepository';
import { find_quizzes_by_title, get_quiz_informations, persist_quiz } from '../Repositories/quizzesRepository';

export async function create_one(req: Request, res: Response) {
    try {
        assert(req.body, QuizCreationData);
    } catch (error) {
        res.status(400).json({ message: 'Data is invalid: \n- category must be a number between 9 and 32\n- difficulty must be a string\n- amount must be a number between 1 and 50\n- title is optional and must be a string' });
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
            return res.status(400).json({ error: 'Error retrieving questions from the API.' });
        }

        const user_id = req.user?.user_id || null;

        // Create quiz
        const quiz = await persist_quiz(difficulty, title?.toLowerCase() || "", true, user_id);

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
        console.error('Erreur while creating quiz:', error);
        res.status(500).json({ error: 'Erreur while creating quiz', details: error.message });
    }
}

export async function init_one(req: Request, res: Response) {
    try {
        const user_id = req.user?.user_id || null;

        // Create quiz
        const quiz = await persist_quiz("easy", "", false, user_id);

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
        assert(quiz_id, QUIZID);
    } catch (error) {
        res.status(400).json({ message: 'The quiz id is invalid' });
        return;
    }

    try {
        const quiz = await get_quiz_informations(quiz_id);

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        res.status(201).json({ message: 'Quiz found', quiz });
    } catch (error: any) {
        console.error('Error while retrieving quiz :', error);
        res.status(500).json({ error: 'Error while retrieving quiz', details: error.message });
    }
}


export async function get_publics_with_title(req: Request, res: Response) {
    const title = req.query.title as string;
    const page = parseInt(req.query.page as string) || 1; // Actual page, default 1
    const pageSize = parseInt(req.query.pageSize as string) || 10; // Number of quizzes per page, default 10

    const skip = (page - 1) * pageSize; // Calculate number of elements to skip

    try {
        const quizzes = await find_quizzes_by_title(title.toLowerCase(), skip, pageSize);

        const quizzesWithQuestionCount = quizzes.map((quiz: any) => ({
            quiz_id: quiz.quiz_id,
            title: quiz.title,
            difficulty: quiz.difficulty,
            created_at: quiz.created_at,
            nb_questions: quiz.questions.length
        }));

        res.status(200).json({
            currentPage: page,
            pageSize: pageSize,
            quizzes: quizzesWithQuestionCount
        });
    } catch (error) {
        console.error('Error searching public quizzes:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}



