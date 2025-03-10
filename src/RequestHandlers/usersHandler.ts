import { assert } from 'superstruct';
import { Request, Response } from 'express';
import { UserData } from '../Validation/user';
import { is_username_available } from '../Helpers/usersHelper';
import { create_user, get_games_by_user, get_user } from '../Repositories/usersRepository';
import { get_token } from '../Helpers/tokensHelper';
import { get_user_quiz, get_user_quizzes } from '../Repositories/quizzesRepository';
import { get_correct_answers_count } from '../Helpers/answersHelper';
import { get_total_questions_count } from '../Helpers/questionsHelper';
import { get_user_question } from '../Repositories/questionsRepository';

const bcrypt = require('bcrypt');

export async function create_one(req: Request, res: Response) {
    try {
        assert(req.body, UserData);
    } catch (error) {
        res.status(400).json({ message: 'Data is invalid' });
        return;
    }

    try {
        if (!(await is_username_available(req.body.username))) {
            res.status(409).json({ error: 'Username already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        const user = await create_user(req.body.username, hashedPassword);

        const token = get_token(user.user_id, req.body.username);
        res.status(200).json({ token });
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


export async function username_available(req: Request, res: Response) {
    const { username } = req.body;

    if (!username) {
        res.status(400).json({ message: 'Username is required' });
    }

    try {
        const is_available = await is_username_available(username);
        res.json({ is_available });
    }
    catch (error) {
        console.error('Error checking username availability:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


export async function sign_in(req: Request, res: Response) {
    const { username, password } = req.body;

    try {
        assert(req.body, UserData);
    } catch (error) {
        res.status(400).json({ message: 'Data is invalid' });
        return;
    }

    try {
        const user = await get_user(username);

        if (!user) {
            res.status(400).json({ error: 'Invalid username or password' });
            return;
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            res.status(400).json({ error: 'Invalid username or password' });
            return;
        }

        const token = get_token(user.user_id, username);
        res.status(200).json({ token });
    }

    catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}



export const get_quizzes = async (req: Request, res: Response) => {
    try {
        if (req.user?.user_id) { // User is not null because middleware is verifying it, adding condition cause of ts errors
            const quizzes = await get_user_quizzes(req.user.user_id);

            // Build response
            const quizzesWithStats = await Promise.all(
                quizzes.map(async quiz => {
                    return {
                        id: quiz.quiz_id,
                        title: quiz.title,
                        difficulty: quiz.difficulty,
                        total_questions: await get_total_questions_count(quiz.quiz_id),
                        is_public: (quiz.type == 1)
                    };
                })
            );

            res.status(200).json(quizzesWithStats);
        }
    } catch (error) {
        console.error('Error fetching quizzes for user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const get_quiz = async (req: Request, res: Response) => {

    const quiz_id = req.params.quiz_id;

    try {
        if (req.user?.user_id) { // User is not null because middleware is verifying it, adding condition cause of ts errors
            const user = req.user;
            const quiz = await get_user_quiz(req.user.user_id, quiz_id);

            if (!quiz) {
                res.status(404).json({ error: 'Quiz not found' });
                return;
            }

            // Build response
            const nb_questions = quiz.questions.length;
            const nb_played = quiz.games.length;

            // Calculate average score
            const scores = await Promise.all(quiz.games.map(async (game) => {
                return await get_correct_answers_count(game.game_id);
            }));

            const average_score = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

            // Stats by question: number of answers per question
            const questions = quiz.questions.map((question) => {
                const total_answers = question.answers.length;
                return {
                    question_id: question.question_id,
                    question_text: question.question_text,
                    question_category: question.question_category,
                    question_difficulty: question.question_difficulty,
                    total_answers
                };
            });

            const quizWithStats = {
                id: quiz.quiz_id,
                title: quiz.title,
                difficulty: quiz.difficulty,
                nb_questions,
                nb_played,
                average_score,
                questions,
                is_public: (quiz.type == 1)
            };

            res.status(200).json(quizWithStats);
        }
    } catch (error) {
        console.error('Error fetching quiz for user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const get_question = async (req: Request, res: Response) => {
    try {
        const question = await get_user_question(req.params.question_id);

        if (!question) {
            res.status(404).json({ error: 'Question not found' });
            return;
        }

        if (question.quizzesQuiz_id !== req.params.quiz_id) {
            res.status(404).json({ error: 'Question does not belong to the provided quiz' });
            return;
        }

        /** Calcul statistics **/
        const total_answers = question.answers.length;

        // Number of correct answers
        const correct_answers_count = question.answers.filter(answer => answer.options.is_correct_answer).length;

        // Percent of correct answers
        const accuracy_rate = total_answers > 0 ? (correct_answers_count / total_answers) * 100 : 0;

        // Percent of selected answers
        const option_selection_stats = question.options.map(option => {
            const selected_count = question.answers.filter(answer => answer.options.option_id === option.option_id).length;
            const selection_percentage = total_answers > 0 ? (selected_count / total_answers) * 100 : 0;
            return {
                option_id: option.option_id,
                option_content: option.option_content,
                is_correct_answer: option.is_correct_answer,
                selection_percentage
            };
        });

        // Response building
        const questionWithStats = {
            question_id: question.question_id,
            question_text: question.question_text,
            question_category: question.question_category,
            question_difficulty: question.question_difficulty,
            total_answers,
            accuracy_rate,
            question_type: question.question_type,
            option_selection_stats
        };

        res.status(200).json(questionWithStats);
    } catch (error) {
        console.error('Error fetching question for user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const get_games = async (req: Request, res: Response) => {

    try {
        if (req.user?.user_id) { // User is not null because middleware is verifying it, adding condition cause of ts errors
            const user = req.user;
            const games = await get_games_by_user(user.user_id);

            // Build response
            const played_games = await Promise.all(games.map(async (game) => {
                const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);
                let correct_answers_nb;
                if (game.mode == 'standard' || game.mode == 'time') {
                    correct_answers_nb = await get_correct_answers_count(game.game_id);
                }
                else {
                    correct_answers_nb = await get_correct_answers_count(game.game_id, user.user_id);
                }

                // Check if the game is finished
                if (nb_questions_total === game.current_question_index) {
                    return {
                        game_id: game.game_id,
                        quiz_id: game.quizzesQuiz_id,
                        quiz_title: game.quizzes.title,
                        date_game_creation: game.created_at,
                        current_question_index: game.current_question_index,
                        nb_questions_total,
                        game_mode: game.mode,
                        correct_answers_nb
                    };
                }
                return null;

            }));
            const completed_games = played_games.filter(game => game !== null);
            res.status(200).json(completed_games.length > 0 ? completed_games : []);
        }
    } catch (error) {
        console.error('Error fetching played games for user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const get_username = async (req: Request, res: Response) => {
    try {
        if (req.user?.user_id) { // User is not null because middleware is verifying it, adding condition cause of ts errors
            res.status(200).json(req.user.username);
        }
    } catch (error) {
        console.error('Error getting username:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};