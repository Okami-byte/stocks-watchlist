import { WebSocketServer } from 'ws';
import { finnhubClient } from './finnhub.js';
import { Watchlist } from './db.js';

export function setupWebSocketServer(port) {
  const wss = new WebSocketServer({ port });
  const clients = new Map(); // sessionId -> { ws, subscriptions: Map(symbol -> callback) }

  wss.on('connection', async (ws) => {
    let sessionId = null;
    let subscriptions = new Map();

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        switch (data.type) {
          case 'init':
            sessionId = data.sessionId;
            clients.set(sessionId, { ws, subscriptions });
            console.log(`Client connected: ${sessionId}`);

            // Load watchlist and subscribe to symbols
            const watchlist = await Watchlist.find({ sessionId });
            for (const item of watchlist) {
              const callback = (priceData) => {
                if (ws.readyState === 1) { // OPEN
                  ws.send(JSON.stringify({
                    type: 'price-update',
                    data: priceData
                  }));
                }
              };

              subscriptions.set(item.stockSymbol, callback);
              finnhubClient.subscribe(item.stockSymbol, callback);
            }

            ws.send(JSON.stringify({
              type: 'init-complete',
              symbols: watchlist.map(w => w.stockSymbol)
            }));
            break;

          case 'subscribe':
            if (sessionId && data.symbol) {
              const callback = (priceData) => {
                if (ws.readyState === 1) {
                  ws.send(JSON.stringify({
                    type: 'price-update',
                    data: priceData
                  }));
                }
              };

              subscriptions.set(data.symbol, callback);
              finnhubClient.subscribe(data.symbol, callback);
            }
            break;

          case 'unsubscribe':
            if (sessionId && data.symbol) {
              const callback = subscriptions.get(data.symbol);
              if (callback) {
                finnhubClient.unsubscribe(data.symbol, callback);
                subscriptions.delete(data.symbol);
              }
            }
            break;
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      if (sessionId) {
        // Unsubscribe from all symbols
        for (const [symbol, callback] of subscriptions) {
          finnhubClient.unsubscribe(symbol, callback);
        }
        clients.delete(sessionId);
        console.log(`Client disconnected: ${sessionId}`);
      }
    });
  });

  console.log(`✅ WebSocket server running on port ${port}`);
  return wss;
}
