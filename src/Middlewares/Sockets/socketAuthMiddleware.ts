import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SocketError } from '../../Sockets/SocketError';
import { logEvent } from './socketLogsMiddleware';

export interface AuthenticatedSocket extends Socket {
    user?: {
        user_id: string;
        username: string;
    };
}

export const socketAuthMiddleware = (socket: AuthenticatedSocket, next: (err?: any) => void) => {
    const authHeader = socket.handshake.headers['authorization'] as string;
    if (!authHeader || !socket.user?.user_id || socket.user.user_id === undefined || socket.user.user_id === '') {
        logEvent('Connection refused', 'Missing authorization header', socket);
        return next(new SocketError("Missing authorization header"));
    }

    const token = authHeader.split(' ')[1]; // Assume the format is "Bearer <token>"
    if (!token) {
        logEvent('Connection refused', 'Missing auth token', socket);
        return next(new SocketError("Missing token"));
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
        if (err) {
            logEvent('Connection refused', 'Authentication failed', socket);
            return next(new SocketError('Authentication failed'));
        }
        // Attach user information to the socket
        socket.user = decoded as { user_id: string; username: string };
        next();
    });
};