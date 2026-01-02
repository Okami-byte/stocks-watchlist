import React from 'react';

export default function StockCard({ stock, onAdd, onRemove, isInWatchlist, livePrice }) {
  const displayPrice = livePrice !== undefined ? livePrice : stock.price;
  const change = stock.change;
  const percentChange = stock.percentChange;

  const changeClass = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';

  return (
    <div className="stock-item">
      <div className="stock-info">
        <div className="stock-symbol">{stock.symbol}</div>
        {stock.description && <div className="stock-name">{stock.description}</div>}
      </div>

      <div className="stock-price-info">
        {displayPrice !== null && displayPrice !== undefined ? (
          <>
            <div className="stock-price">${displayPrice.toFixed(2)}</div>
            {change !== null && percentChange !== null && (
              <div className={`stock-change ${changeClass}`}>
                {change >= 0 ? '+' : ''}
                {change.toFixed(2)} ({percentChange >= 0 ? '+' : ''}
                {percentChange.toFixed(2)}%)
              </div>
            )}
          </>
        ) : (
          <div className="stock-price">-</div>
        )}
      </div>

      {isInWatchlist ? (
        <button className="remove-btn" onClick={() => onRemove(stock.symbol)}>
          Remove
        </button>
      ) : (
        <button className="add-btn" onClick={() => onAdd(stock.symbol)}>
          Add
        </button>
      )}
    </div>
  );
}
