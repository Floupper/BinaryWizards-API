import { Request, Response, NextFunction } from 'express';

function formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}


// Logging middleware
export function requestLogger(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    console.log(`[${formatDate(new Date())}] ${req.method} ${req.originalUrl}`);
    if (req.params && Object.keys(req.params).length > 0) {
        console.log('Params:', req.params);
    }

    if (req.query && Object.keys(req.query).length > 0) {
        console.log('Query:', req.query);
    }

    if (req.body && Object.keys(req.body).length > 0) {
        console.log('Body:', req.body);
    }
    res.on('finish', () => {
        const elapsedTime = Date.now() - startTime;
        console.log(`[${formatDate(new Date())}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Temps: ${elapsedTime} ms`);
    });

    next();
}