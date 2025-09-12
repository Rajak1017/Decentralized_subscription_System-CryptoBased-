# DSAPP – Subscription Video DApp (Django + React/Vite + Ethers)

A full-stack subscription demo:
- Backend: Django REST API + server-side YouTube Data API proxy
- Frontend: React + Vite + Tailwind
- Web3: Ethers.js integration with a Subscription smart contract (Sepolia)

## Prerequisites
- Node 18+ and npm
- Python 3.10+
- A YouTube Data API v3 key (for backend proxy)
- A deployed Subscription contract on Sepolia (address used by the frontend)

## Project Structure
`
backend/ # Django project (API + YouTube proxy)
  backend/
  subscriptions/
frontend/ # React + Vite app
subscription-contract/ # Hardhat project (contract)
`

## Quick Start

1) Backend env (PowerShell on Windows)
`
cd backend
..\venv\Scripts\activate
# Create backend/.env
# (server-side key: no referrer restriction; API restriction = YouTube Data API v3)
# backend/.env
YOUTUBE_API_KEY=YOUR_BACKEND_YT_API_KEY

# Run Django
..\venv\Scripts\python.exe manage.py migrate
..\venv\Scripts\python.exe manage.py runserver 8000
`
- API base: http://localhost:8000
- YouTube proxy: GET /api/youtube/search?q=songs

2) Frontend env
Create rontend/.env.local (or .env) next to rontend/package.json:
`
VITE_API_URL=http://localhost:8000
VITE_SUBSCRIPTION_CONTRACT_ADDRESS=0xYourSepoliaContract
VITE_CHAIN_ID=11155111
VITE_NETWORK_NAME=Sepolia
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/yourKey
VITE_TREASURY_ADDRESS=0xYourTreasury
# Optional if you want to call YouTube directly from the browser (default uses backend proxy)
VITE_YT_API_KEY=AIza...
`

Run the frontend (port 8080):
`
cd frontend
npm install
npm run dev -- --force
`
Open http://localhost:8080.

## Features
- Plans CRUD (Django) with admin wallet checks, on-chain publish/update (Ethers.js)
- Wallet connect (MetaMask), network enforcement (Sepolia)
- Purchase flow guards:
  - Block re-payment if the plan is already active for the user
  - Prefer on-chain admin price when UI price differs
- Watch page locked by on-chain status (isActive + expiry > now)
- YouTube search via backend proxy (/api/youtube/search) so no browser key exposure
- Admin dashboard: site-wide active subscriptions, active plans, USD revenue via CoinGecko

## Using the YouTube Proxy
- Set YOUTUBE_API_KEY in ackend/.env
- Endpoint: GET /api/youtube/search?q=<query>&pageToken=<token>&maxResults=20
- If you see 403 like Requests from referer <empty> are blocked, your key is referrer-restricted.
  - Create a separate backend key with no referrer restriction (or IP-restricted), API restricted to YouTube Data API v3.

## Contract Notes
- Frontend reads VITE_SUBSCRIPTION_CONTRACT_ADDRESS
- Network: Sepolia (11155111)
- Admin can publish/update plans on-chain; the app maps DB plan IDs to on-chain IDs to keep prices in sync

## Troubleshooting
- Env vars undefined in the browser
  - Ensure files are in rontend/.env(.local) and restart Vite with 
pm run dev -- --force
  - ite.config.ts sets envDir and envPrefix to load from rontend/
- Frontend Failed to fetch
  - Start Django on port 8000; confirm VITE_API_URL=http://localhost:8000
- Watch page says not active
  - Connect wallet, be on Sepolia, ensure subscriptionExpiry(user, planId) is in the future
- Cancellation reverts
  - No active sub for that plan; app now pre-checks and shows a friendly message instead of sending a tx

## Scripts
Backend:
`
cd backend
..\venv\Scripts\python.exe manage.py runserver 8000
`
Frontend:
`
cd frontend
npm run dev
npm run build
npm run preview
`

## Security
- Never store OAuth client secrets or private keys in the frontend
- Prefer server-side keys and proxies (like the YouTube proxy)
- Restrict production keys appropriately (HTTP referrers for browser keys, IP for server keys)

## License
MIT (demo). Replace with your license as needed.
