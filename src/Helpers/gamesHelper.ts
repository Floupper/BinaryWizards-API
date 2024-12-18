import { game_id_exists } from "../Repositories/gamesRepository";
import { NANOID } from "./nanoidsHelper";


export async function generate_game_id() {
    let quiz_id = `GA${NANOID()}`;
    while (await game_id_exists(quiz_id)) {
        quiz_id = `GA${NANOID()}`;
    }
    return `GA${NANOID()}`;
}

export function generate_game_link(gameId: string): string {
    return `/game/join/${gameId}`;
}