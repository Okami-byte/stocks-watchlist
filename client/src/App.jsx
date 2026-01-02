import React, { useState, useEffect } from 'react';
import StockSearch from './components/StockSearch';
import Watchlist from './components/Watchlist';
import { useWebSocket } from './hooks/useWebSocket';

const API_URL = 'http://localhost:3001';

function getOrCreateSessionId() {
  let sessionId = localStorage.getItem('sessionId');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sessionId', sessionId);
  }
  return sessionId;
}

export default function App() {
  const [sessionId] = useState(getOrCreateSessionId);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isConnected, prices, subscribe, unsubscribe } = useWebSocket(sessionId);

  useEffect(() => {
    loadWatchlist();
  }, []);

  const loadWatchlist = async () => {
    try {
      const response = await fetch(`${API_URL}/api/watchlist/${sessionId}`);
      const data = await response.json();
      setWatchlist(data);
    } catch (error) {
      console.error('Load watchlist error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToWatchlist = (symbol) => {
    subscribe(symbol);
    loadWatchlist();
  };

  const handleRemoveFromWatchlist = (symbol) => {
    unsubscribe(symbol);
    setWatchlist((prev) => prev.filter((stock) => stock.symbol !== symbol));
  };

  const watchlistSymbols = watchlist.map((stock) => stock.symbol);

  return (
    <div className="app">
      <div className="header">
        <h1>Stock Watchlist</h1>
        <p>Track your favorite stocks in real-time</p>
      </div>

      <div className="main-content">
        <StockSearch
          sessionId={sessionId}
          watchlistSymbols={watchlistSymbols}
          onAddToWatchlist={handleAddToWatchlist}
        />
        <Watchlist
          sessionId={sessionId}
          stocks={watchlist}
          onRemove={handleRemoveFromWatchlist}
          livePrices={prices}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
}
