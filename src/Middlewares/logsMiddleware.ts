import { Request, Response, NextFunction } from 'express';

// Logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);

    res.on('finish', () => {
        const elapsedTime = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Temps: ${elapsedTime} ms`);
    });

    next();
}