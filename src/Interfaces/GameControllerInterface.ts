export interface GameControllerInterface {
    init(quiz_id: string, user_id: string | null, data: any): Promise<any>;
    join(game: any, user: any, data: any): Promise<any>;
    start(game: any, user: any): Promise<any>;
}