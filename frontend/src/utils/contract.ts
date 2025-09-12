import { useNotificationStore } from '../stores/useNotificationStore';
import { useSubscriptionStore, UserSubscription } from '../stores/useSubscriptionStore';
import { createSubscription, cancelSubscriptionApi, registerWallet } from '../lib/api';
import { useWalletStore } from '../stores/useWalletStore';
import { BrowserProvider, Contract, parseEther, formatEther } from 'ethers';

// Mock contract interactions for demo purposes
// In a real app, these would interact with actual smart contracts

export const mockDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Minimal ABI subset used by the app
const SUBSCRIPTIONS_ABI = [
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
      { "internalType": "uint256", "name": "planId", "type": "uint256" }
    ],
    "name": "cancelSubscription",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

const getContract = async () => {
  const { ethereum } = window as any;
  if (!ethereum) throw new Error('No wallet found');
  const provider = new BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  const address = import.meta.env.VITE_SUBSCRIPTIONS_ADDRESS ?? '0xdddB5E78c123FB1D93A99B4FE779FaCdce04a1CC';
  return new Contract(address, SUBSCRIPTIONS_ABI, signer);
};

export const subscribe = async (planId: string): Promise<boolean> => {
  const { addNotification } = useNotificationStore.getState();
  const { plans, addUserSubscription } = useSubscriptionStore.getState();
  const wallet = useWalletStore.getState().address;
  
  try {
    const plan = plans.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Plan not found');
    }
    
    // Import payment service dynamically to avoid circular dependencies
    const { paymentService } = await import('../services/paymentService');
    
    // Process payment through the payment service
    const paymentResult = await paymentService.processPayment({
      id: planId,
      name: plan.name,
      price: plan.price,
      currency: plan.currency,
      duration: plan.duration,
    });

    if (!paymentResult.success) {
      throw new Error(paymentResult.error || 'Payment failed');
    }

    // Create subscription only after successful payment
    const subscription: UserSubscription = {
      id: Math.random().toString(36).substr(2, 9),
      planId,
      planName: plan.name,
      startDate: new Date(),
      endDate: new Date(paymentResult.subscriptionExpiry! * 1000), // Convert from seconds to milliseconds
      status: 'active',
      txHash: paymentResult.txHash!,
      price: plan.price,
      currency: plan.currency,
    };
    
    addUserSubscription(subscription);

    // Persist to backend
    try {
      await createSubscription({
        wallet: wallet ?? '',
        planId: Number(planId),
        planName: plan.name,
        startDate: subscription.startDate.toISOString(),
        endDate: subscription.endDate.toISOString(),
        status: 'active',
        txHash: subscription.txHash,
        price: subscription.price,
        currency: subscription.currency,
      });
    } catch (e) {
      console.warn('Failed to persist subscription to backend:', e);
      // Don't fail the subscription if backend persistence fails
      // The on-chain subscription is already created
    }
    
    return true;
  } catch (error) {
    console.error('Subscription error:', error);
    addNotification({
      type: 'error',
      title: 'Subscription Failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
    return false;
  }
};

export const cancelSubscription = async (subscriptionId: string): Promise<boolean> => {
  const { addNotification } = useNotificationStore.getState();
  const { cancelUserSubscription, userSubscriptions } = useSubscriptionStore.getState();
  
  try {
    const sub = userSubscriptions.find(s => s.id === subscriptionId);
    if (!sub) {
      throw new Error('Subscription not found');
    }

    // Import payment service dynamically to avoid circular dependencies
    const { paymentService } = await import('../services/paymentService');
    
    // Cancel subscription on-chain
    const cancelResult = await paymentService.cancelSubscription(sub.planId);
    
    if (!cancelResult.success) {
      throw new Error(cancelResult.error || 'Cancellation failed');
    }
    
    // Update local state
    cancelUserSubscription(subscriptionId);

    // Try to cancel at backend (best-effort)
    try {
      await cancelSubscriptionApi(Number(subscriptionId));
    } catch (e) {
      console.warn('Failed to cancel subscription in backend:', e);
      // Don't fail the cancellation if backend update fails
      // The on-chain cancellation is already completed
    }
    
    return true;
  } catch (error) {
    console.error('Cancellation error:', error);
    addNotification({
      type: 'error',
      title: 'Cancellation Failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    });
    return false;
  }
};

// Mock wallet connection
export const connectWallet = async (): Promise<{
  address: string;
  chainId: number;
  balance: string;
} | null> => {
  const { addNotification } = useNotificationStore.getState();
  const setWalletData = useWalletStore.getState().setWalletData;

  try {
    const { ethereum } = window as any;
    if (!ethereum || !ethereum.request) {
      addNotification({
        type: 'error',
        title: 'No Wallet Found',
        message: 'Install MetaMask or a compatible wallet extension.',
      });
      return null;
    }

    addNotification({
      type: 'info',
      title: 'Connecting Wallet',
      message: 'Please approve the connection in your wallet...',
    });
    
    const accounts: string[] = await ethereum.request({ method: 'eth_requestAccounts' });
    const address = accounts[0];
    const chainHex: string = await ethereum.request({ method: 'eth_chainId' });
    const chainId = parseInt(chainHex, 16);
    // Use ethers provider for precise balance formatting (avoids integer truncation)
    const provider = new BrowserProvider(ethereum);
    const balanceWei = await provider.getBalance(address);
    const balance = formatEther(balanceWei);

    // register listeners
    if (!ethereum.__subdao_listeners_attached) {
      ethereum.on?.('accountsChanged', async (accs: string[]) => {
        if (accs && accs.length > 0) {
          const newAddr = accs[0];
          const prov = new BrowserProvider(ethereum);
          const balWei = await prov.getBalance(newAddr);
          const bal = formatEther(balWei);
          setWalletData({ address: newAddr, chainId: parseInt(await ethereum.request({ method: 'eth_chainId' }), 16), balance: bal });
        } else {
          useWalletStore.getState().disconnect();
        }
      });
      ethereum.on?.('chainChanged', async (_hex: string) => {
        const addr = useWalletStore.getState().address;
        if (addr) {
          const prov = new BrowserProvider(ethereum);
          const balWei = await prov.getBalance(addr);
          const bal = formatEther(balWei);
          setWalletData({ address: addr, chainId: parseInt(_hex, 16), balance: bal });
        }
      });
      ethereum.__subdao_listeners_attached = true;
    }
    
    addNotification({
      type: 'success',
      title: 'Wallet Connected',
      message: 'Your wallet has been connected successfully',
    });
    
    // best-effort: register wallet in backend and get role
    let isAdmin = false;
    try {
      const resp = await registerWallet(address);
      console.log('Wallet registration response:', resp);
      isAdmin = !!resp.isAdmin;
      console.log('Admin status from registration:', isAdmin);
    } catch (err) {
      console.error('Wallet registration failed:', err);
    }

    // Set wallet data with admin status
    setWalletData({ address, chainId, balance, isAdmin });
    console.log('Wallet data set with admin status:', isAdmin);

    return { address, chainId, balance, isAdmin } as any;
  } catch (error) {
    console.error('Wallet connection error:', error);
    addNotification({
      type: 'error',
      title: 'Connection Failed',
      message: 'Failed to connect wallet. Please try again.',
    });
    return null;
  }
};