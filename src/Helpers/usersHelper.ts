import { get_user } from "../Repositories/usersRepository";

export async function is_username_avaible(username: string) {
    const user = await get_user(username);
    return user === null;
}