import { Server } from 'socket.io';
import gameSocket from './gameSocket';
import questionSocket from './questionSocket';

const socketHandler = (io: Server) => {
    io.on('connection', (socket) => {
        console.log(`Client connecté: ${socket.id}`);

        gameSocket(io, socket);
        questionSocket(io, socket);

        socket.on('disconnect', () => {
            console.log(`Client déconnecté: ${socket.id}`);
        });
    });
};

export default socketHandler;
