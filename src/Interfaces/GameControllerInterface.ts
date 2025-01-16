import { Games } from "@prisma/client";
import { Socket } from "socket.io";

export interface GameControllerInterface {
    init(quiz_id: string, user_id: string | null, data: any): Promise<any>;
    join(game: Games, user: any, data: any, socket: Socket): Promise<any>;
    start(game: Games): Promise<any>;
    game_informations(game: Games, user_id: string): Promise<any>;
    switch_team(game: Games, user_id: string, new_team_name: string): Promise<void>;
    leave_game(game_id: string, user_id: string): Promise<void>;
}