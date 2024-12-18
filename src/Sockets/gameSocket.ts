import { Server } from 'socket.io';
import { GameControllerFactory } from '../Controllers/Games/Factory/GameControllerFactory';
import { AuthenticatedSocket } from '../Middlewares/Sockets/socketAuthMiddleware';
import { Dependencies } from '../Interfaces/Dependencies';
import { socketCheckGameAccess, socketValidateGameId } from '../Middlewares/Sockets/socketGamesMiddleware';
import { MultiplayerQuestionControllerFactory } from '../Controllers/Questions/Factory/MultiplayerQuestionControllerFactory copy';
import { MultiplayerQuestionControllerInterface } from '../Interfaces/MultiplayerQuestionControllerInterface';
import { SocketError } from './SocketError';

const gameSocket = (io: Server, socket: AuthenticatedSocket) => {
    // Check if the user is authenticated
    if (!socket.user) {
        socket.emit('error', 'Authentication required.');
        return;
    }

    // Set the dependencies for the factory
    const dependencies: Dependencies = { io };

    // Event to join a game
    socket.on('joinGame', async (data: { game_id: string; team_name: string }) => {
        const { game_id, team_name } = data;
        const user = socket.user; // Make sure that socket.user is correctly typed


        try {
            if (!user)
                throw new SocketError('Authentication required to join a game.'); // For ts errors, auth already verified in socketAuthMiddleware

            // Validate the game_id
            await socketValidateGameId(game_id);

            // Check game access
            const game = await socketCheckGameAccess(game_id, user);

            // Get the controller via the factory by passing the dependencies
            const controller = GameControllerFactory.getController(game.mode, dependencies);

            // Call the join method of the controller
            const joinResult = await controller.join(game, { user_id: user.user_id }, { team_name }, socket);
            socket.emit('joinedGame', joinResult);
        } catch (error: any) {
            if (error instanceof SocketError) {
                socket.emit('error', error.message);
            }
            else {
                socket.emit('error', 'Internal server error');
                console.error('Error starting game:', error);
            }
        }
    });

    // Event to start the game
    socket.on('startGame', async (data: { game_id: string }) => {
        const { game_id } = data;
        const user = socket.user;

        try {
            if (!user)
                throw new SocketError('Authentication required to join a game.'); // For ts errors, auth already verified in socketAuthMiddleware
            // Validate the game_id
            await socketValidateGameId(game_id);

            // Check game access
            const game = await socketCheckGameAccess(game_id, user);

            // Get the controller via the factory by passing the dependencies
            const controller = GameControllerFactory.getController(game.mode, dependencies);
            if (user.user_id != game.userUser_id)
                throw new SocketError('Only the game creator can start the game.');

            // Call the start method of the controller
            const startResult = await controller.start(game);
            io.to(game.game_id).emit('gameStarted', startResult);

            // Get the question controller via the factory
            const questionController = MultiplayerQuestionControllerFactory.getController(game.mode, dependencies);
            await (questionController as MultiplayerQuestionControllerInterface).send_question(game, user.user_id, io);
        } catch (error: any) {
            if (error instanceof SocketError) {
                socket.emit('error', error.message);
            }
            else {
                socket.emit('error', 'Internal server error');
                console.error('Error starting game:', error);
            }
        }
    });
};

export default gameSocket;