import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../Middlewares/Sockets/socketAuthMiddleware';
import { MultiplayerQuestionControllerFactory } from '../Controllers/Questions/Factory/MultiplayerQuestionControllerFactory copy';
import { socketCheckGameAccess, socketValidateGameId } from '../Middlewares/Sockets/socketGamesMiddleware';
import { Dependencies } from '../Interfaces/Dependencies';
import { MultiplayerQuestionControllerInterface } from '../Interfaces/MultiplayerQuestionControllerInterface';
import { SocketError } from './SocketError';
import { logSocketEvent } from '../Middlewares/Sockets/socketLogsMiddleware';


const questionSocket = (io: Server, socket: AuthenticatedSocket) => {
    // Check if the user is authenticated
    if (!socket.user) {
        socket.emit('error', 'Authentication required.');
        return;
    }

    // Set the dependencies for the factory
    const dependencies: Dependencies = { io };

    // Event to send an answer
    socket.on('sendAnswer', async (data: { game_id: string; question_index: number; option_index: number; }) => {
        const { game_id, question_index, option_index } = data;
        const user = socket.user;

        try {
            if (!user)
                throw new SocketError('Authentication required to join a game.'); // For ts errors, auth already verified in socketAuthMiddleware
            // Validate the game_id
            await socketValidateGameId(game_id);

            // Check game access
            const game = await socketCheckGameAccess(game_id, user, false);

            // Get the question controller via the factory by passing the dependencies
            const questionController = MultiplayerQuestionControllerFactory.getController(game.mode, dependencies);

            // Call the handleTeamAnswer method of the controller
            await (questionController as MultiplayerQuestionControllerInterface).get_answer(game, question_index, option_index, user.user_id, io, socket);
        } catch (error: any) {
            if (error instanceof SocketError) {
                logSocketEvent("Socket error in sendAnswer function", error.message, socket);
                socket.emit('error', error.message);
            }
            else {
                logSocketEvent("Generic error in sendAnswer function", error, socket);
                socket.emit('error', 'Internal server error');
            }
        }
    });


    socket.on('getQuestionInformations', async (data: { game_id: string }) => {
        const { game_id } = data;
        const user = socket.user;
        try {
            if (!user)
                throw new SocketError('Authentication required to get question informations.'); // For ts errors, auth already verified in socketAuthMiddleware
            // Validate the game_id
            await socketValidateGameId(game_id);

            // Check game access
            const game = await socketCheckGameAccess(game_id, user, false);

            // Get the controller via the factory by passing the dependencies
            const controller = MultiplayerQuestionControllerFactory.getController(game.mode, dependencies);

            await controller.get_current_question(game, user.user_id, socket);
        } catch (error: any) {
            if (error instanceof SocketError) {
                logSocketEvent("Socket error in getQuestionInformations function", error.message, socket);
                socket.emit('error', error.message);
            }
            else {
                logSocketEvent("Generic error in getQuestionInformations function", error, socket);
                socket.emit('error', 'Internal server error');
            }
        }
    });
};


export default questionSocket;