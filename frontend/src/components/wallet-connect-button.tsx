import { motion } from 'framer-motion';
import { Wallet, LogOut, Copy } from 'lucide-react';
import { Button } from './ui/button';
import { useWalletStore } from '../stores/useWalletStore';
import { connectWallet } from '../utils/contract';
import { useNotificationStore } from '../stores/useNotificationStore';
import { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import ElectricBorder from '../components/ElectricBorder';

export const WalletConnectButton = () => {
  const { address, isConnected, balance, setWalletData, disconnect, chainId } = useWalletStore();
  const { addNotification } = useNotificationStore();
  const [isConnecting, setIsConnecting] = useState(false);

  // Active balance refresher when address/chain changes or on mount
  useEffect(() => {
    const refresh = async () => {
      try {
        if (!address || !isConnected) return;
        const { BrowserProvider, formatEther } = await import('ethers');
        const { ethereum } = window as any;
        if (!ethereum) return;
        const provider = new BrowserProvider(ethereum);
        const balWei = await provider.getBalance(address);
        const bal = formatEther(balWei);
        setWalletData({ address, chainId: chainId || parseInt(await ethereum.request?.({ method: 'eth_chainId' }), 16), balance: bal });
      } catch (_) {
        // noop
      }
    };
    refresh();
    // also refresh every 30s while mounted
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, [address, chainId, isConnected, setWalletData]);

  const handleConnect = async () => {
    setIsConnecting(true);
    const walletData = await connectWallet();
    if (walletData) {
      setWalletData(walletData);
    }
    setIsConnecting(false);
  };

  const handleDisconnect = () => {
    disconnect();
    addNotification({
      type: 'info',
      title: 'Wallet Disconnected',
      message: 'Your wallet has been disconnected',
    });
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      addNotification({
        type: 'success',
        title: 'Address Copied',
        message: 'Wallet address copied to clipboard',
      });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <ElectricBorder style={{ borderRadius: 8 }}>
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="btn-gradient"
          >
            <Wallet className="h-4 w-4 mr-2" />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
        </ElectricBorder>
      </motion.div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <ElectricBorder style={{ borderRadius: 8 }}>
            <Button variant="outline" className="border-neon-cyan/30 hover:border-neon-cyan/50">
              <Wallet className="h-4 w-4 mr-2" />
              {formatAddress(address!)}
              {balance && (
                <span className="ml-2 text-xs text-neon-cyan">
                  {parseFloat(balance).toFixed(3)} {Number(import.meta.env.VITE_CHAIN_ID || '11155111') === 11155111 ? 'ETH' : 'MATIC'}
                </span>
              )}
            </Button>
          </ElectricBorder>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={copyAddress}>
          <Copy className="h-4 w-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDisconnect}>
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};