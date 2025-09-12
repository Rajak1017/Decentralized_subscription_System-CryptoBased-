import { BrowserProvider, Contract, parseEther, formatEther, isAddress } from 'ethers';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useSubscriptionStore, UserSubscription } from '../stores/useSubscriptionStore';
import { createSubscription as apiCreateSubscription } from '../lib/api';
import { useWalletStore } from '../stores/useWalletStore';

// Contract ABI for subscription contract
const SUBSCRIPTION_CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "uint256", "name": "planId", "type": "uint256" }
    ],
    "name": "subscribeNative",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "name": "plans",
    "outputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "uint256", "name": "duration", "type": "uint256" },
      { "internalType": "bool", "name": "active", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "uint256", "name": "duration", "type": "uint256" }
    ],
    "name": "createPlan",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "planId", "type": "uint256" }
    ],
    "name": "planExists",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "planId", "type": "uint256" },
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256", "name": "price", "type": "uint256" },
      { "internalType": "uint256", "name": "duration", "type": "uint256" },
      { "internalType": "bool", "name": "active", "type": "bool" }
    ],
    "name": "updatePlan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nextPlanId",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "planId", "type": "uint256" }
    ],
    "name": "subscribeERC20",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "_treasury", "type": "address" }
    ],
    "name": "setTreasury",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "treasury",
    "outputs": [
      { "internalType": "address", "name": "", "type": "address" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "planId", "type": "uint256" }
    ],
    "name": "cancelSubscription",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "uint256", "name": "planId", "type": "uint256" }
    ],
    "name": "isActive",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "user", "type": "address" },
      { "internalType": "uint256", "name": "planId", "type": "uint256" }
    ],
    "name": "subscriptionExpiry",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// ERC20 ABI for token approvals
