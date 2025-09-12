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
```
backend/                 # Django project (API + YouTube proxy)
  backend/
  subscriptions/
frontend/                # React + Vite app
subscription-contract/   # Hardhat project (contract)
```

## Quick Start

1. **Backend Setup (PowerShell on Windows)**
   ```
   cd backend
   ..\venv\Scripts\activate
   # Create backend/.env
   # (server-side key: no referrer restriction; API restriction = YouTube Data API v3)
   # backend/.env
   YOUTUBE_API_KEY=YOUR_BACKEND_YT_API_KEY

   # Run Django
   ..\venv\Scripts\python.exe manage.py migrate
   ..\venv\Scripts\python.exe manage.py runserver 8000
   ```
   - API base: http://localhost:8000
   - YouTube proxy: GET /api/youtube/search?q=songs

2. **Frontend Setup**
   Create `frontend/.env.local` (or `.env`) next to `frontend/package.json`:
   ```
   VITE_API_URL=http://localhost:8000
   VITE_SUBSCRIPTION_CONTRACT_ADDRESS=0xYourSepoliaContract
   VITE_CHAIN_ID=11155111
   VITE_NETWORK_NAME=Sepolia
   VITE_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/yourKey
   VITE_TREASURY_ADDRESS=0xYourTreasury
   # Optional if you want to call YouTube directly from the browser (default uses backend proxy)
   VITE_YT_API_KEY=AIza...
   ```

   Run the frontend (port 8080):
   ```
   cd frontend
   npm install
   npm run dev -- --force
   ```
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
- Set `YOUTUBE_API_KEY` in `backend/.env`
- Endpoint: GET /api/youtube/search?q=<query>&pageToken=<token>&maxResults=20
- If you see 403 like "Requests from referer <empty> are blocked", your key is referrer-restricted.
  - Create a separate backend key with no referrer restriction (or IP-restricted), API restricted to YouTube Data API v3.

## Contract Notes
- Frontend reads `VITE_SUBSCRIPTION_CONTRACT_ADDRESS`
- Network: Sepolia (11155111)
- Admin can publish/update plans on-chain; the app maps DB plan IDs to on-chain IDs to keep prices in sync

## Troubleshooting
- **Env vars undefined in the browser**
  - Ensure files are in `frontend/.env(.local)` and restart Vite with `npm run dev -- --force`
  - `vite.config.ts` sets `envDir` and `envPrefix` to load from `frontend/`
- **Frontend "Failed to fetch"**
  - Start Django on port 8000; confirm `VITE_API_URL=http://localhost:8000`
- **Watch page says not active**
  - Connect wallet, be on Sepolia, ensure `subscriptionExpiry(user, planId)` is in the future
- **Cancellation reverts**
  - No active sub for that plan; app now pre-checks and shows a friendly message instead of sending a tx

## Scripts
**Backend:**
```
cd backend
..\venv\Scripts\python.exe manage.py runserver 8000
```

**Frontend:**
```
cd frontend
npm run dev
npm run build
npm run preview
```

## Security
- Never store OAuth client secrets or private keys in the frontend
- Prefer server-side keys and proxies (like the YouTube proxy)
- Restrict production keys appropriately (HTTP referrers for browser keys, IP for server keys)

## License
MIT (demo). Replace with your license as needed.

# Crypto Payment Gateway Integration

## Overview

This section describes the crypto payment gateway integration implemented to ensure users must complete payment before being subscribed to services. The integration enforces a payment-first architecture, preventing subscription bypass and ensuring revenue through blockchain verification.

## Key Features

### 🔒 **Payment-First Architecture**
- **No Payment Bypass**: Users cannot subscribe without completing payment
- **On-Chain Verification**: All payments are verified on the blockchain
- **Transaction Validation**: Subscriptions are only created after successful payment confirmation

### 💳 **Multiple Payment Methods**
- **Native Tokens**: MATIC, ETH (payable functions)
- **ERC20 Tokens**: USDC, USDT (approval + transfer flow)
- **Automatic Token Detection**: Smart contract automatically handles different token types

### 🛡️ **Security Features**
- **Balance Validation**: Checks user has sufficient funds before payment
- **Transaction Verification**: Verifies subscription was created on-chain
- **Error Handling**: Comprehensive error handling for failed payments
- **Reentrancy Protection**: Smart contract uses ReentrancyGuard

## Architecture

### Payment Service (`paymentService.ts`)
The core payment processing service that handles:
- Balance checking
- Payment processing (native and ERC20)
- Transaction verification
- Error handling

