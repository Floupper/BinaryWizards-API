import { prisma } from '../db'
import { Request, Response } from 'express';
import { QuizCreationData } from '../Validation/quiz';
import { assert } from 'superstruct';
import axios from 'axios';
import he from 'he';

export async function get_one(req: Request, res: Response) {
    const { quiz_id } = req.params;

    try {
        // Récupérer le quiz par son ID
        const quiz = await prisma.quizzes.findUnique({
            where: { quiz_id },
        });

        if (!quiz) {
            return res.status(404).json({ error: 'Quiz not found' });
        }

        // Compter le nombre total de questions dans le quiz
        const nb_questions_total = await prisma.questions.count({
            where: {
                quizzesQuiz_id: quiz_id,
            },
        });


        // Vérifier si le quiz est terminé
        if (quiz.current_question_index >= nb_questions_total) {
            return res.status(200).json({
                quizz_finished: true,
                score: quiz.score,
            });
        }

        // Récupérer la question actuelle du quiz
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

        // Récupérer toutes les options de la question
        const options = question.options.map((option) => option.option_text);



        // Construire la réponse JSON
        res.status(200).json({
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