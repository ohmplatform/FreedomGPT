import { io as ClientIO, Socket } from "socket.io-client";

const socket: Socket = new (ClientIO as any)(process.env.NEXT_PUBLIC_SITE_URL, {
  path: "/api/socketio",
});

export default socket;
