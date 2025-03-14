import { Server } from 'socket.io';
import { GameControllerFactory } from '../Controllers/Games/Factory/GameControllerFactory';
import { AuthenticatedSocket } from '../Middlewares/Sockets/socketAuthMiddleware';
import { Dependencies } from '../Interfaces/Dependencies';
import { socketCheckGameAccess, socketValidateGameId } from '../Middlewares/Sockets/socketGamesMiddleware';
import { MultiplayerQuestionControllerFactory } from '../Controllers/Questions/Factory/MultiplayerQuestionControllerFactory copy';
import { MultiplayerQuestionControllerInterface } from '../Interfaces/MultiplayerQuestionControllerInterface';
import { SocketError } from './SocketError';
import { get_game } from '../Repositories/gamesRepository';
import { get_user_multiplayer_games } from '../Repositories/usersRepository';
import { get_total_questions_count } from '../Helpers/questionsHelper';
import { logSocketEvent } from '../Middlewares/Sockets/socketLogsMiddleware';

export const connectSocket = async (io: Server, socket: AuthenticatedSocket) => {
    // Check if the user is authenticated
    if (!socket.user) {
        socket.emit('error', 'Authentication required.');
        return;
    }

    const user = socket.user;


    try {
        if (!user)
            throw new SocketError('Authentication required to join a game.'); // For ts errors, auth already verified in socketAuthMiddleware
        const user_games = await get_user_multiplayer_games(socket.user.user_id);



        logSocketEvent("Connecting client to all his active rooms", "Process START", socket);
        user_games.forEach(async game => {
            const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);

            if (game.current_question_index < nb_questions_total) {
                if (socket.rooms.has(game.game_id) === false) {
                    socket.join(game.game_id);
                    logSocketEvent(`\tUser ${user.user_id} joined room ${game.game_id}`, `Current room question index (${game.current_question_index})`, socket);
                }
                else {
                    logSocketEvent(`\tUser ${user.user_id} already in room ${game.game_id}`, `Current room question index (${game.current_question_index})`, socket);
                }
            }
        });
        logSocketEvent("Connecting client to all his active rooms", "Process END", socket);

    } catch (error: any) {
        if (error instanceof SocketError) {
            logSocketEvent("Socket error in connect function", error.message, socket);
            socket.emit('error', error.message);
        }
        else {
            logSocketEvent("Generic error in connect function", error, socket);
            socket.emit('error', 'Internal server error');
        }
    }
}