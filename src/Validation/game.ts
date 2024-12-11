import { object, string, number, optional, refine, size, pattern, enums, array } from 'superstruct';



export const GAMEID = pattern(
    string(),
    /^GA[A-Z0-9]{6}$/i
);



const TeamContentStruct = object({
    name: string(),
    players: array(string())
});


export const GameInitData = object({
    mode: enums(['standard', 'time', 'scrum', 'team']),
    difficulty_level: optional(enums(['easy', 'medium', 'hard'])),
    max_players: optional(number()),
});
