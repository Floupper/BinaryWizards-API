import { prisma } from '../db'
import { Request, Response } from 'express';
import { QuizCreationData } from '../Validation/quiz';
import { assert } from 'superstruct';
import axios from 'axios';
import he from 'he';

export async function create_one(req: Request, res: Response) {
    try {
        assert(req.body, QuizCreationData);
    } catch (error) {
        res.status(400).json({ message: 'Data is invalid: \n- category is optional and must be a number between 9 and 32\n- difficulty is optional too and must be a string\n- amount must be a number between 1 and 50' });
        return;
    }

    try {
        const { category, difficulty, amount } = req.body;

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

        // Create quiz
        const quiz = await prisma.quizzes.create({
            data: {
                category: category || 0,
                difficulty: difficulty || 'Any',
                score: 0,
                current_question_index: 0,
            },
        });

        // Browsing questions and options
        for (let index = 0; index < results.length; index++) {
            const questionData = results[index];

            // Decode texts
            const questionText = he.decode(questionData.question);
            const correctAnswer = he.decode(questionData.correct_answer);
            const incorrectAnswers = questionData.incorrect_answers.map((ans: string) => he.decode(ans));

            // Create question
            const question = await prisma.questions.create({
                data: {
                    question_index: index,
                    question_text: questionText,
                    question_category: questionData.category,
                    question_difficulty: questionData.difficulty,
                    question_type: questionData.type,
                    quizzesQuiz_id: quiz.quiz_id,
                },
            });

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
                await prisma.options.create({
                    data: option,
                });
            }
        }

        res.status(201).json({ message: 'Quiz created', quiz_id: quiz.quiz_id });
    } catch (error: any) {
        console.error('Erreur while creating quiz:', error);
        res.status(500).json({ error: 'Erreur while creating quiz', details: error.message });
    }
}