const ERC20_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "spender", "type": "address" },
      { "internalType": "uint256", "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [
      { "internalType": "bool", "name": "", "type": "bool" }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "owner", "type": "address" },
      { "internalType": "address", "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "address", "name": "account", "type": "address" }
    ],
    "name": "balanceOf",
    "outputs": [
      { "internalType": "uint256", "name": "", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "decimals",
    "outputs": [
      { "internalType": "uint8", "name": "", "type": "uint8" }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

import { CONTRACT_ADDRESSES } from '../config/contracts';

// Token addresses from configuration
const TOKEN_ADDRESSES = {
  USDC: CONTRACT_ADDRESSES.USDC,
  USDT: CONTRACT_ADDRESSES.USDT,
};

export interface PaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
  subscriptionExpiry?: number;
}

export interface Plan {
  id: string;
  name: string;
  price: string;
  currency: 'MATIC' | 'USDC' | 'ETH';
  duration: number;
}

class PaymentService {
  private contractAddress: string;
  private provider: BrowserProvider | null = null;
  private signer: any = null;

  constructor() {
    this.contractAddress = CONTRACT_ADDRESSES.SUBSCRIPTION;
    console.log('PaymentService initialized with contract address:', this.contractAddress);
  }

  private mapFriendlyError(error: any, context: 'payment' | 'cancel' | 'treasury' | 'generic' = 'generic'): string {
    const message = (error?.info?.error?.message || error?.shortMessage || error?.message || '').toString();
    const code = error?.code || error?.info?.error?.code;
    
    // User rejected in MetaMask / ACTION_REJECTED
    if (code === 4001 || /ACTION_REJECTED/i.test(message) || /User denied/i.test(message)) {
      return 'Transaction rejected in your wallet.';
    }
    // MetaMask pending request
    if (code === -32002) {
      return 'Action already pending in your wallet. Open MetaMask to complete it.';
    }
    // Network mismatch
    if (/wrong network|chain|sepolia/i.test(message)) {
      return 'Please switch your wallet to Sepolia and try again.';
    }
    // Insufficient funds
    if (/insufficient funds/i.test(message)) {
      return 'Insufficient balance to cover the amount and gas.';
    }
    // Common contract revert reasons
    if (/Plan not exists/i.test(message)) {
      return 'This plan is not published on-chain yet.';
    }
    if (/Plan not active/i.test(message)) {
      return 'This plan is currently inactive.';
    }
    if (/Incorrect value/i.test(message)) {
      return 'Payment amount does not match the plan price on-chain.';
    }
    
    // Fallbacks by context
    if (context === 'payment') return 'Payment failed. Please try again.';
    if (context === 'cancel') return 'Cancellation failed. Please try again.';
    if (context === 'treasury') return 'Failed to update treasury. Please try again.';
    return 'Something went wrong. Please try again.';
  }

  private async getProvider(): Promise<BrowserProvider> {
    if (!this.provider) {
      const { ethereum } = window as any;
      if (!ethereum) {
        throw new Error('No wallet found. Please install MetaMask or a compatible wallet.');
      }
      
      // Check if we're on the correct network
      try {
        const chainId = await ethereum.request({ method: 'eth_chainId' });
        const currentChainId = parseInt(chainId, 16);
        console.log('Wallet Chain ID:', currentChainId);
        console.log('Expected Chain ID: 11155111 (Sepolia)');
        
        if (currentChainId !== 11155111) {
          console.log('Attempting to switch to Sepolia testnet...');
          try {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xaa36a7' }], // 0xaa36a7 = 11155111 in hex
            });
            console.log('Successfully switched to Sepolia');
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              // Network not added, try to add it
              try {
                await ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: '0xaa36a7',
                    chainName: 'Sepolia',
                    rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/JwnbGfdnGxR-esnZ4vjlH'],
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    blockExplorerUrls: ['https://sepolia.etherscan.io'],
                  }],
                });
                console.log('Successfully added and switched to Sepolia');
              } catch (addError) {
                throw new Error(`Failed to add Sepolia network. Please add it manually. Error: ${addError.message}`);
              }
            } else {
              throw new Error(`Failed to switch to Sepolia. Please switch manually. Error: ${switchError.message}`);
            }
          }
        }
      } catch (error) {
        console.error('Network check failed:', error);
        throw new Error('Please connect your wallet and switch to Sepolia testnet');
      }
      
      this.provider = new BrowserProvider(ethereum);
    }
    return this.provider;
  }

  private async getSigner() {
    if (!this.signer) {
      const wallet = useWalletStore.getState();
      
      // If the app store thinks we're disconnected, try to recover an already-authorized account
      if (!wallet.isConnected || !wallet.address) {
        const { ethereum } = window as any;
        if (!ethereum) {
          throw new Error('Please connect your wallet to continue');
        }
        try {
          // eth_accounts is non-interactive and returns any already-authorized accounts
          const existingAccounts: string[] = await ethereum.request({ method: 'eth_accounts' });
          if (existingAccounts && existingAccounts.length > 0) {
            // hydrate the wallet store so downstream checks pass
            const providerForBal = await this.getProvider();
            const balanceWei = await providerForBal.getBalance(existingAccounts[0]);
            const chainHex: string = await ethereum.request({ method: 'eth_chainId' });
            useWalletStore.getState().setWalletData({
              address: existingAccounts[0],
              chainId: parseInt(chainHex, 16),
              balance: formatEther(balanceWei),
            });
          } else {
            throw new Error('Please connect your wallet to continue');
          }
        } catch {
          throw new Error('Please connect your wallet to continue');
        }
      }
      const provider = await this.getProvider();
      
      // Try to get signer directly - this will prompt for authorization if needed
      try {
        this.signer = await provider.getSigner();
        return this.signer;
      } catch (error: any) {
        // If we get a -32002 error (user rejected), or any other error, 
        // try to re-request accounts to refresh the authorization
        if (error.code === -32002 || error.message?.includes('User rejected')) {
          throw new Error('Please connect your wallet using the Connect button first');
        }
        
        // For other errors, try to refresh the connection
        const { ethereum } = window as any;
        try {
          const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === wallet.address!.toLowerCase()) {
            this.signer = await provider.getSigner();
            return this.signer;
          }
        } catch (refreshError) {
          // If refresh fails, throw the original error
        }
        
        throw new Error('Please connect your wallet using the Connect button first');
      }
    }
    return this.signer;
  }

  private async getContract() {
    // Guard: ensure contract address is configured
    if (!this.contractAddress || this.contractAddress.toLowerCase() === '0x0000000000000000000000000000000000000000' || !isAddress(this.contractAddress)) {
      throw new Error('Subscription contract not configured. Set VITE_SUBSCRIPTION_CONTRACT_ADDRESS to the deployed contract address.');
    }
    
    console.log('Getting contract with address:', this.contractAddress);
    const signer = await this.getSigner();
    const provider = await this.getProvider();
    
    // Test the contract address first
    try {
      const code = await provider.getCode(this.contractAddress);
      console.log('Contract code at address:', code);
      if (code === '0x') {
        throw new Error(`No contract found at address ${this.contractAddress}. Please check the contract address.`);
      }
    } catch (error) {
      console.error('Error checking contract code:', error);
      throw new Error(`Failed to verify contract at address ${this.contractAddress}. Please check your network connection and contract address.`);
    }
    
    return new Contract(this.contractAddress, SUBSCRIPTION_CONTRACT_ABI, signer);
  }

  /**
   * Expose whether contract is configured for consumers that want to be chain-agnostic
   */
  public isContractConfigured(): boolean {
    return !!this.contractAddress && this.contractAddress.toLowerCase() !== '0x0000000000000000000000000000000000000000';
  }

  /**
   * Read a plan from chain; returns null if it does not exist
   */
  public async getPlanFromChain(planId: number): Promise<{
    token: string;
    priceWei: bigint;
    priceFormatted: string;
    durationSec: bigint;
    active: boolean;
  } | null> {
    try {
      const contract = await this.getContract();
      const exists: boolean = await contract.planExists(planId);
      if (!exists) return null;
      const p = await contract.plans(planId);
      const token: string = p.token;
      const priceWei: bigint = p.price as bigint;
      const durationSec: bigint = p.duration as bigint;
      const active: boolean = p.active as boolean;
      return {
        token,
        priceWei,
        priceFormatted: formatEther(priceWei),
        durationSec,
        active,
      };
    } catch (_) {
      return null;
    }
  }

  /**
   * Create a plan on-chain (owner only). Returns new planId.
   */
  public async createPlanOnChain(priceEther: string, durationDays: number): Promise<number> {
    const contract = await this.getContract();
    const priceWei = parseEther(priceEther);
    const durationSec = BigInt(durationDays) * BigInt(24 * 60 * 60);
    const tx = await contract.createPlan('0x0000000000000000000000000000000000000000', priceWei, durationSec);
    await tx.wait();
    const nextId: bigint = await contract.nextPlanId();
    return Number(nextId) - 1;
  }

  /**
   * Update a plan on-chain (owner only).
   */
  public async updatePlanOnChain(planId: number, priceEther: string, durationDays: number, isActive: boolean): Promise<void> {
    const contract = await this.getContract();
    const priceWei = parseEther(priceEther);
    const durationSec = BigInt(durationDays) * BigInt(24 * 60 * 60);
    // token remains native (address(0))
    if (typeof (contract as any).updatePlan !== 'function') {
      // Fallback: if ABI lacks update, create a new plan instead
      await this.createPlanOnChain(priceEther, durationDays);
      return;
    }
    const tx = await contract.updatePlan(planId, '0x0000000000000000000000000000000000000000', priceWei, durationSec, isActive);
    await tx.wait();
  }

  /** Returns the contract owner address. */
  public async getOwnerAddress(): Promise<string> {
    const contract = await this.getContract();
    const owner: string = await contract.owner();
    return owner;
  }

  /** Returns current subscription contract address string. */
  public getContractAddress(): string {
    return this.contractAddress;
  }

  private async getTokenContract(tokenAddress: string) {
    const signer = await this.getSigner();
    return new Contract(tokenAddress, ERC20_ABI, signer);
  }

  /**
   * Process payment for a subscription plan
   */
  async processPayment(plan: Plan): Promise<PaymentResult> {
    const { addNotification } = useNotificationStore.getState();
    
    try {
      // Early guard for common MetaMask -32002 situation (request already pending)
      const wallet = useWalletStore.getState();
      if (!wallet.isConnected || !wallet.address) {
        return { success: false, error: 'Please connect your wallet to continue' };
      }
      addNotification({
        type: 'info',
        title: 'Processing Payment',
        message: `Preparing payment for ${plan.name}...`,
      });

      // Prevent duplicate purchase if already active for this plan
      try {
        const contract = await this.getContract();
        const signer = await this.getSigner();
        const userAddress = await signer.getAddress();
        const alreadyActive: boolean = await contract.isActive(userAddress, Number(plan.id));
        const expiryBn = await contract.subscriptionExpiry(userAddress, Number(plan.id));
        const expiry = Number(expiryBn || 0);
        const now = Math.floor(Date.now() / 1000);
        if (alreadyActive && expiry > now) {
          return { success: false, error: `You already have an active subscription for this plan until ${new Date(expiry * 1000).toLocaleString()}` };
        }
      } catch (precheckErr) {
        // Non-fatal: continue with purchase; contract/read issues will be caught later
        console.warn('Pre-purchase active check skipped:', precheckErr);
      }

      // Check if user has enough balance
      const hasBalance = await this.checkBalance(plan);
      if (!hasBalance) {
        throw new Error(`Insufficient ${plan.currency} balance`);
      }

      let txHash: string;
      let subscriptionExpiry: number;
      let onChainPlanId = Number(plan.id);

      // Ensure plan exists on-chain; if not and signer is owner, create it on the fly
      try {
        const contract = await this.getContract();
        const planId = Number(plan.id);
        console.log('Checking plan existence for ID:', planId);
        
        // Add error handling for planExists call
        let exists: boolean;
        try {
          exists = await contract.planExists(planId);
          console.log('Plan exists on-chain:', exists);
        } catch (planError) {
          console.error('Error calling planExists:', planError);
          throw new Error(`Failed to check if plan exists. Please ensure you're connected to the correct network (Sepolia) and the contract is deployed. Error: ${planError.message}`);
        }
        if (!exists) {
          const signer = await this.getSigner();
          const signerAddr = await signer.getAddress();
          const ownerAddr: string = await contract.owner();
          console.log('Signer address:', signerAddr);
          console.log('Owner address:', ownerAddr);
          if (ownerAddr.toLowerCase() !== signerAddr.toLowerCase()) {
            throw new Error('This plan is not available on-chain yet. Please ask the owner to publish it.');
          }
          // Create plan as owner (ETH/native only on Sepolia)
          const priceWei = parseEther(plan.price);
          const durationSec = BigInt(plan.duration) * BigInt(24 * 60 * 60);
          const txCreate = await contract.createPlan('0x0000000000000000000000000000000000000000', priceWei, durationSec);
          await txCreate.wait();
          // Determine the new on-chain plan id
          const nextId: bigint = await contract.nextPlanId();
          onChainPlanId = Number(nextId) - 1;
        }
      } catch (preErr) {
        // Surface pre-flight errors to modal
        const msg = preErr instanceof Error ? preErr.message : 'Failed to prepare plan';
        return { success: false, error: msg };
      }

      // On Sepolia, use ETH-only flow
      if (plan.currency === 'MATIC' || plan.currency === 'ETH') {
        // Native token payment
        // Read on-chain price and, if it mismatches UI price, prefer on-chain admin-set price
        const contract = await this.getContract();
        let onChainPlan = await contract.plans(onChainPlanId);
        const requiredValue: bigint = onChainPlan.price as bigint; // in wei

        // Compare with UI price
        const desiredValue: bigint = parseEther(plan.price);
        if (requiredValue !== desiredValue) {
          // If signer is owner, optionally align by creating a new plan with UI price; otherwise proceed with on-chain price
          const signer = await this.getSigner();
          const signerAddr: string = await signer.getAddress();
          const ownerAddr: string = await contract.owner();
          if (ownerAddr.toLowerCase() === signerAddr.toLowerCase()) {
            const durationSec = BigInt(plan.duration) * BigInt(24 * 60 * 60);
            const txCreate = await contract.createPlan('0x0000000000000000000000000000000000000000', desiredValue, durationSec);
            await txCreate.wait();
            const nextId: bigint = await contract.nextPlanId();
            onChainPlanId = Number(nextId) - 1;
            onChainPlan = await contract.plans(onChainPlanId);
          } else {
            // Not owner: inform but continue using the on-chain price
            const uiAmt = plan.price;
            const chainAmt = formatEther(requiredValue);
            useNotificationStore.getState().addNotification?.({
              type: 'info',
              title: 'Using Admin Price',
              message: `Plan price updated by admin. Proceeding with ${chainAmt} ETH (was ${uiAmt}).`,
            });
          }
        }

        const result = await this.processNativePayment({ ...plan, id: String(onChainPlanId), price: formatEther(onChainPlan.price as bigint) });
        txHash = result.txHash;
        subscriptionExpiry = result.subscriptionExpiry;
      } else {
        throw new Error('Only ETH (Sepolia) payments are supported for now');
      }

      // Verify subscription was created on-chain
      const isActive = await this.verifySubscription(String(onChainPlanId), subscriptionExpiry);
      if (!isActive) {
        throw new Error('Subscription verification failed');
      }

      // Update local store and persist to backend
      try {
        const addUserSubscription = useSubscriptionStore.getState().addUserSubscription;
        const signer = await this.getSigner();
        const wallet = await signer.getAddress();
        const startDt = new Date();
        const endDt = new Date(subscriptionExpiry * 1000);
        const subObj: UserSubscription = {
          id: Math.random().toString(36).substr(2, 9),
          planId: String(onChainPlanId),
          planName: plan.name,
          startDate: startDt,
          endDate: endDt,
          status: 'active',
          txHash: txHash,
          price: plan.price,
          currency: 'ETH',
        };
        addUserSubscription(subObj);

        // Best-effort backend persistence
        try {
          await apiCreateSubscription({
            wallet,
            planId: onChainPlanId,
            planName: plan.name,
            startDate: startDt.toISOString(),
            endDate: endDt.toISOString(),
            status: 'active',
            txHash: txHash,
            price: plan.price,
            currency: 'ETH',
          });
        } catch (e) {
          console.warn('Failed to persist subscription to backend:', e);
        }
      } catch (e) {
        console.warn('Failed to update local/remote subscription state:', e);
      }

      return {
        success: true,
        txHash,
        subscriptionExpiry,
      };

    } catch (error: any) {
      console.error('Payment processing error:', error);
      const errorMessage = this.mapFriendlyError(error, 'payment');
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if user has sufficient balance for the plan
   */
  private async checkBalance(plan: Plan): Promise<boolean> {
    const signer = await this.getSigner();
    const address = await signer.getAddress();

    if (plan.currency === 'MATIC' || plan.currency === 'ETH') {
      // Check native token balance using on-chain admin-set price when available
      const provider = await this.getProvider();
      const balance = await provider.getBalance(address);
      let requiredAmount = parseEther(plan.price);
      try {
        const contract = await this.getContract();
        const exists: boolean = await contract.planExists(Number(plan.id));
        if (exists) {
          const p = await contract.plans(Number(plan.id));
          requiredAmount = p.price as bigint;
        }
      } catch (_) {
        // ignore and fallback to UI price
      }
      return balance >= requiredAmount;
    } else {
      // Check ERC20 token balance
      const tokenAddress = TOKEN_ADDRESSES[plan.currency as keyof typeof TOKEN_ADDRESSES];
      if (!tokenAddress) {
        throw new Error(`Unsupported token: ${plan.currency}`);
      }

      const tokenContract = await this.getTokenContract(tokenAddress);
      const balance = await tokenContract.balanceOf(address);
      const decimals = await tokenContract.decimals();
      const requiredAmount = BigInt(plan.price) * BigInt(10 ** decimals);
      
      return balance >= requiredAmount;
    }
  }

  /**
   * Process native token payment (MATIC/ETH)
   */
  private async processNativePayment(plan: Plan): Promise<{ txHash: string; subscriptionExpiry: number }> {
    const { addNotification } = useNotificationStore.getState();
    const contract = await this.getContract();
    // Accept price either as ether string or wei numeric placed in price; prefer reading from chain
    let amount;
    try {
      amount = parseEther(plan.price);
    } catch {
      // fallback: if price is a wei string/number
      amount = BigInt(plan.price);
    }
    
    addNotification({
      type: 'info',
      title: 'Confirm Transaction',
      message: `Please confirm the payment of ${plan.price} ${plan.currency} in your wallet`,
    });

    // Call subscribeNative with exact amount
    const tx = await contract.subscribeNative(Number(plan.id), { value: amount });
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error('Transaction failed - no receipt received');
    }

    // Get subscription expiry from contract
    const signer = await this.getSigner();
    const userAddress = await signer.getAddress();
    const subscriptionExpiry = await contract.subscriptionExpiry(userAddress, Number(plan.id));

    return {
      txHash: tx.hash,
      subscriptionExpiry: Number(subscriptionExpiry),
    };
  }

  /**
   * Process ERC20 token payment (USDC, USDT, etc.)
   */
  private async processERC20Payment(plan: Plan): Promise<{ txHash: string; subscriptionExpiry: number }> {
    const { addNotification } = useNotificationStore.getState();
    const tokenAddress = TOKEN_ADDRESSES[plan.currency as keyof typeof TOKEN_ADDRESSES];
    if (!tokenAddress) {
      throw new Error(`Unsupported token: ${plan.currency}`);
    }

    const tokenContract = await this.getTokenContract(tokenAddress);
    const contract = await this.getContract();
    const signer = await this.getSigner();
    const userAddress = await signer.getAddress();

    // Get token decimals and calculate required amount
    const decimals = await tokenContract.decimals();
    const requiredAmount = BigInt(plan.price) * BigInt(10 ** decimals);

    // Check current allowance
    const currentAllowance = await tokenContract.allowance(userAddress, this.contractAddress);
    
    if (currentAllowance < requiredAmount) {
      addNotification({
        type: 'info',
        title: 'Approve Token',
        message: `Please approve ${plan.currency} spending in your wallet`,
      });

      // Approve token spending
      const approveTx = await tokenContract.approve(this.contractAddress, requiredAmount);
      await approveTx.wait();
    }

    addNotification({
      type: 'info',
      title: 'Confirm Payment',
      message: `Please confirm the payment of ${plan.price} ${plan.currency} in your wallet`,
    });

    // Call subscribeERC20
    const tx = await contract.subscribeERC20(Number(plan.id));
    const receipt = await tx.wait();

    if (!receipt) {
      throw new Error('Transaction failed - no receipt received');
    }

    // Get subscription expiry from contract
    const subscriptionExpiry = await contract.subscriptionExpiry(userAddress, Number(plan.id));

    return {
      txHash: tx.hash,
      subscriptionExpiry: Number(subscriptionExpiry),
    };
  }

  /**
   * Verify that subscription was created successfully on-chain
   */
  private async verifySubscription(planId: string, expectedExpiry: number): Promise<boolean> {
    try {
      const contract = await this.getContract();
      const signer = await this.getSigner();
      const userAddress = await signer.getAddress();

      const isActive = await contract.isActive(userAddress, Number(planId));
      const actualExpiry = await contract.subscriptionExpiry(userAddress, Number(planId));

      return isActive && Number(actualExpiry) === expectedExpiry;
    } catch (error) {
      console.error('Subscription verification error:', error);
      return false;
    }
  }

  /**
   * Cancel a subscription
   */
  async cancelSubscription(planId: string): Promise<PaymentResult> {
    const { addNotification } = useNotificationStore.getState();
    
    try {
      addNotification({
        type: 'info',
        title: 'Cancelling Subscription',
        message: 'Please confirm the cancellation in your wallet',
      });

      const contract = await this.getContract();
      // Pre-check: only allow cancel if subscription is currently active
      try {
        const signer = await this.getSigner();
        const userAddress = await signer.getAddress();
        const active: boolean = await contract.isActive(userAddress, Number(planId));
        const expiryBn = await contract.subscriptionExpiry(userAddress, Number(planId));
        const expiry = Number(expiryBn || 0);
        const now = Math.floor(Date.now() / 1000);
        if (!active || expiry <= now) {
          return { success: false, error: 'No active subscription to cancel' };
        }
      } catch (_) {
        // ignore read errors; proceed to tx which will revert if not active
      }
      const tx = await contract.cancelSubscription(Number(planId));
      const receipt = await tx.wait();

      if (!receipt) {
        throw new Error('Cancellation failed - no receipt received');
      }

      addNotification({
        type: 'success',
        title: 'Subscription Cancelled',
        message: 'Your subscription has been cancelled successfully',
      });

      return {
        success: true,
        txHash: tx.hash,
      };

    } catch (error) {
      console.error('Subscription cancellation error:', error);
      const errorMessage = this.mapFriendlyError(error, 'cancel');
      
      addNotification({
        type: 'error',
        title: 'Cancellation Failed',
        message: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Get user's subscription status for a plan
   */
  async getSubscriptionStatus(planId: string): Promise<{ isActive: boolean; expiry: number }> {
    try {
      const contract = await this.getContract();
      const signer = await this.getSigner();
      const userAddress = await signer.getAddress();

      const isActive = await contract.isActive(userAddress, Number(planId));
      const expiry = await contract.subscriptionExpiry(userAddress, Number(planId));

      return {
        isActive,
        expiry: Number(expiry),
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return {
        isActive: false,
        expiry: 0,
      };
    }
  }

  /**
   * Read current treasury from contract
   */
  async getTreasuryAddress(): Promise<string> {
    try {
      const contract = await this.getContract();
      const addr: string = await contract.treasury();
      return addr;
    } catch (e) {
      console.error('getTreasuryAddress error:', e);
      return '0x0000000000000000000000000000000000000000';
    }
  }

  /**
   * Update treasury address (owner-only)
   */
  async setTreasuryAddress(newAddress: string): Promise<PaymentResult> {
    const { addNotification } = useNotificationStore.getState();
    try {
      if (!newAddress || !newAddress.startsWith('0x') || newAddress.length !== 42) {
        throw new Error('Invalid address');
      }
      addNotification({
        type: 'info',
        title: 'Updating Treasury',
        message: 'Please confirm the transaction in your wallet',
      });
      const contract = await this.getContract();
      const tx = await contract.setTreasury(newAddress);
      const receipt = await tx.wait();
      if (!receipt) throw new Error('No receipt');
      addNotification({ type: 'success', title: 'Treasury Updated', message: 'New treasury set successfully' });
      return { success: true, txHash: tx.hash };
    } catch (error) {
      const msg = this.mapFriendlyError(error, 'treasury');
      addNotification({ type: 'error', title: 'Update Failed', message: msg });
      return { success: false, error: msg };
    }
  }
}

export const paymentService = new PaymentService();

