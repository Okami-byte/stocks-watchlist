import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import { connectDB, Watchlist } from './db.js';
import { setupWebSocketServer } from './websocket.js';
import { finnhubClient } from './finnhub.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 3002;

app.use(cors());
app.use(express.json());

app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const response = await axios.get(
      `https://finnhub.io/api/v1/search?q=${q}&token=${process.env.FINNHUB_API_KEY}`
    );

    // Get quote for each result (limited to top 5 to reduce API calls)
    const results = response.data.result?.slice(0, 5) || [];
    const stocksWithQuotes = await Promise.all(
      results.map(async (stock) => {
        try {
          const quoteResponse = await axios.get(
            `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${process.env.FINNHUB_API_KEY}`
          );
          return {
            symbol: stock.symbol,
            description: stock.description,
            price: quoteResponse.data.c,
            change: quoteResponse.data.d,
            percentChange: quoteResponse.data.dp
          };
        } catch (error) {
          return {
            symbol: stock.symbol,
            description: stock.description,
            price: null,
            change: null,
            percentChange: null
          };
        }
      })
    );

    res.json(stocksWithQuotes);
  } catch (error) {
    console.error('Search error:', error);

    // Handle rate limit error
    if (error.response && error.response.status === 429) {
      return res.status(429).json({
        error: 'API rate limit reached. Please wait a minute and try again.'
      });
    }

    res.status(500).json({ error: 'Failed to search stocks. Please try again.' });
  }
});

// Get watchlist for a session
app.get('/api/watchlist/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const watchlist = await Watchlist.find({ sessionId });

    // Get current quotes for all watchlist items
    const stocksWithQuotes = await Promise.all(
      watchlist.map(async (item) => {
        try {
          const quoteResponse = await axios.get(
            `https://finnhub.io/api/v1/quote?symbol=${item.stockSymbol}&token=${process.env.FINNHUB_API_KEY}`
          );
          return {
            symbol: item.stockSymbol,
            price: quoteResponse.data.c,
            change: quoteResponse.data.d,
            percentChange: quoteResponse.data.dp,
            high: quoteResponse.data.h,
            low: quoteResponse.data.l,
            open: quoteResponse.data.o,
            previousClose: quoteResponse.data.pc
          };
        } catch (error) {
          return {
            symbol: item.stockSymbol,
            price: null,
            change: null,
            percentChange: null
          };
        }
      })
    );

    res.json(stocksWithQuotes);
  } catch (error) {
    console.error('Get watchlist error:', error);
    res.status(500).json({ error: 'Failed to get watchlist' });
  }
});

// Add stock to watchlist
app.post('/api/watchlist', async (req, res) => {
  try {
    const { sessionId, symbol } = req.body;

    if (!sessionId || !symbol) {
      return res.status(400).json({ error: 'sessionId and symbol are required' });
    }

    const watchlistItem = new Watchlist({
      sessionId,
      stockSymbol: symbol.toUpperCase()
    });

    await watchlistItem.save();
    res.json({ success: true, symbol: symbol.toUpperCase() });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Stock already in watchlist' });
    }
    console.error('Add to watchlist error:', error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

// Remove stock from watchlist
app.delete('/api/watchlist/:sessionId/:symbol', async (req, res) => {
  try {
    const { sessionId, symbol } = req.params;
    await Watchlist.deleteOne({ sessionId, stockSymbol: symbol.toUpperCase() });
    res.json({ success: true });
  } catch (error) {
    console.error('Remove from watchlist error:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

// Start server
async function start() {
  await connectDB();

  // Connect to Finnhub WebSocket
  finnhubClient.connect();

  // Start WebSocket server
  setupWebSocketServer(WS_PORT);

  // Start Express server
  app.listen(PORT, () => {
    console.log(`✅ API server running on port ${PORT}`);
  });
}

start();
