import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const verifyJwtToken = (req: Request, res: Response, next: NextFunction) => {
    // Retrieve user's token from the Authorization header
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1]; // Format is "Bearer token"

        // Vérifier le token
        jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
            if (err) {
                // If token is invalid, inform the client
                return res.status(401).json({ error: 'Token is invalid or expired' });
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