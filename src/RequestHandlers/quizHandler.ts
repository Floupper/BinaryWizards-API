import { prisma } from '../db'
import express, { Request, Response, NextFunction, query } from 'express';
import { QuizCreationData } from '../Validation/quiz';
import { assert } from 'superstruct';
import axios from 'axios';
import { Prisma } from '@prisma/client';
import he from 'he';

export async function create_one(req: Request, res: Response) {
    assert(req.body, QuizCreationData);
    try {
        const { category, difficulty, amount } = req.body;

        // Construire l'objet params dynamiquement
        const params: any = { amount };

        if (category) {
            params.category = category;
        }

        if (difficulty) {
            params.difficulty = difficulty;
        }

        // Récupérer les questions depuis l'API Open Trivia Database
        // Construire la chaîne de requête
        const queryString = new URLSearchParams(params).toString();

        // Construire l'URL complète
        const fullURL = `https://opentdb.com/api.php?${queryString}`;

        // Récupérer les questions depuis l'API Open Trivia Database
        const apiResponse = await axios.get(fullURL);

        const { response_code, results } = apiResponse.data;

        if (response_code !== 0) {
            return res.status(400).json({ error: 'Error retrieving questions from the API.' });
        }

        // Créer le quiz
        const quiz = await prisma.quizzes.create({
            data: {
                category: category || 'Any',
                difficulty: difficulty || 'Any',
                score: 0,
                current_question_index: 0,
            },
        });

        // Parcourir les questions et les enregistrer en base de données
        for (let index = 0; index < results.length; index++) {
            const questionData = results[index];

            // Décoder les textes encodés en HTML
            const questionText = he.decode(questionData.question);
            const correctAnswer = he.decode(questionData.correct_answer);
            const incorrectAnswers = questionData.incorrect_answers.map((ans: string) => he.decode(ans));

            // Créer la question
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

            // Préparer les options (réponses)
            const optionsData = [];

            // Ajouter la réponse correcte
            optionsData.push({
                option_text: correctAnswer,
                option_index: 0,
                is_correct_answer: true,
                questionsQuestion_id: question.question_id,
            });

            // Ajouter les réponses incorrectes
            incorrectAnswers.forEach((incorrectAnswer: string, idx: number) => {
                optionsData.push({
                    option_text: incorrectAnswer,
                    option_index: idx + 1,
                    is_correct_answer: false,
                    questionsQuestion_id: question.question_id,
                });
            });

            // Mélanger les options pour plus d'aléatoire
            optionsData.sort(() => Math.random() - 0.5);

            // Enregistrer les options en base de données
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