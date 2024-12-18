import { Games } from '@prisma/client';
import { Request, Response } from 'express';
import { Server } from 'socket.io';

export interface MultiplayerQuestionControllerInterface {
    send_question(game: Games, user_id: string, io: Server): Promise<void>;
    get_answer(game: Games, question_index: number, option_index: number, user_id: string, io: Server): Promise<void>;
}