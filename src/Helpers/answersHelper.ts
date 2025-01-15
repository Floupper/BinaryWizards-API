import { count_correct_answers_multiplayer, count_correct_answers_singleplayer, get_correct_answers } from "../Repositories/answersRepository";
import { user_team_in_game } from "../Repositories/teamsRepository";


export async function get_correct_answers_count(game_id: string, user_id?: string | null): Promise<number> {
    if (!user_id) {
        // singleplayer
        return await count_correct_answers_singleplayer(game_id);
    } else {
        // multiplayer
        const user_team = await user_team_in_game(game_id, user_id);

        if (!user_team) {
            throw new Error("User is not in the game");
        }

        return await count_correct_answers_multiplayer(game_id, user_id);
    }
}


class AnswerTimeManager {
    private static instance: AnswerTimeManager;
    private answerStartTimes: Map<string, Date>;
    private readonly displayDuration: number = 5000;

    private constructor() {
        this.answerStartTimes = new Map();
    }

    public static getInstance(): AnswerTimeManager {
        if (!AnswerTimeManager.instance) {
            AnswerTimeManager.instance = new AnswerTimeManager();
        }
        return AnswerTimeManager.instance;
    }

    public startAnswerDisplay(gameId: string): void {
        this.answerStartTimes.set(gameId, new Date());
    }

    public getTimeRemaining(gameId: string): number {
        const startTime = this.answerStartTimes.get(gameId);

        if (!startTime) {
            return this.displayDuration;
        }

        const currentTime = new Date();
        const elapsedTime = currentTime.getTime() - startTime.getTime();
        const remainingTime = Math.max(0, this.displayDuration - elapsedTime);

        if (remainingTime === 0) {
            this.answerStartTimes.delete(gameId);
        }

        return remainingTime;
    }

    public clearGame(gameId: string): void {
        this.answerStartTimes.delete(gameId);
    }
}

export function getAnswerTimeDisplay(gameId: string): number {
    return AnswerTimeManager.getInstance().getTimeRemaining(gameId);
}

export function startAnswerDisplay(gameId: string): void {
    AnswerTimeManager.getInstance().startAnswerDisplay(gameId);
}