import WebSocket from 'ws';
import dotenv from 'dotenv';

dotenv.config();

class FinnhubClient {
  constructor() {
    this.ws = null;
    this.subscribers = new Map(); // symbol -> Set of callback functions
    this.reconnectInterval = 5000;
    this.isConnecting = false;
  }

  connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const url = `wss://ws.finnhub.io?token=${process.env.FINNHUB_API_KEY}`;

    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      console.log('✅ Connected to Finnhub WebSocket');
      this.isConnecting = false;

      // Resubscribe to all symbols
      for (const symbol of this.subscribers.keys()) {
        this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
      }
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);

        if (message.type === 'trade' && message.data) {
          message.data.forEach((trade) => {
            const callbacks = this.subscribers.get(trade.s);
            if (callbacks) {
              callbacks.forEach(callback => callback({
                symbol: trade.s,
                price: trade.p,
                volume: trade.v,
                timestamp: trade.t
              }));
            }
          });
        }
      } catch (error) {
        console.error('Error parsing Finnhub message:', error);
      }
    });

    this.ws.on('error', (error) => {
      console.error('Finnhub WebSocket error:', error);
    });

    this.ws.on('close', () => {
      console.log('Finnhub WebSocket closed. Reconnecting...');
      this.isConnecting = false;
      setTimeout(() => this.connect(), this.reconnectInterval);
    });
  }

  subscribe(symbol, callback) {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());

      // Send subscribe message if connected
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'subscribe', symbol }));
      }
    }

    this.subscribers.get(symbol).add(callback);
  }

  unsubscribe(symbol, callback) {
    const callbacks = this.subscribers.get(symbol);
    if (callbacks) {
      callbacks.delete(callback);

      // If no more callbacks for this symbol, unsubscribe from Finnhub
      if (callbacks.size === 0) {
        this.subscribers.delete(symbol);
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'unsubscribe', symbol }));
        }
      }
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const finnhubClient = new FinnhubClient();
