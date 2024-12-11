import { object, string, number, optional, refine, size, pattern, enums } from 'superstruct';



export const GAMEID = pattern(
    string(),
    /^GA[A-Z0-9]{6}$/i
);


export const GameCreationData = object({
    mode: enums(['standard', 'time', 'scrum', 'team'])
});