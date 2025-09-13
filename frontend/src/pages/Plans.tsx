import { motion } from 'framer-motion';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { PlanCard } from '../components/plan-card';
import { PaymentStatus } from '../components/payment-status';
import { Card } from '../components/ui/card';
import { Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { paymentService } from '../services/paymentService';
import ElectricBorder from '../components/ElectricBorder';

export default function Plans() {
  const { plans } = useSubscriptionStore();
  const setPlans = useSubscriptionStore((s) => s.setPlans);

  // On mount, try to sync each visible plan's price/duration/active from chain if contract is configured
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!paymentService.isContractConfigured()) return;
        
        // Check if wallet is actually connected and authorized
        const { ethereum } = window as any;
        if (!ethereum) return;
        
        const accounts = await ethereum.request?.({ method: 'eth_accounts' });
        if (!accounts || accounts.length === 0) {
          console.log('Plans sync skipped: wallet not authorized');
          return;
        }
        
        const updated = await Promise.all(plans.map(async (p) => {
          const onChain = await paymentService.getPlanFromChain(Number(p.id));
          if (!onChain) return p; // plan not found on-chain, keep UI values
          return {
            ...p,
            // prefer on-chain values for correctness
            price: onChain.priceFormatted,
            duration: Number(onChain.durationSec) / (24 * 60 * 60),
            isActive: onChain.active,
            currency: 'ETH',
          } as typeof p;
        }));
        if (!cancelled) setPlans(updated as any);
      } catch (error) {
        console.log('Plans sync failed:', error);
        // silent: UI will still work using configured plans
      }
    })();
    return () => { cancelled = true; };
  }, [plans, setPlans]);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center space-x-2 bg-neon-cyan/10 px-4 py-2 rounded-full mb-6">
            <Sparkles className="h-4 w-4 text-neon-cyan" />
            <span className="text-sm text-neon-cyan font-medium">Choose Your Plan</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Subscription <span className="text-gradient">Plans</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your needs. All plans include access to our decentralized platform 
            with transparent pricing and no hidden fees.
          </p>
        </motion.div>

        {/* Payment Status */}
        <motion.div
          className="mb-12 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.8 }}
        >
          <ElectricBorder style={{ borderRadius: 16 }}>
            <PaymentStatus />
          </ElectricBorder>
        </motion.div>

        {/* Plans Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch"
          style={{ gridAutoRows: '1fr' }}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.8 }}
              className="w-full h-full"
            >
              <PlanCard 
                plan={plan} 
                isPopular={plan.name === 'Professional'} 
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Features Comparison */}
        <motion.div
          className="mt-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            Why Choose Decentralized Subscriptions?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <ElectricBorder style={{ borderRadius: 16 }} className="h-full">
              <Card className="card-gradient p-6 text-center h-full flex flex-col">
                <div className="w-12 h-12 bg-neon-green/20 rounded-xl flex items-center justify-center mx-auto mb-4 flex-shrink-0">
                  <div className="w-6 h-6 bg-neon-green rounded-full" />
                </div>
                <h3 className="font-semibold mb-2 flex-shrink-0">Transparent Pricing</h3>
                <p className="text-sm text-muted-foreground flex-grow">
                  All transactions are on-chain and verifiable. No hidden fees or surprise charges.
                </p>
              </Card>
            </ElectricBorder>
            
            <ElectricBorder style={{ borderRadius: 16 }} className="h-full">
              <Card className="card-gradient p-6 text-center h-full flex flex-col">
                <div className="w-12 h-12 bg-neon-cyan/20 rounded-xl flex items-center justify-center mx-auto mb-4 flex-shrink-0">
                  <div className="w-6 h-6 bg-neon-cyan rounded-full" />
                </div>
                <h3 className="font-semibold mb-2 flex-shrink-0">Global Access</h3>
                <p className="text-sm text-muted-foreground flex-grow">
                  Access from anywhere in the world with just your crypto wallet.
                </p>
              </Card>
            </ElectricBorder>
            
            <ElectricBorder style={{ borderRadius: 16 }} className="h-full">
              <Card className="card-gradient p-6 text-center h-full flex flex-col">
                <div className="w-12 h-12 bg-neon-purple/20 rounded-xl flex items-center justify-center mx-auto mb-4 flex-shrink-0">
                  <div className="w-6 h-6 bg-neon-purple rounded-full" />
                </div>
                <h3 className="font-semibold mb-2 flex-shrink-0">Instant Activation</h3>
                <p className="text-sm text-muted-foreground flex-grow">
                  Once payment is confirmed, your subscription is active immediately.
                </p>
              </Card>
            </ElectricBorder>
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          className="mt-20 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            <ElectricBorder style={{ borderRadius: 16 }}>
              <Card className="card-gradient p-6 h-full flex flex-col">
                <h3 className="font-semibold mb-2 flex-shrink-0">What cryptocurrencies do you accept?</h3>
                <p className="text-sm text-muted-foreground flex-grow">
                  We currently accept MATIC, USDC, and ETH. All transactions are processed on the Polygon network for fast and affordable transactions.
                </p>
              </Card>
            </ElectricBorder>
            
            <ElectricBorder style={{ borderRadius: 16 }}>
              <Card className="card-gradient p-6 h-full flex flex-col">
                <h3 className="font-semibold mb-2 flex-shrink-0">Can I cancel my subscription anytime?</h3>
                <p className="text-sm text-muted-foreground flex-grow">
                  Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period.
                </p>
              </Card>
            </ElectricBorder>
            
            <ElectricBorder style={{ borderRadius: 16 }}>
              <Card className="card-gradient p-6 h-full flex flex-col">
                <h3 className="font-semibold mb-2 flex-shrink-0">Is my data secure?</h3>
                <p className="text-sm text-muted-foreground flex-grow">
                  Absolutely. We use blockchain technology to ensure transparency and security. Your subscription data is stored on-chain and cannot be tampered with.
                </p>
              </Card>
            </ElectricBorder>
          </div>
        </motion.div>
      </div>
    </div>
  );
}