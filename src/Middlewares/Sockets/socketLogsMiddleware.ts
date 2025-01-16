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
export function logEvent(event: string, details: string, socket: Socket) {
    logger.info(`${event} - ${details} [Socket ID: ${socket.id}]`);
}

export const socketLoggerMiddleware = (socket: Socket, next: (err?: any) => void) => {
    logEvent('Connection Attempt', ``, socket);
    next();
};

export const logSocketEvent = (event: string, details: string, socket: Socket) => {
    logEvent(event, details, socket);
};