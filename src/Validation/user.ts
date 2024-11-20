import { object, string } from 'superstruct';


export const UserCreationData = object({
    username: string(),
    password: string()
});