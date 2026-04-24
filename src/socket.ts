import { io } from 'socket.io-client';

const socket = io('https://comando-backend.onrender.com');

export default socket;