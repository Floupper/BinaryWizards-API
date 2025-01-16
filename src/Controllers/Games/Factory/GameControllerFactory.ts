import { GameControllerInterface } from '../../../Interfaces/GameControllerInterface';
import { StandardGameController } from '../StandardGameController';
import { TimeGameController } from '../TimeGameController';
import { ScrumGameController } from '../ScrumGameController';
import { TeamGameController } from '../TeamGameController';
import { Dependencies } from '../../../Interfaces/Dependencies';

export class GameControllerFactory {
    static getController(mode: string, dependencies: Dependencies | null): GameControllerInterface {
        switch (mode) {
            case 'standard':
                return new StandardGameController();
            case 'time':
                return new TimeGameController();
            case 'scrum':
                return new ScrumGameController(dependencies?.io ?? null);
            case 'team':
                return new TeamGameController(dependencies?.io ?? null);
            default:
                throw new Error('Invalid mode');
        }
    }
}