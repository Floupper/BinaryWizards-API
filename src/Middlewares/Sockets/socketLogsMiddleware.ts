import { Socket } from 'socket.io';
import { createLogger, format, transports } from 'winston';


const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
        new transports.Console(),
    ],
});
export function logEvent(event: string, details: string) {
    logger.info(`${event} - ${details}`);
}

export const socketLoggerMiddleware = (socket: Socket, next: (err?: any) => void) => {
    logEvent('Connection Attempt', `Socket ID: ${socket.id} Attempting to connect.`);
    next();
};

export const logSocketEvent = (event: string, details: string) => {
    logEvent(event, details);
};