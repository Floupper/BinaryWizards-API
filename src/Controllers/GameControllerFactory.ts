import { GameControllerInterface } from '../Interfaces/GameControllerInterface';
import { StandardGameController } from './Modes/StandardGameController';
import { TimeGameController } from './Modes/TimeGameController';
import { ScrumGameController } from './Modes/ScrumGameController';
import { TeamGameController } from './Modes/TeamGameController';

export class GameControllerFactory {
    static getController(mode: string): GameControllerInterface {
        switch (mode) {
            case 'standard':
                return new StandardGameController();
            case 'time':
                return new TimeGameController();
            case 'scrum':
                return new ScrumGameController();
            case 'team':
                return new TeamGameController();
            default:
                throw new Error('Invalid mode');
        }
    }
}