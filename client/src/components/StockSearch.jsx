import React, { useState, useRef, useEffect } from 'react';
import StockCard from './StockCard';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

export default function StockSearch({ sessionId, watchlistSymbols, onAddToWatchlist }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const debounceTimer = useRef(null);

  const searchStocks = async (searchQuery) => {
    if (searchQuery.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      // Ensure data is an array
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
      setError(err.message || 'Failed to search stocks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce search by 500ms
    debounceTimer.current = setTimeout(() => {
      searchStocks(value);
    }, 500);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  const handleAdd = async (symbol) => {
    try {
      const response = await fetch(`${API_URL}/api/watchlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, symbol })
      });

      if (response.ok) {
        onAddToWatchlist(symbol);
      }
    } catch (error) {
      console.error('Add to watchlist error:', error);
    }
  };

  return (
    <div className="card">
      <h2>Search Stocks</h2>
      <div className="search-box">
        <input
          type="text"
          className="search-input"
          placeholder="Search by symbol or company name..."
          value={query}
          onChange={handleInputChange}
        />
      </div>

      <div className="search-results">
        {loading && <div className="loading">Searching...</div>}
        {error && <div className="empty-state" style={{ color: '#ef4444' }}>{error}</div>}
        {!loading && !error && results.length === 0 && query.length >= 2 && (
          <div className="empty-state">No results found</div>
        )}
        {!loading && !error && results.length === 0 && query.length < 2 && (
          <div className="empty-state">Type at least 2 characters to search</div>
        )}
        {!loading &&
          !error &&
          results.map((stock) => (
            <StockCard
              key={stock.symbol}
              stock={stock}
              onAdd={handleAdd}
              isInWatchlist={watchlistSymbols.includes(stock.symbol)}
            />
          ))}
      </div>
    </div>
  );
}
