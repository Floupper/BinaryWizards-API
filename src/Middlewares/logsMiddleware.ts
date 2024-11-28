import { Request, Response, NextFunction } from 'express';

// Middleware de logging
export function requestLogger(req: Request, res: Response, next: NextFunction) {
    // Capturez la date de début de la requête
    const startTime = Date.now();

    // Enregistrez les informations sur la requête reçue
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);

    // Attendez la fin de la requête pour enregistrer les informations sur la réponse
    res.on('finish', () => {
        const elapsedTime = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - Temps: ${elapsedTime} ms`);
    });

    // Passez au middleware suivant
    next();
}