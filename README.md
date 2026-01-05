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

---

## Deployment to AWS EC2

### Prerequisites

- AWS account with EC2 access
- GitHub repository with this code
- Domain name (optional, for SSL)

### Step 1: Launch EC2 Instance

1. Go to **AWS Console** → **EC2** → **Launch Instance**
2. Configure:
   | Setting | Value |
   |---------|-------|
   | **Name** | `stock-watchlist` |
   | **AMI** | Ubuntu Server 22.04 LTS |
   | **Instance type** | `t2.micro` (free tier) or `t2.small` |
   | **Key pair** | Create new → `stock-watchlist-key` → Download `.pem` |

3. **Security Group** inbound rules:
   | Type | Port | Source |
   |------|------|--------|
   | SSH | 22 | Your IP |
   | HTTP | 80 | 0.0.0.0/0 |
   | HTTPS | 443 | 0.0.0.0/0 |

4. Launch and wait for instance to start

### Step 2: Connect to EC2

```bash
# Copy key to safe location (WSL users)
cp /mnt/c/Users/<WINDOWS_USER>/Downloads/stock-watchlist-key.pem ~/
chmod 400 ~/stock-watchlist-key.pem

# Connect
ssh -i ~/stock-watchlist-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### Step 3: Install Software on EC2

Run on EC2:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Verify
node -v && pm2 -v && nginx -v
```

### Step 4: Configure Nginx

Run on EC2:

```bash
# Create app directory
sudo mkdir -p /var/www/stock-watchlist
sudo chown ubuntu:ubuntu /var/www/stock-watchlist

# Create Nginx config
sudo nano /etc/nginx/sites-available/stock-watchlist
```

Paste this config:

```nginx
server {
    listen 80;
    server_name _;

    # Serve React client (static files)
    location / {
        root /var/www/stock-watchlist/client;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node.js server
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Proxy WebSocket connections
    location /ws {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

```bash
# Enable config
sudo ln -s /etc/nginx/sites-available/stock-watchlist /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: GitHub Secrets Setup

Go to **GitHub repo** → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Secret Name | Value |
|-------------|-------|
| `EC2_HOST` | Your EC2 public IP (or Elastic IP) |
| `EC2_USER` | `ubuntu` |
| `EC2_SSH_KEY` | Contents of your `.pem` file |
| `MONGODB_URI` | Your MongoDB connection string |
| `FINNHUB_API_KEY` | Your Finnhub API key |

### Step 6: GitHub Actions Workflow

The workflow file is at `.github/workflows/deploy.yml`. It automatically:

1. Builds the React client
2. Creates `.env` file from secrets
3. Copies client build + server files to EC2 via rsync
4. Installs server dependencies
5. Restarts PM2 process

**Trigger:** Push to `main` branch

### Step 7: Deploy

Push to `main` branch to trigger deployment:

```bash
git add .
git commit -m "Setup deployment"
git push origin main
```

Monitor progress in **GitHub repo** → **Actions** tab.

### Step 8: Verify Deployment

1. Visit `http://<EC2_PUBLIC_IP>` in your browser
2. Check PM2 status on EC2: `pm2 status`
3. View server logs: `pm2 logs stock-server`

### Troubleshooting

**Check Nginx:**
```bash
sudo nginx -t
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

**Check PM2:**
```bash
pm2 status
pm2 logs stock-server
```

**Restart services:**
```bash
pm2 restart stock-server
sudo systemctl restart nginx
```
