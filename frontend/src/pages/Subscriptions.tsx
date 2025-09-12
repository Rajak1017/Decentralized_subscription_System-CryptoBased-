import { motion } from 'framer-motion';
import { useSubscriptionStore } from '../stores/useSubscriptionStore';
import { useWalletStore } from '../stores/useWalletStore';
import { SubscriptionCard } from '../components/subscription-card';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Link } from 'react-router-dom';
import { Plus, Wallet, Search, Loader2, RefreshCw, Play } from 'lucide-react';
import { Input } from '../components/ui/input';
import { useState, useEffect } from 'react';
import { fetchSubscriptions } from '../lib/api';

export default function Subscriptions() {
  const { userSubscriptions, setUserSubscriptions } = useSubscriptionStore();
  const { isConnected, address } = useWalletStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSubscriptions = async () => {
    if (!isConnected || !address) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const subs = await fetchSubscriptions(address);
      console.log('Fetched subscriptions:', subs);
      console.log('Sample subscription data:', subs[0]);
      const mapped = subs.map((s) => {
        // Ensure dates are properly converted
        const startDate = new Date(s.startDate);
        const endDate = new Date(s.endDate);
        
        return {
          id: String(s.id),
          planId: String(s.planId),
          planName: s.planName,
          startDate: isNaN(startDate.getTime()) ? new Date() : startDate,
          endDate: isNaN(endDate.getTime()) ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : endDate,
          status: s.status,
          txHash: s.txHash,
          price: s.price,
          currency: s.currency,
        };
      });
      setUserSubscriptions(mapped);
    } catch (err) {
      console.error('Failed to fetch subscriptions:', err);
      setError(err.message || 'Failed to load subscriptions');
      setUserSubscriptions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load subscriptions when wallet is connected
  useEffect(() => {
    loadSubscriptions();
  }, [isConnected, address, setUserSubscriptions]);

  const filteredSubscriptions = userSubscriptions.filter(subscription =>
    subscription.planName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subscription.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSubscriptions = filteredSubscriptions.filter(sub => sub.status === 'active');
  const inactiveSubscriptions = filteredSubscriptions.filter(sub => sub.status !== 'active');

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-md mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="card-gradient p-8">
              <div className="w-16 h-16 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="h-8 w-8 text-neon-cyan" />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
              <p className="text-muted-foreground mb-6">
                Please connect your wallet to view your subscriptions
              </p>
              
              <Link to="/">
                <Button className="btn-gradient">
                  Go to Home
                </Button>
              </Link>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-md mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="card-gradient p-8">
              <div className="w-16 h-16 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="h-8 w-8 text-neon-cyan animate-spin" />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">Loading Subscriptions</h1>
              <p className="text-muted-foreground">
                Please wait while we fetch your subscription data...
              </p>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center max-w-md mx-auto"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Card className="card-gradient p-8">
              <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="h-8 w-8 text-destructive" />
              </div>
              
              <h1 className="text-2xl font-bold mb-4">Error Loading Subscriptions</h1>
              <p className="text-muted-foreground mb-6">
                {error}
              </p>
              
              <Button 
                className="btn-gradient"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              My <span className="text-gradient">Subscriptions</span>
            </h1>
            <p className="text-muted-foreground">
              Manage all your decentralized subscriptions in one place
            </p>
          </div>
          
          <div className="mt-4 md:mt-0 flex space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Button
              variant="outline"
              onClick={loadSubscriptions}
              disabled={isLoading}
              className="border-neon-cyan/30 hover:border-neon-cyan/50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Link to="/plans">
              <Button className="btn-gradient">
                <Plus className="h-4 w-4 mr-2" />
                New Subscription
              </Button>
            </Link>
          </div>
        </motion.div>

        {userSubscriptions.length === 0 ? (
          <motion.div
            className="text-center py-16"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
          >
            <Card className="card-gradient p-12 max-w-md mx-auto">
              <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Plus className="h-10 w-10 text-muted-foreground" />
              </div>
              
              <h2 className="text-xl font-semibold mb-4">No Subscriptions Yet</h2>
              <p className="text-muted-foreground mb-6">
                You haven't subscribed to any plans yet. Browse our available plans to get started.
              </p>
              
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-muted-foreground mb-4 p-2 bg-muted/20 rounded">
                  Debug: Wallet: {address?.slice(0, 10)}... | 
                  Connected: {isConnected ? 'Yes' : 'No'} | 
                  Loading: {isLoading ? 'Yes' : 'No'}
                </div>
              )}
              
              <Link to="/plans">
                <Button className="btn-gradient">
                  Browse Plans
                </Button>
              </Link>
            </Card>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Active Subscriptions */}
            {activeSubscriptions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
              >
                <h2 className="text-xl font-semibold mb-6 text-neon-green">
                  Active Subscriptions ({activeSubscriptions.length})
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeSubscriptions.map((subscription, index) => (
                    <motion.div
                      key={subscription.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1, duration: 0.6 }}
                    >
                      <SubscriptionCard subscription={subscription} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Inactive Subscriptions */}
            {inactiveSubscriptions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
              >
                <h2 className="text-xl font-semibold mb-6 text-muted-foreground">
                  Past Subscriptions ({inactiveSubscriptions.length})
                </h2>
                
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {inactiveSubscriptions.map((subscription, index) => (
                    <motion.div
                      key={subscription.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1, duration: 0.6 }}
                      viewport={{ once: true }}
                    >
                      <SubscriptionCard subscription={subscription} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {filteredSubscriptions.length === 0 && searchQuery && (
              <motion.div
                className="text-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Card className="card-gradient p-8 max-w-md mx-auto">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">No Results Found</h3>
                  <p className="text-sm text-muted-foreground">
                    No subscriptions match your search query "{searchQuery}"
                  </p>
                </Card>
              </motion.div>
            )}
          </div>
        )}

        {/* Stats */}
        {userSubscriptions.length > 0 && (
          <motion.div
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="card-gradient p-6 text-center">
              <div className="text-2xl font-bold text-neon-green mb-1">
                {activeSubscriptions.length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </Card>
            
            <Card className="card-gradient p-6 text-center">
              <div className="text-2xl font-bold text-muted-foreground mb-1">
                {inactiveSubscriptions.length}
              </div>
              <div className="text-sm text-muted-foreground">Inactive</div>
            </Card>
            
            <Card className="card-gradient p-6 text-center">
              <div className="text-2xl font-bold text-neon-cyan mb-1">
                {userSubscriptions.length}
              </div>
              <div className="text-sm text-muted-foreground">Total</div>
            </Card>
            
            <Card className="card-gradient p-6 text-center">
              <div className="text-2xl font-bold text-neon-purple mb-1">
                {userSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.price), 0).toFixed(2)}
              </div>
              <div className="text-sm text-muted-foreground">Total Spent</div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}