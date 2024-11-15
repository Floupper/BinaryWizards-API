import { NANOID } from "./nanoidsHelper";

export function generate_quiz_id(): string {
    return `QU${NANOID()}`;
}