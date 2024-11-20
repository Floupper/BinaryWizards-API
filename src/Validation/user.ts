import { object, string } from 'superstruct';


export const UserData = object({
    username: string(),
    password: string()
});