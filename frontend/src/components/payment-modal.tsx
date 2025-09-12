import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from './ui/dialog';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Wallet,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { Plan } from '../stores/useSubscriptionStore';
import { paymentService } from '../services/paymentService';
import { getTxUrl } from '../config/contracts';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: Plan | null;
  onSuccess: (txHash: string) => void;
}

export const PaymentModal = ({ isOpen, onClose, plan, onSuccess }: PaymentModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'confirm' | 'processing' | 'success' | 'error'>('confirm');
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handlePayment = async () => {
    if (!plan) return;

    setIsProcessing(true);
    setStep('processing');
    setError('');

    try {
      const result = await paymentService.processPayment({
        id: plan.id,
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        duration: plan.duration,
      });

      if (result.success) {
        setTxHash(result.txHash!);
        setStep('success');
        onSuccess(result.txHash!);
      } else {
        setError(result.error || 'Payment failed');
        setStep('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
      setStep('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (step === 'processing') return; // Don't allow closing during processing
    setStep('confirm');
    setTxHash('');
    setError('');
    onClose();
  };

  const getStepIcon = () => {
    switch (step) {
      case 'confirm':
        return <Wallet className="h-6 w-6 text-neon-cyan" />;
      case 'processing':
        return <Loader2 className="h-6 w-6 animate-spin text-neon-cyan" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-neon-green" />;
      case 'error':
        return <AlertTriangle className="h-6 w-6 text-destructive" />;
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'confirm':
        return 'Confirm Payment';
      case 'processing':
        return 'Processing Payment';
      case 'success':
        return 'Payment Successful';
      case 'error':
        return 'Payment Failed';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'confirm':
        return `You are about to subscribe to ${plan?.name} for ${plan?.price} ${plan?.currency}`;
      case 'processing':
        return 'Please wait while we process your payment...';
      case 'success':
        return 'Your subscription has been activated successfully!';
      case 'error':
        return error || 'An error occurred during payment processing';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getStepIcon()}
            <span>{getStepTitle()}</span>
          </DialogTitle>
          <DialogDescription>
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        {plan && (
          <div className="space-y-6">
            {/* Plan Details */}
            {step === 'confirm' && (
              <Card className="p-4 border-neon-cyan/20">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{plan.name}</h3>
                    <Badge variant="outline" className="border-neon-cyan/30 text-neon-cyan">
                      {plan.currency}
                    </Badge>
                  </div>
                  
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.currency}</span>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Duration: {plan.duration} days
                  </div>
                  
                  <div className="text-sm">
                    <div className="font-medium mb-1">Features included:</div>
                    <ul className="space-y-1 text-muted-foreground">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-3 w-3 text-neon-green" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Card>
            )}

            {/* Processing State */}
            {step === 'processing' && (
              <div className="text-center py-8">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto mb-4"
                >
                  <Loader2 className="w-full h-full text-neon-cyan" />
                </motion.div>
                <p className="text-muted-foreground">
                  Please confirm the transaction in your wallet...
                </p>
              </div>
            )}

            {/* Success State */}
            {step === 'success' && (
              <div className="text-center py-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10 }}
                  className="w-16 h-16 mx-auto mb-4"
                >
                  <CheckCircle className="w-full h-full text-neon-green" />
                </motion.div>
                <p className="text-muted-foreground mb-4">
                  Your subscription is now active!
                </p>
                {txHash && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(getTxUrl(txHash), '_blank')}
                    className="border-neon-cyan/30 hover:border-neon-cyan/50"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Explorer
                  </Button>
                )}
              </div>
            )}

            {/* Error State */}
            {step === 'error' && (
              <div className="text-center py-8">
                <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive" />
                <p className="text-muted-foreground mb-4">
                  {error || 'Payment failed. Please try again.'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3">
              {step === 'confirm' && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handlePayment}
                    disabled={isProcessing}
                    className="flex-1 btn-gradient"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Pay {plan.price} {plan.currency}
                  </Button>
                </>
              )}
              
              {step === 'success' && (
                <Button
                  onClick={handleClose}
                  className="flex-1 btn-gradient"
                >
                  Continue
                </Button>
              )}
              
              {step === 'error' && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => setStep('confirm')}
                    className="flex-1 btn-gradient"
                  >
                    Try Again
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
