import { useEffect, useState } from "react";
import io, {Socket} from "socket.io-client";

export function useSocketIO() {
    const[connected, setConnected] = useState(false);
    const[socket, setSocket] = useState<Socket>();

    useEffect(() => {
        async function startConnection() {
            await fetch('/api/socket');
            const so = io({path: "/api/socketio"});
            setSocket(so);

            so.on('connect', () => {
                setConnected(true)
            });
        }

        if(!socket) {
            startConnection();
        }
    }, [])
    
    return [socket, connected]
}