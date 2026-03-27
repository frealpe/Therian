import { useState, useEffect, useRef, useCallback } from 'react';

const RECONNECT_INTERVAL_MS = 5000;

export const useWebSocket = (url) => {
    const [isConnected, setIsConnected] = useState(false);
    const [telemetry, setTelemetry] = useState(null);
    const [info, setInfo] = useState('');
    const wsRef = useRef(null);
    const reconnectTimerRef = useRef(null);

    const connect = useCallback(() => {
        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            return;
        }

        console.log(`Intentando conectar a ${url}...`);
        const ws = new WebSocket(url);

        ws.onopen = () => {
            console.log('WebSocket Conectado');
            setIsConnected(true);
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
                reconnectTimerRef.current = null;
            }
        };

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message.t === 'info') {
                    setInfo(message.v);
                } else if (message.t === 'data') {
                    setTelemetry(message.v);
                }
            } catch (error) {
                console.error('Error procesando mensaje:', error);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket Desconectado');
            setIsConnected(false);
            wsRef.current = null;
            // Intentar reconectar si la URL está definida
            if (url) {
                reconnectTimerRef.current = setTimeout(connect, RECONNECT_INTERVAL_MS);
            }
        };

        ws.onerror = (error) => {
            console.error('WebSocket Error:', error);
            ws.close();
        };

        wsRef.current = ws;
    }, [url]);

    useEffect(() => {
        if (url) {
            connect();
        }
        return () => {
            if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect, url]);

    const sendMessage = useCallback((type, value) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            const payload = JSON.stringify({ t: type, v: value });
            wsRef.current.send(payload);
        } else {
            console.warn('No se puede enviar mensaje, el socket no está conectado.');
        }
    }, []);

    const sendAnimation = useCallback((animType) => {
        sendMessage('anim', animType);
    }, [sendMessage]);

    const requestTelemetry = useCallback(() => {
        sendMessage('control', 'GET_TELEMETRY');
    }, [sendMessage]);

    return {
        isConnected,
        telemetry,
        info,
        sendMessage,
        sendAnimation,
        requestTelemetry,
    };
};
