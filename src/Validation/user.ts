import { object, size, string } from 'superstruct';


export const UserData = object({
    username: string(),
    password: size(string(), 8, 64),
});