# 🎥 DSAPP – Subscription Video DApp (Django + React/Vite + Ethers)

A full-stack **Web3 subscription platform** that enables users to purchase subscriptions securely using cryptocurrency.  
Built with **Django (backend)**, **React + Vite (frontend)**, and **Ethers.js** for smart contract interaction.

---

## 🏗 Tech Stack

- **Backend:** Django REST API + YouTube Data API proxy  
- **Frontend:** React, Vite, TailwindCSS  
- **Web3:** Ethers.js, Hardhat, Sepolia Testnet Smart Contract  
- **Payments:** Native tokens (MATIC/ETH) & ERC20 tokens (USDC/USDT)  

---

## 📂 Project Structure

backend/ # Django project (API + YouTube proxy)
backend/
subscriptions/
frontend/ # React + Vite app (UI + wallet integration)
subscription-contract/ # Hardhat project (smart contract)

yaml
Copy code

---

## ⚙️ Prerequisites

- **Node.js:** v18+  
- **Python:** v3.10+  
- **YouTube Data API v3 key** (for backend proxy)  
- **Deployed Subscription Contract** on Sepolia (for frontend)  

---

## 🚀 Quick Start

### 1️⃣ Backend Setup

```bash
cd backend
..\venv\Scripts\activate

# Create backend/.env
# Example:
YOUTUBE_API_KEY=YOUR_BACKEND_YT_API_KEY

# Run migrations & server
..\venv\Scripts\python.exe manage.py migrate
..\venv\Scripts\python.exe manage.py runserver 8000
API Base: http://localhost:8000

YouTube Proxy: GET /api/youtube/search?q=songs ```

###2️⃣ Frontend Setup
Create frontend/.env.local (or .env):

env
Copy code
VITE_API_URL=http://localhost:8000
VITE_SUBSCRIPTION_CONTRACT_ADDRESS=0xYourSepoliaContract
VITE_CHAIN_ID=11155111
VITE_NETWORK_NAME=Sepolia
VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/yourKey
VITE_TREASURY_ADDRESS=0xYourTreasury
VITE_YT_API_KEY=AIza... # optional
Run the frontend:

bash
Copy code
cd frontend
npm install
npm run dev -- --force
Open http://localhost:8080

##✨ Core Features
Plans CRUD: Django admin + on-chain sync

Wallet Connect: MetaMask + Sepolia enforcement

Payment-First Subscription Flow

Native token (MATIC/ETH) payments

ERC20 token (USDC/USDT) payments

Automatic balance checks & validation

Watch Page Lock: Checks isActive + expiry > now

YouTube Proxy: Hides browser API keys

Admin Dashboard: Active subs, plan data, USD revenue (CoinGecko)

##💳 Crypto Payment Gateway Integration
###🔒 Payment-First Architecture
No subscription without successful payment

On-chain payment verification

Subscriptions created only after confirmation

###💰 Multiple Payment Methods
Native Tokens (MATIC/ETH)

ERC20 Tokens (USDC/USDT)

Automatic token detection & handling

###🛡 Security
Balance validation before payment

ReentrancyGuard in contract

SafeERC20 for token transfers

Immediate treasury transfer of funds

###🔧 Smart Contract Functions
solidity
Copy code
function subscribeNative(uint256 planId) external payable;
function subscribeERC20(uint256 planId) external;
function cancelSubscription(uint256 planId) external;

function isActive(address user, uint256 planId) external view returns (bool);
function subscriptionExpiry(address user, uint256 planId) external view returns (uint256);
###🔄 Payment Flow
User Clicks Subscribe → Modal opens with plan details

Balance Check → Shows error if insufficient

Payment Processing:

Native: direct payable function call

ERC20: approve → transfer flow

Transaction Verification: waits for confirmation

Subscription Creation: updates backend + UI

##🧪 Testing Scenarios
✅ Successful Payment: Confirms & creates subscription

❌ Insufficient Balance: Blocks payment, shows error

🚫 Transaction Rejected: User can retry

🌐 Network Issues: Graceful error handling

##🔒 Security Best Practices
No fake/mock subscriptions (verified on-chain)

All payments verified after confirmation

Balance validation prevents overspending

Server-side API keys (for YouTube proxy)

Restrict production keys:

Browser keys → HTTP referrer restriction

Server keys → IP restriction

###📊 Monitoring & Metrics
Payment Success Rate

Transaction Confirmation Time

Error Rate by Type

User Balance Averages

###🚀 Deployment
Smart Contract
Deploy subscription contract

Set treasury + relayer addresses

Create subscription plans

Frontend
Update .env with contract + token addresses

Test payment flows

Deploy to production

###🛠 Scripts
Backend:

bash
Copy code
cd backend
..\venv\Scripts\python.exe manage.py runserver 8000
Frontend:

bash
Copy code
cd frontend
npm run dev
npm run build
npm run preview
###📌 Future Enhancements
Multi-token & multi-chain support

Automatic subscription renewals

Payment analytics dashboard

Fiat on-ramp integrations

Better mobile UX

#📄 License
MIT (Demo). Replace with your own license if needed.

yaml
