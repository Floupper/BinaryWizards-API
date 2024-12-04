import { Request, Response, NextFunction } from 'express';

export function checkAuthentication(req: Request, res: Response, next: NextFunction) {
    const user = req.user;

    if (!user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
    }

    next();
}