import { useState, useEffect, useRef } from 'react';
import { API_BASE } from '../lib/api';

export function useSSE(room, onMessage) {
    const [connected, setConnected] = useState(false);
    const callbackRef = useRef(onMessage);

    useEffect(() => {
        callbackRef.current = onMessage;
    }, [onMessage]);

    useEffect(() => {
        if (!room) return;
        
        let es;
        let reconnectTimeout;

        function connect() {
            es = new EventSource(`${API_BASE}/api/stream?room=${encodeURIComponent(room)}`, { withCredentials: true });

            es.onopen = () => setConnected(true);

            es.onmessage = (e) => {
                try {
                    if (callbackRef.current) {
                        callbackRef.current(JSON.parse(e.data));
                    }
                } catch (err) {
                    console.error('SSE Parse Error:', err);
                }
            };

            es.onerror = () => {
                setConnected(false);
                es.close();
                reconnectTimeout = setTimeout(connect, 3000);
            };
        }

        connect();

        return () => {
            clearTimeout(reconnectTimeout);
            if (es) es.close();
        };
    }, [room]);

    return { connected };
}
