import { assert } from 'superstruct';
import { Request, Response } from 'express';
import { UserCreationData } from '../Validation/user';
import { is_username_avaible } from '../Helpers/usersHelper';
import { create_user } from '../Repositories/usersRepository';


export async function create_one(req: Request, res: Response) {
    try {
        assert(req.body, UserCreationData);
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