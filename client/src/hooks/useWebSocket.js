import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = 'ws://localhost:3002';

export function useWebSocket(sessionId) {
  const [isConnected, setIsConnected] = useState(false);
  const [prices, setPrices] = useState({});
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!sessionId) return;

    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      ws.send(JSON.stringify({ type: 'init', sessionId }));
    };

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'price-update') {
          setPrices((prev) => ({
            ...prev,
            [message.data.symbol]: {
              price: message.data.price,
              timestamp: message.data.timestamp
            }
          }));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
      wsRef.current = null;

      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    wsRef.current = ws;
  }, [sessionId]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  const subscribe = useCallback((symbol) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', symbol }));
    }
  }, []);

  const unsubscribe = useCallback((symbol) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'unsubscribe', symbol }));
    }
  }, []);

  return { isConnected, prices, subscribe, unsubscribe };
}
