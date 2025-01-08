import { DefaultEventsMap, Server, Socket } from 'socket.io';
import gameSocket from './gameSocket';
import questionSocket from './questionSocket';
import { logSocketEvent } from '../Middlewares/Sockets/socketLogsMiddleware';
import { connectSocket } from './connectSocket';

const socketHandler = (io: Server) => {
    io.on('connection', (socket) => {
        logSocketEvent("Client connected", "", socket);

        socket.onAny((event: string, ...args: any[]) => {
            const argsString = args.map(arg => JSON.stringify(arg)).join(', ');
            logSocketEvent(event, `Args: ${argsString}`, socket);
        });

        gameSocket(io, socket);
        questionSocket(io, socket);
        connectSocket(io, socket);

        socket.on('disconnect', () => {
            logSocketEvent("Client disconnected", "", socket);
        });
    });
};

export default socketHandler;