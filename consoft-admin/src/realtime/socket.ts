import { io, Socket } from 'socket.io-client';

export function createSocket(API: string): Socket {
  // credentials via cookies; websocket transport prioritised
  return io(API, { withCredentials: true, transports: ['websocket'] });
}


