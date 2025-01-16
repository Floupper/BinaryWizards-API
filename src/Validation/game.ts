import { object, string, number, optional, refine, size, pattern, enums, array } from 'superstruct';



export const GAMEID = pattern(
    string(),
    /^GA[A-Z0-9]{6}$/i
);

export const GameInitData = object({
    mode: enums(['standard', 'time', 'scrum', 'team']),
    difficulty_level: optional(enums(['easy', 'medium', 'hard'])),
    teams: optional(array(string())),
    max_players: optional(number()),
});
