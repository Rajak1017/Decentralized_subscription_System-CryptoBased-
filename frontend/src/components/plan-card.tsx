import ElectricBorder from './ElectricBorder';

import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Plan } from '../stores/useSubscriptionStore';
import { useWalletStore } from '../stores/useWalletStore';
import { useEffect, useState } from 'react';
import { PaymentModal } from './payment-modal';
import { paymentService } from '../services/paymentService';

interface PlanCardProps {
  plan: Plan;
  isPopular?: boolean;
}

export const PlanCard = ({ plan, isPopular = false }: PlanCardProps) => {
  const { isConnected } = useWalletStore();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [displayPrice, setDisplayPrice] = useState<string>(plan.price);

  const handleSubscribe = () => {
    if (!isConnected) return;
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = (txHash: string) => {
    setShowPaymentModal(false);
    // The subscription will be handled by the payment service
  };

  // Prefer on-chain price if plan exists; keeps UI consistent with contract
  useEffect(() => {
    (async () => {
      try {
        // Only try to fetch from chain if contract is configured
        if (paymentService.isContractConfigured()) {
          const onChain = await paymentService.getPlanFromChain(Number(plan.id));
          if (onChain && onChain.priceFormatted) {
            setDisplayPrice(onChain.priceFormatted);
            return;
          }
        }
        // Fallback to local price
        setDisplayPrice(plan.price);
      } catch (error) {
        console.warn('Failed to fetch on-chain price, using local price:', error);
        setDisplayPrice(plan.price);
      }
    })();
  }, [plan.id, plan.price]);

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -8 }}
      transition={{ duration: 0.2 }}
      className="relative w-full h-full"
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-gradient-primary text-primary-foreground px-4 py-1.5 rounded-full shadow-glow">
            <Zap className="h-3 w-3 mr-1.5" />
            Most Popular
          </Badge>
        </div>
      )}
      
      <ElectricBorder 
        color="#7df9ff" 
        speed={0.5} 
        chaos={0.3} 
        thickness={2} 
        style={{ borderRadius: 16 }} 
        className="w-full h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-glow"
      >
        <Card className="card-gradient w-full flex flex-col h-full flex-grow">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold mb-3 text-gradient">{plan.name}</h3>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              {plan.description}
            </p>
            
            <div className="flex items-baseline justify-center mb-2">
              <span className="text-4xl font-bold text-foreground">
                {(() => {
                  const n = Number.parseFloat(displayPrice);
                  if (Number.isNaN(n)) return displayPrice;
                  return n < 0.001 ? n.toFixed(6) : n.toFixed(4);
                })()}
              </span>
              <span className="ml-2 text-xl font-medium text-neon-cyan">
                {plan.currency}
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground font-medium">
              per {plan.duration} days
            </p>
          </div>

          <div className="space-y-4 mb-8 flex-1 overflow-y-auto">
            {plan.features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center space-x-3"
              >
                <div className="rounded-full bg-neon-green/10 p-1.5 border border-neon-green/20">
                  <Check className="h-4 w-4 text-neon-green" />
                </div>
                <span className="text-sm font-medium leading-relaxed">{feature}</span>
              </motion.div>
            ))}
          </div>

          <div className="space-y-3 mt-auto flex flex-col justify-center">
            <ElectricBorder style={{ borderRadius: 8 }}>
              <Button
                onClick={handleSubscribe}
                disabled={!isConnected || !plan.isActive}
                className="w-full py-3 font-semibold transition-all duration-300 btn-gradient hover:scale-105"
              >
                {!isConnected
                  ? 'Connect Wallet'
                  : !plan.isActive
                  ? 'Unavailable'
                  : 'Subscribe Now'
                }
              </Button>
            </ElectricBorder>

            {!plan.isActive && (
              <p className="text-xs text-muted-foreground text-center">
                This plan is currently unavailable
              </p>
            )}
          </div>
        </Card>
      </ElectricBorder>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        plan={plan}
        onSuccess={handlePaymentSuccess}
      />
    </motion.div>
  );
};
