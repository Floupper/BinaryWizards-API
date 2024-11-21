import { assert } from 'superstruct';
import { Request, Response } from 'express';
import { UserData } from '../Validation/user';
import { is_username_avaible } from '../Helpers/usersHelper';
import { create_user, get_games_by_user, get_user } from '../Repositories/usersRepository';
import { get_token } from '../Helpers/tokensHelper';
import { get_user_quizzes } from '../Repositories/quizzesRepository';
import { get_correct_answers_count } from '../Helpers/answersHelper';
import { get_total_questions_count } from '../Helpers/questionsHelper';


export async function create_one(req: Request, res: Response) {
    try {
        assert(req.body, UserData);
    } catch (error) {
        res.status(400).json({ message: 'Data is invalid' });
        return;
    }


    try {
        if (!(await is_username_avaible(req.body.username))) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const user = await create_user(req.body.username, req.body.password);

        const token = get_token(user.user_id, req.body.username);
        res.status(200).json({ token });
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


export async function username_avaible(req: Request, res: Response) {
    const { username } = req.body;

    if (!username) {
        res.status(400).json({ message: 'Username is required' });
    }

    try {
        const is_available = await is_username_avaible(username);
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
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        if (user.password !== password) {
            return res.status(400).json({ error: 'Invalid username or password' });
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
    const user_id = req.user?.user_id || null;

    if (!user_id) {
        res.status(401).json({ error: 'No user connected' });
        return;
    }

    try {
        const quizzes = await get_user_quizzes(user_id);

        // Build response
        const quizzesWithStats = await Promise.all(quizzes.map(async quiz => {
            const nb_questions = quiz.questions.length;
            const nb_played = quiz.games.length;

            // Calculate average score
            const scores = await Promise.all(quiz.games.map(async (game) => {
                return await get_correct_answers_count(game.game_id);
            }));
            const average_score = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

            // Stats by question : nb of answers per question
            const questionsStats = quiz.questions.map(question => {
                const totalAnswers = question.answers.length;
                return {
                    question_id: question.question_id,
                    question_text: question.question_text,
                    totalAnswers
                };
            });

            return {
                id: quiz.quiz_id,
                title: quiz.title,
                difficulty: quiz.difficulty,
                nb_questions,
                nb_played,
                average_score,
                questionsStats
            };
        }));

        res.status(200).json(quizzesWithStats);
    } catch (error) {
        console.error('Error fetching quizzes for user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};


export const get_games = async (req: Request, res: Response) => {
    const user_id = req.user?.user_id || null;

    if (!user_id) {
        res.status(401).json({ error: 'No user connected' });
        return;
    }

    try {
        const games = await get_games_by_user(user_id);

        // Build response
        const playedGames = await Promise.all(games.map(async (game) => {
            const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);
            const correct_answers_nb = await get_correct_answers_count(game.game_id);

            return {
                game_id: game.game_id,
                quiz_id: game.quizzesQuiz_id,
                quiz_title: game.quizzes.title,
                date_game_creation: game.created_at,
                current_question_index: game.current_question_index,
                nb_questions_total,
                correct_answers_nb
            };
        }));

        res.status(200).json(playedGames);
    } catch (error) {
        console.error('Error fetching played games for user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};