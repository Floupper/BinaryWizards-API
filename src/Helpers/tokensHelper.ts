import jwt from 'jsonwebtoken';

export function get_token(user_id: string, username: string) {
    const token = jwt.sign(
        { user_id: user_id, username: username },
        process.env.JWT_SECRET as string,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    return token;
}