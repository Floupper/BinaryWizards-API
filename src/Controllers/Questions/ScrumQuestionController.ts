import { Server, Socket } from 'socket.io';
import { persist_game_update } from '../../Repositories/gamesRepository';
import { get_total_questions_count } from '../../Helpers/questionsHelper';
import { get_correct_answers_count } from '../../Helpers/answersHelper';
import { get_current_question, is_already_answered } from '../../Repositories/questionsRepository';
import { get_user_answer, persist_answer } from '../../Repositories/answersRepository';
import { MultiplayerQuestionControllerInterface } from '../../Interfaces/MultiplayerQuestionControllerInterface';
import { Games } from '@prisma/client';
import { SocketError } from '../../Sockets/SocketError';
import { get_scrum_scores, have_all_scrum_players_answered } from '../../Helpers/gamesHelper';
import { AuthenticatedSocket } from '../../Middlewares/Sockets/socketAuthMiddleware';

export class ScrumQuestionController implements MultiplayerQuestionControllerInterface {
    private io: Server;

    constructor(io: Server) {
        this.io = io;
    }

    // Send a new question
    async send_question(game: Games, user_id: string): Promise<void> {
        const game_id = game.game_id;
        const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);
        const ranking = await get_scrum_scores(game_id);
        if (game.current_question_index >= nb_questions_total) {
            this.io.to(game_id).emit('gameFinished', {
                nb_questions_total: nb_questions_total,
                quiz_id: game.quizzesQuiz_id,
                ranking: ranking
            });
            return;
        }

        const question = await get_current_question(game.quizzesQuiz_id, game.current_question_index);
        if (!question) {
            throw new SocketError('Question not found');
        }

        const options = question.options.map((option: any) => ({
            option_index: option.option_index,
            option_content: option.option_content
        }));

        const sockets = await this.io.in(game_id).fetchSockets();
        for (const socketData of sockets) {
            const socket = this.io.sockets.sockets.get(socketData.id) as AuthenticatedSocket;

            if (!socket.user) {
                throw new Error('User not found in socket.user, socket: ' + JSON.stringify(socket, null, 2));
            }
            const player_correct_answers = await get_correct_answers_count(game_id, socket.user.user_id);

            socket.emit('newQuestion', {
                game_finished: false,
                question_text: question.question_text,
                options: options,
                question_index: question.question_index + 1,
                nb_questions_total: nb_questions_total,
                correct_answers_nb: player_correct_answers,
                question_type: question.question_type,
                question_difficulty: question.question_difficulty,
                question_category: question.question_category,
                quiz_id: game.quizzesQuiz_id,
            });
        }
    }

    // Handle receiving an answer from a player
    async get_answer(game: Games, question_index: number, option_index: number, user_id: string, socket: Socket): Promise<void> {
        const game_id = game.game_id;
        question_index--;

        if (question_index !== game.current_question_index) {
            throw new SocketError('Question\'s index invalid');
        }

        if (game.status !== 'started') {
            throw new SocketError('Game not started');
        }

        const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);
        if (question_index >= nb_questions_total) {
            throw new SocketError('Game is finished');
        }

        const question = await get_current_question(game.quizzesQuiz_id, question_index);
        if (!question) {
            throw new SocketError('Question not found');
        }

        const isAlreadyAnswered = await is_already_answered(game_id, question.question_id);
        if (isAlreadyAnswered) {
            throw new SocketError('Question has already been answered with the right answer');
        }

        const userAnswer = await get_user_answer(game_id, question.question_id, user_id);
        if (userAnswer) {
            throw new SocketError('Player has already answered this question');
        }

        const chosenOption = question.options.find(
            (option: any) => option.option_index === option_index
        );

        if (!chosenOption) {
            throw new SocketError('Invalid option index');
        }

        const isCorrect = chosenOption.is_correct_answer;

        const correctOption = question.options.find(
            (option: any) => option.is_correct_answer
        );

        if (!correctOption) {
            throw new SocketError('Correct answer not found');
        }

        const correctOptionIndex = correctOption.option_index;

        await persist_answer(game_id, question.question_id, chosenOption.option_id, user_id);


        socket.emit('isCorrectAnswer', {
            is_correct: isCorrect
        });

        if (isCorrect || await have_all_scrum_players_answered(game_id, question.question_id)) {
            game = await persist_game_update(game_id, {
                current_question_index: game.current_question_index + 1
            });

            this.io.to(game_id).emit('answerResult', {
                correct_option_index: correctOptionIndex
            });

            await new Promise(resolve => setTimeout(resolve, 5000));

            // Send the next question
            await this.send_question(game, user_id);
        }
    }


    async get_current_question(game: Games, user_id: string, socket: Socket) {
        const game_id = game.game_id;
        const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);
        const ranking = await get_scrum_scores(game_id);
        if (game.current_question_index >= nb_questions_total) {
            socket.emit('gameFinished', {
                nb_questions_total: nb_questions_total,
                quiz_id: game.quizzesQuiz_id,
                ranking: ranking
            });
            return;
        }

        const question = await get_current_question(game.quizzesQuiz_id, game.current_question_index);
        if (!question) {
            throw new SocketError('Question not found');
        }

        const options = question.options.map((option: any) => ({
            option_index: option.option_index,
            option_content: option.option_content
        }));

        const correctAnswers = await get_correct_answers_count(game_id, user_id);

        socket.emit('currentQuestion', {
            game_finished: false,
            question_text: question.question_text,
            options: options,
            question_index: question.question_index + 1,
            nb_questions_total: nb_questions_total,
            correct_answers_nb: correctAnswers,
            question_type: question.question_type,
            question_difficulty: question.question_difficulty,
            question_category: question.question_category,
            quiz_id: game.quizzesQuiz_id
        });
    }
}