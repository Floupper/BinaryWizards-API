import { MultiplayerQuestionControllerInterface } from '../../../Interfaces/MultiplayerQuestionControllerInterface';
import { Dependencies } from '../../../Interfaces/Dependencies';
import { TeamQuestionController } from '../TeamQuestionController';
import { ScrumQuestionController } from '../ScrumQuestionController';

export class MultiplayerQuestionControllerFactory {
    static getController(mode: string, dependencies: Dependencies): MultiplayerQuestionControllerInterface {
        switch (mode) {
            case 'team':
                if (!dependencies.io) {
                    throw new Error('Socket.IO server instance is required for team question controller');
                }
                return new TeamQuestionController(dependencies.io);
            case 'scrum':
                if (!dependencies.io) {
                    throw new Error('Socket.IO server instance is required for scrum question controller');
                }
                return new ScrumQuestionController(dependencies.io);
            default:
                throw new Error('Invalid game mode');
        }
    }
}