### Payment Modal (`payment-modal.tsx`)
User interface for payment confirmation:
- Plan details display
- Payment confirmation
- Processing states
- Success/error feedback

### Payment Status (`payment-status.tsx`)
Real-time balance display:
- Native token balance (MATIC/ETH)
- ERC20 token balance (USDC)
- Refresh functionality

## Smart Contract Integration

### Contract Functions Used
```solidity
// Native token subscription
function subscribeNative(uint256 planId) external payable

// ERC20 token subscription
function subscribeERC20(uint256 planId) external

// Cancel subscription
function cancelSubscription(uint256 planId) external

// Check subscription status
function isActive(address user, uint256 planId) external view returns (bool)
function subscriptionExpiry(address user, uint256 planId) external view returns (uint256)
```

### Payment Flow

1. **User Clicks Subscribe**
   - Payment modal opens with plan details
   - User confirms payment amount

2. **Balance Check**
   - Service checks if user has sufficient balance
   - Shows error if insufficient funds

3. **Payment Processing**
   - **Native Tokens**: Direct payable function call
   - **ERC20 Tokens**: Approve → Transfer flow

4. **Transaction Verification**
   - Waits for transaction confirmation
   - Verifies subscription was created on-chain
   - Checks subscription expiry matches expected

5. **Subscription Creation**
   - Only creates subscription after successful payment
   - Updates local state and backend

## Configuration

### Environment Variables
```env
VITE_SUBSCRIPTION_CONTRACT_ADDRESS=0x...
VITE_USDC_ADDRESS=0x...
VITE_USDT_ADDRESS=0x...
VITE_CHAIN_ID=137
VITE_NETWORK_NAME=Polygon
```

### Contract Addresses
- **Subscription Contract**: [Add your deployed contract address]
- **USDC (Polygon)**: [Add your USDC contract address]
- **USDT (Polygon)**: [Add your USDT contract address]

## Error Handling

### Payment Failures
- **Insufficient Balance**: Clear error message with required amount
- **Transaction Rejected**: User cancelled transaction
- **Network Issues**: Connection or RPC errors
- **Contract Errors**: Smart contract validation failures

### Recovery Options
- **Retry Payment**: Users can retry failed payments
- **Different Token**: Switch between payment methods
- **Refresh Balance**: Update token balances

## Testing

### Test Scenarios
1. **Successful Payment**
   - User has sufficient balance
   - Transaction confirms successfully
   - Subscription created and verified

2. **Insufficient Balance**
   - User doesn't have enough tokens
   - Clear error message shown
   - Payment blocked

3. **Transaction Rejection**
   - User cancels in wallet
   - Payment modal shows error
   - User can retry

4. **Network Issues**
   - RPC connection fails
   - Transaction timeout
   - Graceful error handling

## Security Considerations

### On-Chain Security
- **ReentrancyGuard**: Prevents reentrancy attacks
- **SafeERC20**: Safe token transfers
- **Immediate Transfer**: Funds sent to treasury immediately

### Frontend Security
- **Transaction Verification**: All payments verified on-chain
- **No Mock Subscriptions**: No fake subscriptions created
- **Balance Validation**: Prevents overspending

## Deployment

### Smart Contract Deployment
1. Deploy subscription contract
2. Set treasury address
3. Set relayer address
4. Create subscription plans

### Frontend Configuration
1. Update contract addresses in config
2. Set up environment variables
3. Test payment flows
4. Deploy to production

## Monitoring

### Key Metrics
- **Payment Success Rate**: % of successful payments
- **Transaction Confirmation Time**: Average confirmation time
- **Error Rates**: Payment failure rates by type
- **User Balance**: Average user balances

### Alerts
- **High Error Rate**: Payment failures above threshold
- **Low Success Rate**: Payment success below threshold
- **Contract Issues**: Smart contract errors

## Future Enhancements

### Planned Features
- **Multi-Currency Support**: More ERC20 tokens
- **Payment Splitting**: Split payments across tokens
- **Subscription Renewals**: Automatic renewals
- **Payment Analytics**: Detailed payment analytics
- **Mobile Optimization**: Better mobile payment experience

### Integration Opportunities
- **Fiat On-Ramps**: Integration with fiat payment providers
- **Cross-Chain**: Support for multiple blockchains
- **Payment Aggregators**: Integration with payment aggregators

## Support

For issues or questions about the payment integration:
1. Check the browser console for error messages
2. Verify wallet connection and network
3. Ensure sufficient token balance
4. Check smart contract status

## Conclusion

The crypto payment gateway integration ensures that users must complete actual payments before being subscribed to services. This prevents payment bypassing and ensures the platform's revenue model is properly enforced through blockchain technology.
