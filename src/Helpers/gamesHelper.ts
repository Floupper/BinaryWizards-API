import { NANOID } from "./nanoidsHelper";

export function generate_game_id(): string {
    return `GA${NANOID()}`;
}