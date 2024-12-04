import { object, string, number, optional, refine, size, pattern } from 'superstruct';



export const GAMEID = pattern(
    string(),
    /^GA[A-Z0-9]{6}$/i
);