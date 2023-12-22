import { EXPRESS_SERVER_PORT } from "../../src/ports";
import io from "socket.io-client";

const socket = io(`http://localhost:${EXPRESS_SERVER_PORT}`);

export default socket;
