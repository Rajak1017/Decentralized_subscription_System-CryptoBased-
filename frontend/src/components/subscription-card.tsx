import { motion } from 'framer-motion';
import { Calendar, ExternalLink, X, Play } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { UserSubscription } from '../stores/useSubscriptionStore';
import { cancelSubscription } from '../utils/contract';
import { useEffect, useState } from 'react';
import { paymentService } from '../services/paymentService';
import ElectricBorder from './ElectricBorder';

interface SubscriptionCardProps {
  subscription: UserSubscription;
}

export const SubscriptionCard = ({ subscription }: SubscriptionCardProps) => {
  const [isCancelling, setIsCancelling] = useState(false);
  const [displayPrice, setDisplayPrice] = useState<string>(subscription.price);

  const handleCancel = async () => {
    setIsCancelling(true);
    await cancelSubscription(subscription.id);
    setIsCancelling(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-neon-green/10 text-neon-green border border-neon-green/20 shadow-sm';
      case 'expired':
        return 'bg-destructive/10 text-destructive border border-destructive/20 shadow-sm';
      case 'cancelled':
        return 'bg-muted/10 text-muted-foreground border border-muted/20 shadow-sm';
      default:
        return 'bg-muted/10 text-muted-foreground border border-muted/20 shadow-sm';
    }
  };

  // Ensure dates are proper Date objects with error handling
  const startDate = subscription.startDate instanceof Date ? subscription.startDate : new Date(subscription.startDate);
  const endDate = subscription.endDate instanceof Date ? subscription.endDate : new Date(subscription.endDate);
  
  // Check if dates are valid
  const isValidStartDate = !isNaN(startDate.getTime());
  const isValidEndDate = !isNaN(endDate.getTime());
  
  const isExpired = isValidEndDate && new Date() > endDate;
  const daysLeft = isValidEndDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  // Prefer on-chain plan price if available to keep in sync with Plans tab
  useEffect(() => {
    (async () => {
      try {
        const onChain = await paymentService.getPlanFromChain(Number(subscription.planId));
        if (onChain && onChain.priceFormatted) {
          setDisplayPrice(onChain.priceFormatted);
        } else {
          setDisplayPrice(subscription.price);
        }
      } catch {
        setDisplayPrice(subscription.price);
      }
    })();
  }, [subscription.planId, subscription.price]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
    >
      <Card className="card-gradient hover:shadow-glow transition-all duration-300 hover:scale-[1.02]">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2 text-gradient">{subscription.planName}</h3>
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-foreground">
                {(() => {
                  const n = Number.parseFloat(displayPrice);
                  if (Number.isNaN(n)) return displayPrice;
                  return n < 0.001 ? n.toFixed(6) : n.toFixed(4);
                })()}
              </span>
              <span className="text-lg font-medium text-neon-cyan">
                {subscription.currency === 'ETH' ? 'ETH' : subscription.currency}
              </span>
            </div>
          </div>
          
          <Badge className={`${getStatusColor(subscription.status)} font-medium px-3 py-1 rounded-full`}>
            {subscription.status.toUpperCase()}
          </Badge>
        </div>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Start Date</span>
              <p className="text-sm font-medium">
                {isValidStartDate ? startDate.toLocaleDateString() : 'Invalid Date'}
              </p>
            </div>
            
            <div className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">End Date</span>
              <p className="text-sm font-medium">
                {isValidEndDate ? endDate.toLocaleDateString() : 'Invalid Date'}
              </p>
            </div>
          </div>
          
          {subscription.status === 'active' && !isExpired && (
            <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neon-cyan">Days Remaining</span>
                <span className="text-lg font-bold text-neon-cyan">{daysLeft}</span>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-border/50 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-mono">
                {subscription.txHash.slice(0, 10)}...
              </span>
            </div>
            
            <div className="flex space-x-2">
              {subscription.status === 'active' && !isExpired && (
                <ElectricBorder style={{ borderRadius: 8 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs border-neon-green/30 hover:border-neon-green/50 hover:bg-neon-green/10 text-neon-green"
                    onClick={() => {
                      window.location.href = `/watch/${subscription.planId}`;
                    }}
                  >
                    <Play className="h-3 w-3 mr-1" />
                    Watch
                  </Button>
                </ElectricBorder>
              )}
              <ElectricBorder style={{ borderRadius: 8 }}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs border-neon-cyan/20 hover:border-neon-cyan/40 hover:bg-neon-cyan/10"
                  onClick={() => {
                    const chainId = Number(import.meta.env.VITE_CHAIN_ID || '11155111');
                    const base = chainId === 11155111 ? 'https://sepolia.etherscan.io' : (chainId === 137 ? 'https://polygonscan.com' : 'https://etherscan.io');
                    window.open(`${base}/tx/${subscription.txHash}`, '_blank');
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </Button>
              </ElectricBorder>
              
              {subscription.status === 'active' && (
                <ElectricBorder style={{ borderRadius: 8 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs border-destructive/20 hover:border-destructive/40 hover:bg-destructive/10 text-destructive"
                    onClick={handleCancel}
                    disabled={isCancelling}
                  >
                    <X className="h-3 w-3 mr-1" />
                    {isCancelling ? 'Cancelling...' : 'Cancel'}
                  </Button>
                </ElectricBorder>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};