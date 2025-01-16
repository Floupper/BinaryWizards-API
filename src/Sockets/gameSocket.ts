import { Server } from 'socket.io';
import { GameControllerFactory } from '../Controllers/Games/Factory/GameControllerFactory';
import { AuthenticatedSocket } from '../Middlewares/Sockets/socketAuthMiddleware';
import { Dependencies } from '../Interfaces/Dependencies';
import { socketCheckGameAccess, socketValidateGameId } from '../Middlewares/Sockets/socketGamesMiddleware';
import { MultiplayerQuestionControllerFactory } from '../Controllers/Questions/Factory/MultiplayerQuestionControllerFactory copy';
import { MultiplayerQuestionControllerInterface } from '../Interfaces/MultiplayerQuestionControllerInterface';
import { SocketError } from './SocketError';
import { get_game } from '../Repositories/gamesRepository';
import { logSocketEvent } from '../Middlewares/Sockets/socketLogsMiddleware';
import { TeamGameController } from '../Controllers/Games/TeamGameController';

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
            const game = await socketCheckGameAccess(game_id, user, true);

            if (!game) {
                throw new SocketError('Game not found');
            }

            console.log('user: ');
            console.log(user);
            console.log('team_name: ', team_name);
            console.log('game: ');
            console.log(game);

            // Get the controller via the factory by passing the dependencies
            const controller = GameControllerFactory.getController(game.mode, dependencies);

            // Call the join method of the controller
            const joinResult = await controller.join(game, { user_id: user.user_id }, { team_name }, socket);
            socket.emit('joinedGame', joinResult);
        } catch (error: any) {
            if (error instanceof SocketError) {
                logSocketEvent("Socket error in join game function", error.message, socket);
                socket.emit('error', error.message);
            }
            else {
                logSocketEvent("Generic error in join game function", error, socket);
                socket.emit('error', 'Internal server error');
            }
        }
    });

    socket.on('leaveGame', async (data: { game_id: string }) => {
        const { game_id } = data;
        const user = socket.user;

        try {
            if (!user)
                throw new SocketError('Authentication required to join a game.'); // For ts errors, auth already verified in socketAuthMiddleware
            // Validate the game_id
            await socketValidateGameId(game_id);

            // Check game access
            const game = await socketCheckGameAccess(game_id, user, false);

            // Get the controller via the factory by passing the dependencies
            const controller = GameControllerFactory.getController(game.mode, dependencies);

            await controller.leave_game(game.game_id, user.user_id, socket);
        } catch (error: any) {
            if (error instanceof SocketError) {
                logSocketEvent("Socket error in leave game function", error.message, socket);
                socket.emit('error', error.message);
            }
            else {
                logSocketEvent("Generic error in leave game function", error, socket);
                socket.emit('error', 'Internal server error');
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
            const game = await socketCheckGameAccess(game_id, user, false);

            if (game.status === 'started') {
                throw new SocketError('Game already started.');
            }

            // Get the controller via the factory by passing the dependencies
            const controller = GameControllerFactory.getController(game.mode, dependencies);
            if (user.user_id != game.userUser_id)
                throw new SocketError('Only the game creator can start the game.');

            // Call the start method of the controller
            const startResult = await controller.start(game);
            io.to(game.game_id).emit('gameStarted', startResult);

            // Get the question controller via the factory
            const questionController = MultiplayerQuestionControllerFactory.getController(game.mode, dependencies);
            await (questionController as MultiplayerQuestionControllerInterface).send_question(game, user.user_id, socket);
        } catch (error: any) {
            if (error instanceof SocketError) {
                logSocketEvent("Socket error in start game function", error.message, socket);
                socket.emit('error', error.message);
            }
            else {
                logSocketEvent("Generic error in start game function", error, socket);
                socket.emit('error', 'Internal server error');
            }
        }
    });


    socket.on('getGameInformations', async (data: { game_id: string }) => {
        const { game_id } = data;
        const user = socket.user;
        try {
            if (!user)
                throw new SocketError('Authentication required to get a game\'s information.'); // For ts errors, auth already verified in socketAuthMiddleware
            // Validate the game_id
            await socketValidateGameId(game_id);

            // Check game access
            const game = await socketCheckGameAccess(game_id, user, false);

            // Get the controller via the factory by passing the dependencies
            const controller = GameControllerFactory.getController(game.mode, dependencies);

            const game_informations = await controller.game_informations(game, user.user_id);
            socket.emit('gameInformations', game_informations);
        } catch (error: any) {
            if (error instanceof SocketError) {
                logSocketEvent("Socket error in getGameInformations function", error.message, socket);
                socket.emit('error', error.message);
            }
            else {
                logSocketEvent("Generic error in getGameInformations function", error, socket);
                socket.emit('error', 'Internal server error');
            }
        }
    });


    socket.on('switchTeam', async (data: { game_id: string, new_team_name: string }) => {
        const { game_id, new_team_name } = data;
        const user = socket.user;
        try {
            if (!user)
                throw new SocketError('Authentication required to get a game\'s information.'); // For ts errors, auth already verified in socketAuthMiddleware
            // Validate the game_id
            await socketValidateGameId(game_id);

            // Check game access
            const game = await socketCheckGameAccess(game_id, user, false);

            if (!new_team_name || new_team_name.length == 0)
                throw new SocketError('The new team name cannot be empty.');

            // Get the controller via the factory by passing the dependencies
            const controller = GameControllerFactory.getController(game.mode, dependencies);

            await controller.switch_team(game, user.user_id, new_team_name);
        } catch (error: any) {
            if (error instanceof SocketError) {
                logSocketEvent("Socket error in getGameInformations function", error.message, socket);
                socket.emit('error', error.message);
            }
            else {
                logSocketEvent("Generic error in getGameInformations function", error, socket);
                socket.emit('error', 'Internal server error');
            }
        }
    });

};

export default gameSocket;