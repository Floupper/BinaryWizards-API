import { Socket } from 'socket.io';
import { createLogger, format, transports } from 'winston';


// Create a Winston logger instance
const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'DD/MM/YYYY HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
        new transports.Console()
    ],
});

// Logging function
export function logEvent(event: string, details: string) {
    logger.info(`${event} - ${details}`);
}

// Logging middleware for Socket.IO connections
export const socketLoggerMiddleware = (socket: Socket, next: (err?: any) => void) => {
    logEvent('Connection Attempt', `Socket ID: ${socket.id} Attempting to connect.`);
    next();
};

// Function to log specific events
export const logSocketEvent = (event: string, details: string) => {
    logEvent(event, details);
};