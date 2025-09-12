import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Loader2, Wallet, RefreshCw } from 'lucide-react';
import { useWalletStore } from '../stores/useWalletStore';
import { paymentService } from '../services/paymentService';

interface TokenBalance {
  symbol: string;
  balance: string;
  formatted: string;
}

export const PaymentStatus = () => {
  const { address, isConnected } = useWalletStore();
  const [balances, setBalances] = useState<TokenBalance[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBalances = async () => {
    if (!isConnected || !address) return;

    setLoading(true);
    try {
      const { BrowserProvider, formatEther } = await import('ethers');
      const { ethereum } = window as any;
      const provider = new BrowserProvider(ethereum);
      
      // Get native token balance (MATIC/ETH)
      const nativeBalance = await provider.getBalance(address);
      const nativeFormatted = formatEther(nativeBalance);
      
      // For Sepolia we show only ETH by default; skip ERC20 when addresses are not configured
      setBalances([
        { symbol: 'ETH', balance: nativeBalance.toString(), formatted: nativeFormatted },
      ]);
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [address, isConnected]);

  if (!isConnected) {
    return (
      <Card className="card-gradient p-6">
        <div className="flex items-center space-x-3">
          <Wallet className="h-6 w-6 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Payment Status</h3>
            <p className="text-sm text-muted-foreground">Connect your wallet to view balances</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="card-gradient p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Wallet className="h-6 w-6 text-neon-cyan" />
          <div>
            <h3 className="font-semibold">Payment Status</h3>
            <p className="text-sm text-muted-foreground">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchBalances}
          disabled={loading}
          className="border-neon-cyan/30 hover:border-neon-cyan/50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-neon-cyan" />
          </div>
        ) : (
          balances.map((token) => (
            <div key={token.symbol} className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="border-neon-cyan/30 text-neon-cyan">
                  {token.symbol}
                </Badge>
                <span className="text-sm text-muted-foreground">Balance</span>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">
                  {parseFloat(token.formatted).toFixed(4)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {token.symbol}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          💡 Ensure you have sufficient balance for subscription payments
        </p>
      </div>
    </Card>
  );
};
