import { quiz_id_exists } from "../Repositories/quizzesRepository";
import { NANOID } from "./nanoidsHelper";

export async function generate_quiz_id() {
    let quiz_id = `QU${NANOID()}`;
    while (await quiz_id_exists(quiz_id)) {
        quiz_id = `QU${NANOID()}`;
    }
    return `QU${NANOID()}`;
}
