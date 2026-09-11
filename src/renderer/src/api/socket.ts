import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;

const getSocketURL = (): string =>
  import.meta.env.VITE_SOCKET_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(getSocketURL(), { autoConnect: false });
  }
  return socket;
};

export const destroySocket = (): void => {
  socket?.disconnect();
  socket = null;
};
