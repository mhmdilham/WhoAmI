import { io } from 'socket.io-client';

const URL = process.env.NODE_ENV === 'production' 
  ? window.location.origin 
  : (window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin);

export const socket = io(URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000
});
