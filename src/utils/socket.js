import { io } from 'socket.io-client';

const URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin);

// Force native WebSocket transport directly to bypass Cloudflare HTTP polling buffer
export const socket = io(URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 20,
  reconnectionDelay: 500,
  transports: ['websocket'] // Pure WebSocket: 0ms delay over Cloudflare tunnels
});
