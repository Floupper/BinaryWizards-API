import { assert } from 'superstruct';
import { Request, Response } from 'express';
import { UserData } from '../Validation/user';
import { is_username_avaible } from '../Helpers/usersHelper';
import { create_user, get_user } from '../Repositories/usersRepository';
import { get_token } from '../Helpers/tokensHelper';


export async function create_one(req: Request, res: Response) {
    try {
        assert(req.body, UserData);
    } catch (error) {
        res.status(400).json({ message: 'Data is invalid' });
        return;
    }


    try {
        if (!(await is_username_avaible(req.body.username))) {
            return res.status(409).json({ error: 'Username already exists' });
        }

        const user = await create_user(req.body.username, req.body.password);

        res.status(201).json({ user_id: user.user_id });
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


export async function username_avaible(req: Request, res: Response) {
    const { username } = req.body;

    if (!username) {
        res.status(400).json({ message: 'Username is required' });
    }

    try {
        const is_available = await is_username_avaible(username);
        res.json({ is_available });
    }
    catch (error) {
        console.error('Error checking username availability:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


export async function sign_in(req: Request, res: Response) {
    const { username, password } = req.body;

    try {
        assert(req.body, UserData);
    } catch (error) {
        res.status(400).json({ message: 'Data is invalid' });
        return;
    }

    try {
        const user = await get_user(username);

        if (!user) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        if (user.password !== password) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }
        const token = get_token(user.user_id, username);
        res.status(200).json({ token });
    }

    catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}