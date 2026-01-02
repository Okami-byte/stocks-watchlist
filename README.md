# Stock Watchlist App

A real-time stock tracking application built with React and Node.js. Search for stocks, add them to your watchlist, and see live price updates via WebSocket.

## Features

- **Real-time Price Updates**: WebSocket integration with Finnhub API for live stock prices
- **Stock Search**: Search stocks by symbol or company name
- **Persistent Watchlist**: Session-based watchlist stored in MongoDB
- **Live Data**: See price changes in real-time with visual indicators
- **Responsive Design**: Beautiful gradient UI that works on all devices

## Tech Stack

### Frontend
- React 18
- Vite
- WebSocket client
- CSS3 with modern animations

### Backend
- Node.js with Express
- WebSocket server (ws library)
- MongoDB with Mongoose
- Finnhub API integration
- Axios for HTTP requests

## Prerequisites

- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB)
- Finnhub API key

## Installation

### 1. Install Server Dependencies

```bash
cd server
npm install
```

### 2. Install Client Dependencies

```bash
cd ../client
npm install
```

## Running the Application

### 1. Start the Backend Server

```bash
cd server
npm run dev
```

The server will start on:
- API: `http://localhost:3001`
- WebSocket: `ws://localhost:3002`

### 2. Start the Frontend

```bash
cd client
npm run dev
```

The client will start on `http://localhost:5173`

## How It Works

### Architecture

```
Finnhub WS → Node.js Backend → WebSocket Server → React Client
                ↓
            MongoDB
```

1. **Client connects** to backend WebSocket with a session ID
2. **Backend fetches** the user's watchlist from MongoDB
3. **Backend subscribes** to Finnhub WebSocket for those stock symbols
4. **Price updates** are pushed from Finnhub → Backend → Client in real-time
5. **User actions** (add/remove stocks) update MongoDB and WebSocket subscriptions

### Session Management

- Each browser gets a unique session ID stored in localStorage
- Watchlist is tied to session ID in MongoDB
- No login required - sessions persist across browser restarts

### API Endpoints

- `GET /api/search?q=AAPL` - Search for stocks
- `GET /api/watchlist/:sessionId` - Get user's watchlist
- `POST /api/watchlist` - Add stock to watchlist
- `DELETE /api/watchlist/:sessionId/:symbol` - Remove stock from watchlist

### WebSocket Messages

**Client → Server:**
- `{ type: 'init', sessionId: '...' }` - Initialize connection
- `{ type: 'subscribe', symbol: 'AAPL' }` - Subscribe to stock
- `{ type: 'unsubscribe', symbol: 'AAPL' }` - Unsubscribe from stock

**Server → Client:**
- `{ type: 'price-update', data: { symbol, price, timestamp } }` - Real-time price update

## Environment Variables

The `.env` file in the server directory contains:

```env
MONGODB_URI=your_mongodb_connection_string
FINNHUB_API_KEY=your_finnhub_api_key
PORT=3001
WS_PORT=3002
```

## Usage

1. **Search for stocks** - Type a company name or symbol (e.g., "AAPL" or "Apple")
2. **Add to watchlist** - Click the "Add" button on any stock
3. **Watch live updates** - Prices update in real-time when market is open
4. **Remove stocks** - Click "Remove" to delete from watchlist

## Notes

- Stock prices update in real-time during market hours (9:30 AM - 4:00 PM ET)
- Finnhub free tier allows 60 API calls/minute
- MongoDB stores watchlist data persistently
- Session ID in localStorage ensures your watchlist persists across visits

## Development

To run in production mode:

```bash
# Build client
cd client
npm run build

# Start server in production
cd ../server
npm start
```

Enjoy tracking your stocks!
# stocks-watchlist
