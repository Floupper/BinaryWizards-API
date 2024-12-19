import { Server } from 'socket.io';
import gameSocket from './gameSocket';
import questionSocket from './questionSocket';
import { logSocketEvent } from '../Middlewares/Sockets/socketLogsMiddleware';

const socketHandler = (io: Server) => {
    io.on('connection', (socket) => {
        console.log(`Client connected: ${socket.id}`);

        socket.onAny((event: string, ...args: any[]) => {
            const argsString = args.map(arg => JSON.stringify(arg)).join(', ');
            logSocketEvent(event, `Args: ${argsString}`);
        });

        gameSocket(io, socket);
        questionSocket(io, socket);

        socket.on('disconnect', () => {
            console.log(`Client disconnected: ${socket.id}`);
        });
    });
};

export default socketHandler;
