import { SingleplayerQuestionControllerInterface } from '../../../Interfaces/SingleplayerQuestionControllerInterface';
import { StandardQuestionController } from '../StandardQuestionController';
import { TimeQuestionController } from '../TimeQuestionController';
import { Dependencies } from '../../../Interfaces/Dependencies';

export class SingleplayerQuestionControllerFactory {
    static getController(mode: string): SingleplayerQuestionControllerInterface {
        switch (mode) {
            case 'standard':
                return new StandardQuestionController();
            case 'time':
                return new TimeQuestionController();
            default:
                throw new Error('Invalid game mode');
        }
    }
}
