import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyJwtToken = (req: Request, res: Response, next: NextFunction) => {
    // Retrieve user's token from the Authorization header
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Suposing format is "Bearer token"

        // Vérifier le token
        jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
            if (err) {
                // If token is invalid, continue without authentication
                return next();
            }

            // Attach users informations to the request
            req.user = user as { user_id: string; username: string } | undefined;
            next();
        });
    } else {
        // If no token is provided, continue without authentication
        next();
    }
};