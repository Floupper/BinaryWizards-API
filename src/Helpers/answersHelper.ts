import { Games } from "@prisma/client";
import { count_correct_answers_multiplayer, count_correct_answers_singleplayer, get_correct_answers } from "../Repositories/answersRepository";
import { user_team_in_game } from "../Repositories/teamsRepository";
import { Server } from "socket.io";
import { persist_game_update } from "../Repositories/gamesRepository";
import { get_current_question } from "../Repositories/questionsRepository";
import { get_correct_option_index, get_total_questions_count } from "./questionsHelper";
import { ScrumQuestionController } from "../Controllers/Questions/ScrumQuestionController";
import { get_scrum_scores } from "./gamesHelper";


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







class ScrumQuestionTimeoutManager {
    private static instance: ScrumQuestionTimeoutManager;
    private timeouts: Map<string, NodeJS.Timeout>;
    private questionStart: Date | null;
    private readonly questionDuration: number = 30000;

    private constructor() {
        this.timeouts = new Map();
        this.questionStart = null;
    }

    public static getInstance(): ScrumQuestionTimeoutManager {
        if (!ScrumQuestionTimeoutManager.instance) {
            ScrumQuestionTimeoutManager.instance = new ScrumQuestionTimeoutManager();
        }
        return ScrumQuestionTimeoutManager.instance;
    }

    public startQuestionTimeout(game: Games, io: Server): void {
        // Clear any existing timeout
        this.clearTimeout(game.game_id);

        const current_index = game.current_question_index;
        this.questionStart = new Date();

        const timeout = setTimeout(async () => {
            try {
                const nb_questions_total = await get_total_questions_count(game.quizzesQuiz_id);
                if (game.current_question_index >= nb_questions_total) {
                    const ranking = await get_scrum_scores(game.game_id);
                    clearQuestionTimeout(game.game_id);
                    io.to(game.game_id).emit('gameFinished', {
                        nb_questions_total: nb_questions_total,
                        quiz_id: game.quizzesQuiz_id,
                        ranking: ranking
                    });
                    return;
                }

                if (current_index === game.current_question_index && this.questionStart !== null) {
                    const currentGame = await persist_game_update(game.game_id, {
                        question_start_time: null,
                        current_question_index: game.current_question_index + 1
                    });

                    const question = await get_current_question(game.quizzesQuiz_id, game.current_question_index);
                    if (question) {
                        // Emit the correct answer before moving to the next question
                        io.to(game.game_id).emit('answerResult', {
                            correct_option_index: get_correct_option_index(question),
                            time_remaining: getAnswerTimeDisplay(game.game_id)
                        });

                        game = await persist_game_update(game.game_id, {
                            question_start_time: null
                        });

                        await new Promise(resolve => setTimeout(resolve, getAnswerTimeDisplay(game.game_id)));

                        game = await persist_game_update(game.game_id, {
                            current_question_index: game.current_question_index + 1
                        });
                    }

                    // Send the next question
                    const controller = new ScrumQuestionController(io);
                    await controller.send_question(currentGame);
                }
            } catch (error) {
                console.error('Error in question timeout handler:', error);
                throw new Error('Error in question timeout handler');
            }
        }, this.questionDuration);

        this.timeouts.set(game.game_id, timeout);
    }

    public getQuestionTimeRemaining(gameId: string): number {
        const startTime = this.questionStart;
        if (!startTime) {
            return 0;
        }

        const currentTime = new Date();
        const elapsedTime = currentTime.getTime() - startTime.getTime();
        const remainingTime = Math.max(0, this.questionDuration - elapsedTime);

        if (remainingTime === 0) {
            this.clearTimeout(gameId);
        }

        return remainingTime;
    }


    public clearTimeout(gameId: string): void {
        this.questionStart = null;
        const existingTimeout = this.timeouts.get(gameId);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
            this.timeouts.delete(gameId);
        }
    }


    public clearGame(gameId: string): void {
        this.clearTimeout(gameId);
    }
}

export function startQuestionTimeout(game: Games, io: Server): void {
    ScrumQuestionTimeoutManager.getInstance().startQuestionTimeout(game, io);
}

export function clearQuestionTimeout(gameId: string): void {
    ScrumQuestionTimeoutManager.getInstance().clearTimeout(gameId);
}

export function getQuestionTimeout(game_id: string) {
    return ScrumQuestionTimeoutManager.getInstance().getQuestionTimeRemaining(game_id);
}