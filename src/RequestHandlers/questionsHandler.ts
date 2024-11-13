import { prisma } from '../db'
import { Request, Response } from 'express';
import { UUID } from '../Validation/quiz';
import { assert } from 'superstruct';
import { QuestionAnswerData } from '../Validation/question';


const difficultyPoints: { [key: string]: number } = {
    'easy': 1,
    'medium': 2,
    'hard': 3,
};




export async function get_one(req: Request, res: Response) {
    const { quiz_id } = req.params;

    try {
        assert(quiz_id, UUID);
    } catch (error) {
        res.status(400).json({ message: 'The quiz id is invalid' });
        return;
    }

    try {
        // Find quiz by id
        const quiz = await prisma.quizzes.findUnique({
            where: { quiz_id },
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Count the number of questions
        const nb_questions_total = await prisma.questions.count({
            where: {
                quizzesQuiz_id: quiz_id,
            },
        });


        // Verify if the quiz is finished
        if (quiz.current_question_index >= nb_questions_total) {

            return res.status(200).json({
                quiz_finished: true,
                score: quiz.score,
                max_score: await calculateMaxScore(quiz_id)
            });
        }

        // Find actual question
        const question = await prisma.questions.findFirst({
            where: {
                quizzesQuiz_id: quiz_id,
                question_index: quiz.current_question_index,
            },
            include: {
                options: true,
            },
        });

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // Find all options for questions
        const options = question.options.map((option) => option.option_text);



        // Build the response
        res.status(200).json({
            quiz_finished: false,
            question_text: question.question_text,
            options: options,
            question_index: question.question_index + 1,
            nb_questions_total: nb_questions_total,
            score: quiz.score,
            question_type: question.question_type,
            question_difficulty: question.question_difficulty,
            question_category: question.question_category,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Intern server error' });
    }
}


export async function send_answer(req: Request, res: Response) {
    const { quiz_id } = req.params;
    try {
        assert(quiz_id, UUID);
    } catch (error) {
        res.status(400).json({ message: 'The quiz id is invalid' });
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
        // Find the quiz by his id
        const quiz = await prisma.quizzes.findUnique({
            where: { quiz_id },
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Verify that there in no desynchronization
        if (question_index !== quiz.current_question_index) {
            return res.status(400).json({ error: 'Question\'s index invalid' });
        }

        // Count the number of questions
        const nb_questions_total = await prisma.questions.count({
            where: {
                quizzesQuiz_id: quiz_id,
            },
        });

        if (question_index >= nb_questions_total) {
            return res.status(400).json({ error: 'Quiz is finished' });
        }

        // Find corresponding question
        const question = await prisma.questions.findFirst({
            where: {
                quizzesQuiz_id: quiz_id,
                question_index: question_index,
            },
            include: {
                options: true,
            },
        });

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

        // Update quiz score
        let updatedScore = quiz.score;
        if (isCorrect) {
            const difficulty = question.question_difficulty.toLowerCase();
            const points = difficultyPoints[difficulty] || 1; // 1 is the default value
            updatedScore += points;
        }

        // Update quiz in DB
        await prisma.quizzes.update({
            where: { quiz_id },
            data: {
                score: updatedScore,
                current_question_index: quiz.current_question_index + 1,
            },
        });

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


async function calculateMaxScore(quiz_id: string): Promise<number> {
    let maxScore = 0;

    const questions = await prisma.questions.findMany({
        where: { quizzesQuiz_id: quiz_id },
    });

    for (const question of questions) {
        const difficulty = question.question_difficulty.toLowerCase();
        const points = difficultyPoints[difficulty] || 1;
        maxScore += points;
    }

    return maxScore;
}