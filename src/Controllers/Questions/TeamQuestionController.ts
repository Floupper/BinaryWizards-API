import { Server, Socket } from 'socket.io';
import { persist_game_update } from '../../Repositories/gamesRepository';
import { get_total_questions_count } from '../../Helpers/questionsHelper';
import { get_correct_answers_count } from '../../Helpers/answersHelper';
import { get_current_question } from '../../Repositories/questionsRepository';
import { get_user_answer, persist_answer } from '../../Repositories/answersRepository';
import { MultiplayerQuestionControllerInterface } from '../../Interfaces/MultiplayerQuestionControllerInterface';
import { Games } from '@prisma/client';
import { SocketError } from '../../Sockets/SocketError';

export class TeamQuestionController implements MultiplayerQuestionControllerInterface {
    private io: Server;

    constructor(io: Server) {
        this.io = io;
    }

    // Set time limits based on difficulty
    private getTimeLimit(difficulty: string): number {
        switch (difficulty.toLowerCase()) {
            case 'easy':
                return 30; // seconds
            case 'medium':
                return 15;
            case 'hard':
                return 5;
            default:
                return 30; // default to easy
        }
    }

    // Send a new question
    async send_question(game: Games, user_id: string, io: Server): Promise<void> {
        const game_id = game.game_id;
        const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);

        if (!game.difficulty_level) {
            throw new SocketError('Game difficulty level not found');
        }


        if (game.current_question_index >= nb_questions_total) {
            const correctAnswers = await get_correct_answers_count(game_id, user_id);
            io.to(game_id).emit('gameFinished', {
                correct_answers_nb: correctAnswers,
                nb_questions_total: nb_questions_total,
                quiz_id: game.quizzesQuiz_id
            });
            return;
        }

        const question = await get_current_question(game.quizzesQuiz_id, game.current_question_index);
        if (!question) {
            throw new SocketError('Question not found');
        }

        const time_limit = this.getTimeLimit(game.difficulty_level);

        if (!game.question_start_time) {
            // Update the game with the question start time
            const start_time = new Date();
            game = await persist_game_update(game_id, {
                question_start_time: start_time.toISOString(),
            });
        }

        if (!game.question_start_time) {
            throw new SocketError('Question start time not found');
        }

        const options = question.options.map((option: any) => ({
            option_index: option.option_index,
            option_content: option.option_content
        }));

        const correctAnswers = await get_correct_answers_count(game_id, user_id);

        io.to(game_id).emit('newQuestion', {
            game_finished: false,
            question_text: question.question_text,
            options: options,
            question_index: question.question_index + 1,
            nb_questions_total: nb_questions_total,
            correct_answers_nb: correctAnswers,
            question_type: question.question_type,
            question_difficulty: question.question_difficulty,
            question_category: question.question_category,
            quiz_id: game.quizzesQuiz_id,
            time_available: time_limit + ((game.question_start_time.getTime() - new Date().getTime()) / 1000) < 0 ? 0 : time_limit + ((game.question_start_time.getTime() - new Date().getTime()) / 1000),
            time_limit: time_limit
        });





        setTimeout(async () => {
            const correctOption = question.options.find(
                (option: any) => option.is_correct_answer
            );

            if (!correctOption) {
                throw new SocketError('Correct answer not found');
            }

            const correctOptionIndex = correctOption.option_index;

            const userAnswer = await get_user_answer(game_id, question.question_id, user_id);

            io.to(game_id).emit('answerResult', {
                is_correct: userAnswer ? (userAnswer.options.is_correct_answer ? true : false) : false,
                correct_option_index: correctOptionIndex,
            });

            game = await persist_game_update(game_id, {
                current_question_index: game.current_question_index + 1,
                question_start_time: null
            });
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Send the next question
            await this.send_question(game, user_id, io);
        }, time_limit * 1000);

    }

    // Handle receiving an answer from a team
    async get_answer(game: Games, question_index: number, option_index: number, user_id: string, io: Server): Promise<void> {
        const game_id = game.game_id;
        question_index--;

        if (!game.difficulty_level) {
            throw new SocketError('Difficulty level not found');
        }

        if (question_index !== game.current_question_index) {
            throw new SocketError('Question\'s index invalid');
        }

        const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);
        if (question_index >= nb_questions_total) {
            throw new SocketError('Game is finished');
        }

        const question = await get_current_question(game.quizzesQuiz_id, question_index);
        if (!question) {
            throw new SocketError('Question not found');
        }

        const userAnswer = await get_user_answer(game_id, question.question_id, user_id);

        if (userAnswer) {
            throw new SocketError('Player has already answered this question');
        }

        const time_limit = this.getTimeLimit(game.difficulty_level);

        // Get the question start time
        const start_time_str = game.question_start_time;
        if (!start_time_str) {
            throw new SocketError('Question start time not found');
        }
        const start_time = new Date(start_time_str);
        const current_time = new Date();
        const elapsed_seconds = (current_time.getTime() - start_time.getTime()) / 1000;

        if (elapsed_seconds > time_limit) {
            throw new SocketError('Timeout exceeded for this question');
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

        await persist_answer(game_id, question.question_id, chosenOption.option_id, user_id);
    }

    async get_current_question(game: Games, user_id: string, socket: Socket) {
        const game_id = game.game_id;
        const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);

        if (!game.difficulty_level) {
            throw new SocketError('Game difficulty level not found');
        }

        if (!game.question_start_time) {
            throw new SocketError('Question start time not found');
        }

        if (game.current_question_index >= nb_questions_total) {
            const correctAnswers = await get_correct_answers_count(game_id, user_id);
            socket.emit('gameFinished', {
                correct_answers_nb: correctAnswers,
                nb_questions_total: nb_questions_total,
                quiz_id: game.quizzesQuiz_id
            });
            return;
        }

        const question = await get_current_question(game.quizzesQuiz_id, game.current_question_index);
        if (!question) {
            throw new SocketError('Question not found');
        }

        const time_limit = this.getTimeLimit(game.difficulty_level);

        // Update the game with the question start time
        const start_time = new Date();
        await persist_game_update(game_id, {
            question_start_time: start_time.toISOString(),
        });

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
            quiz_id: game.quizzesQuiz_id,
            time_available: time_limit + ((game.question_start_time.getTime() - new Date().getTime()) / 1000) < 0 ? 0 : time_limit + ((game.question_start_time.getTime() - new Date().getTime()) / 1000),
            time_limit: time_limit
        });
    }
}