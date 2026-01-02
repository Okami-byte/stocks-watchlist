import React from 'react';
import StockCard from './StockCard';

const API_URL = 'http://localhost:3001';

export default function Watchlist({ sessionId, stocks, onRemove, livePrices, isConnected }) {
  const handleRemove = async (symbol) => {
    try {
      const response = await fetch(`${API_URL}/api/watchlist/${sessionId}/${symbol}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        onRemove(symbol);
      }
    } catch (error) {
      console.error('Remove from watchlist error:', error);
    }
  };

  return (
    <div className="card">
      <h2>
        My Watchlist
        <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '● Live' : '○ Offline'}
        </span>
      </h2>

      <div className="search-results">
        {stocks.length === 0 ? (
          <div className="empty-state">Your watchlist is empty. Add some stocks to get started!</div>
        ) : (
          stocks.map((stock) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              onRemove={handleRemove}
              isInWatchlist={true}
              livePrice={livePrices[stock.symbol]?.price}
            />
          ))
        )}
      </div>
    </div>
  );
}
