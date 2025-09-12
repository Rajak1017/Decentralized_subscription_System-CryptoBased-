// Smart contract configuration (Sepolia defaults)
export const CONTRACT_ADDRESSES = {
  // Set this after deployment on Sepolia or via env VITE_SUBSCRIPTION_CONTRACT_ADDRESS
  SUBSCRIPTION: import.meta.env.VITE_SUBSCRIPTION_CONTRACT_ADDRESS || '0xE3EC5B846277a2c31c9d52CE097f3313280C4b49',
  // Not used on Sepolia for now; ETH-only flow
  USDC: import.meta.env.VITE_USDC_ADDRESS || '',
  USDT: import.meta.env.VITE_USDT_ADDRESS || '',
};

console.log('Contract configuration loaded:');
console.log('SUBSCRIPTION:', CONTRACT_ADDRESSES.SUBSCRIPTION);
console.log('Environment VITE_SUBSCRIPTION_CONTRACT_ADDRESS:', import.meta.env.VITE_SUBSCRIPTION_CONTRACT_ADDRESS);

export const NETWORK_CONFIG = {
  CHAIN_ID: parseInt(import.meta.env.VITE_CHAIN_ID || '11155111'), // Sepolia chain id
  NAME: import.meta.env.VITE_NETWORK_NAME || 'Sepolia',
  RPC_URL: import.meta.env.VITE_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/JwnbGfdnGxR-esnZ4vjlH',
};

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
};

// Treasury configuration (where payments are forwarded by the contract)
export const TREASURY_CONFIG = {
  ADDRESS: (import.meta.env.VITE_TREASURY_ADDRESS || '0xda46a64ab8c6beda14677c49d2bdd0fc4bf7b72d').toLowerCase(),
};

// Explorer helpers
export function getExplorerBase(): string {
  switch (NETWORK_CONFIG.CHAIN_ID) {
    case 11155111: // Sepolia
      return 'https://sepolia.etherscan.io';
    case 137: // Polygon
      return 'https://polygonscan.com';
    case 80001: // Mumbai (legacy)
      return 'https://mumbai.polygonscan.com';
    default:
      return 'https://etherscan.io';
  }
}

export function getTxUrl(txHash: string): string {
  const base = getExplorerBase();
  return `${base}/tx/${txHash}`;
}
