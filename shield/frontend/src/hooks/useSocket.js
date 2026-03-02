import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function useSocket() {
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
        socketRef.current = socket;
        socket.on('connect', () => setConnected(true));
        socket.on('disconnect', () => setConnected(false));
        return () => { socket.disconnect(); };
    }, []);

    const on = (event, handler) => {
        socketRef.current?.on(event, handler);
        return () => socketRef.current?.off(event, handler);
    };

    return { socket: socketRef.current, connected, on };
}
