import { MultiplayerQuestionControllerInterface } from '../../../Interfaces/MultiplayerQuestionControllerInterface';
import { Dependencies } from '../../../Interfaces/Dependencies';
import { TeamQuestionController } from '../TeamQuestionController';

export class MultiplayerQuestionControllerFactory {
    static getController(mode: string, dependencies: Dependencies): MultiplayerQuestionControllerInterface {
        switch (mode) {
            case 'team':
                if (!dependencies.io) {
                    throw new Error('Socket.IO server instance is required for team question controller');
                }
                return new TeamQuestionController(dependencies.io);
            default:
                throw new Error('Invalid game mode');
        }
    }
}
