import { get_user } from "../Repositories/usersRepository";

export async function is_username_available(username: string) {
    const user = await get_user(username);
    return user === null;
}