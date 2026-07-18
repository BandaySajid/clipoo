import { useState, useEffect } from 'react';
import { API_BASE } from '../lib/api';

export function useSSE(room) {
    const [connected, setConnected] = useState(false);
    const [data, setData] = useState(null); // Last received event data

    useEffect(() => {
        if (!room) return;
        
        let es;
        let reconnectTimeout;

        function connect() {
            es = new EventSource(`${API_BASE}/api/stream?room=${encodeURIComponent(room)}`, { withCredentials: true });

            es.onopen = () => setConnected(true);

            es.onmessage = (e) => {
                try {
                    setData(JSON.parse(e.data));
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
    }, []);

    return { connected, data };
}
