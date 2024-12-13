import { GameControllerInterface } from '../../Interfaces/GameControllerInterface';
import { add_player_to_scrum_game, count_players_in_game, is_scrum_player, persist_game, update_game_status } from '../../Repositories/gamesRepository';

export class ScrumGameController implements GameControllerInterface {
    async init(quiz_id: string, user_id: string | null, data: any) {
        const { max_players } = data;
        if (!user_id) {
            throw new Error('You have to be authenticated to create a Scrum game.');
        }
        if (!max_players) {
            throw new Error('max_players is required for scrum mode');
        }
        return await this.init_scrum_game(quiz_id, user_id, max_players);
    }

    async join(game: any, user: any, data: any) {
        // Verifying if user has already joined
        const alreadyJoined = await is_scrum_player(game.game_id, user.user_id);

        if (alreadyJoined) {
            throw new Error('You have already joined this game.');
        }

        // Make sure the game is not full
        if (game.max_players && (await count_players_in_game(game.game_id)) >= game.max_players) {
            throw new Error('Scrum game is full.');
        }


        await add_player_to_scrum_game(game.game_id, user.user_id);

        // Automatically start the game if the game is already full
        if (game.max_players && (await count_players_in_game(game.game_id)) >= game.max_players) {
            await update_game_status(game.game_id, 'started');
            // TODO: démarrer automatiquement le jeu lorsque tous les joueurs sont dans le jeu
        }

        return { message: 'Scrum game successfully joined.' };
    }


    async start(game: any, user: any) {
        if (!game.max_players) {
            throw new Error('The maximum number of players must be defined in Scrum mode.');
        }

        const currentPlayers = await count_players_in_game(game.game_id);
        if (currentPlayers < game.max_players) {
            throw new Error(`The number of players was not reached. (${currentPlayers}/${game.max_players})`);
        }

        await update_game_status(game.game_id, 'started');

        return { message: 'Scrum game started.' };
    }




    async init_scrum_game(quiz_id: string, user_id: string, max_players: number) {
        const newGame = await persist_game(
            quiz_id,
            user_id,
            'scrum',
            null,
            max_players,
            'pending',
        );

        // Adding creator to the game
        await add_player_to_scrum_game(newGame.game_id, user_id!);

        return newGame;
    }
}

