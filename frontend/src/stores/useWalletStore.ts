import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface WalletState {
  address: string | null;
  isConnected: boolean;
  chainId: number | null;
  balance: string | null;
  isAdmin: boolean | undefined; // undefined = not checked yet, true/false = checked
  
  // Actions
  setWalletData: (data: {
    address: string;
    chainId: number;
    balance: string;
    isAdmin?: boolean;
  }) => void;
  disconnect: () => void;
}

export const useWalletStore = create<WalletState>()(
  devtools(
    persist((set) => ({
      address: null,
      isConnected: false,
      chainId: null,
      balance: null,
      isAdmin: undefined,
      
      setWalletData: (data) => set((state) => ({
        address: data.address,
        isConnected: true,
        chainId: data.chainId,
        balance: data.balance,
        // Preserve previous isAdmin unless explicitly provided
        isAdmin: typeof data.isAdmin === 'boolean' ? data.isAdmin : state.isAdmin,
      })),
      
      disconnect: () => set({
        address: null,
        isConnected: false,
        chainId: null,
        balance: null,
        isAdmin: undefined,
      }),
    }), { 
      name: 'wallet-store',
      partialize: (state) => ({
        address: state.address,
        isConnected: state.isConnected,
        chainId: state.chainId,
        // Do not persist balance to avoid stale values; it is refreshed on load
        // Don't persist isAdmin - always check fresh from API
      })
    }),
    { name: 'wallet-store' }
  )
);