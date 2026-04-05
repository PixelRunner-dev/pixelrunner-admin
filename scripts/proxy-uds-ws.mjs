import WebSocket, { WebSocketServer } from 'ws';
import fs from 'fs';

const TCP_PORT = 8765;
// const SOCKET = '/run/app/controller.sock';
const SOCKET = '/tmp/controller.sock';

const server = new WebSocketServer({ port: TCP_PORT, host: '0.0.0.0' });

// Add error handling for server startup
server.on('error', (err) => {
  console.error('WebSocket server error:', err.message);
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${TCP_PORT} is already in use. Is another instance running?`);
  }
  process.exit(1);
});

// Log when server is ready
server.on('listening', () => {
  console.log(`[proxy-uds-ws] WebSocket server listening on ws://localhost:${TCP_PORT}/`);
  console.log(`[proxy-uds-ws] Forwarding to UDS socket: ${SOCKET}`);
});

server.on('connection', async (clientWs, req) => {
  console.log(`[proxy-uds-ws] Client connected from ${req.socket.remoteAddress}`);

  // Check if UDS socket exists before connecting
  if (!fs.existsSync(SOCKET)) {
    console.error(`[proxy-uds-ws] UDS socket does not exist: ${SOCKET}`);
    console.error('[proxy-uds-ws] Make sure the controller is running and has created the socket!');
    clientWs.close(1011, 'UDS socket not available');
    return;
  }

  const udsWs = new WebSocket(`ws+unix://${SOCKET}`);

  // Log UDS connection status
  udsWs.on('open', () => {
    console.log(`[proxy-uds-ws] Connected to UDS socket: ${SOCKET}`);
    clientWs.on('message', (m) => udsWs.send(m));
    udsWs.on('message', (m) => clientWs.send(m));
  });

  const closeBoth = () => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close();
    }
    if (udsWs.readyState === WebSocket.OPEN) {
      udsWs.close();
    }
  };

  clientWs.on('close', closeBoth);
  udsWs.on('close', closeBoth);

  udsWs.on('error', (e) => {
    console.error('[proxy-uds-ws] UDS ws error:', e.message);
    closeBoth();
  });
});
