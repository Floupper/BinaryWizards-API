import { Socket } from "socket.io";

export interface GameControllerInterface {
    init(quiz_id: string, user_id: string | null, data: any): Promise<any>;
    join(game: any, user: any, data: any, socket: Socket): Promise<any>;
    start(game: any): Promise<any>;
}