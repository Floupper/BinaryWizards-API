import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { SocketError } from '../../Sockets/SocketError';

export interface AuthenticatedSocket extends Socket {
    user?: {
        user_id: string;
        username: string;
    };
}

export const socketAuthMiddleware = (socket: AuthenticatedSocket, next: (err?: any) => void) => {
    const authHeader = socket.handshake.headers['authorization'] as string;
    if (!authHeader) {
        return next(new SocketError("Missing authorization header"));
    }

    const token = authHeader.split(' ')[1]; // Assume the format is "Bearer <token>"
    if (!token) {
        return next(new SocketError("Missing token"));
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err: any, decoded: any) => {
        if (err) {
            return next(new SocketError('Authentication error'));
        }
        // Attach user information to the socket
        socket.user = decoded as { user_id: string; username: string };
        next();
    });
};