import app from './app';
import fs from 'fs';
import http from 'http'; // Import the 'http' module
import https from 'https';
import { Server } from 'socket.io';
import socketHandler from './Sockets/socketIndex'; // Import the main socket handler
import { socketAuthMiddleware } from './Middlewares/Sockets/socketAuthMiddleware';
import { socketLoggerMiddleware } from './Middlewares/Sockets/socketLogsMiddleware';

// Port number
const httpsPort = Number(process.env.PORT) || 33012;

let sslOptions: https.ServerOptions = {};
if (process.env.APP_ENV === 'server') {
  try {
    sslOptions = {
      key: fs.readFileSync(process.env.key as string),
      cert: fs.readFileSync(process.env.cert as string),
    };
    console.log('SSL certificates loaded successfully.');
  } catch (err) {
    console.error('Error loading SSL certificates:', err);
  }
}

// Create the HTTP or HTTPS server
const server = process.env.APP_ENV === 'server'
  ? https.createServer(sslOptions, app)
  : http.createServer(app); // Create a standard HTTP server

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Use the authentication middleware
io.use(socketLoggerMiddleware);
io.use(socketAuthMiddleware);

// Initialize the socket handlers
socketHandler(io);

// Start the server
server.listen(httpsPort, () => {
  console.log(`🚀 Server running on ${process.env.APP_ENV === 'server' ? 'https' : 'http'}://localhost:${httpsPort}`);
});