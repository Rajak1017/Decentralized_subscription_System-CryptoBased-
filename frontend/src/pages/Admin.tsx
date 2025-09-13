import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useSubscriptionStore, Plan } from '../stores/useSubscriptionStore';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Switch } from '../components/ui/switch';
import { Badge } from '../components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../components/ui/dialog';
import { Input as TextInput } from '../components/ui/input';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Plus, Edit3, Eye, Settings, Users, DollarSign, TrendingUp } from 'lucide-react';
import { useNotificationStore } from '../stores/useNotificationStore';
import { createPlan as apiCreatePlan, updatePlan as apiUpdatePlan, fetchStats } from '../lib/api';
import { paymentService } from '../services/paymentService';
import { useWalletStore } from '../stores/useWalletStore';
import ElectricBorder from '../components/ElectricBorder';

interface PlanFormData {
  name: string;
  description: string;
  price: string;
  duration: number;
  currency: 'MATIC' | 'USDC' | 'ETH';
  features: string[];
  isActive: boolean;
}

export default function Admin() {
  const { plans, userSubscriptions, addPlan, updatePlan } = useSubscriptionStore();
  const { addNotification } = useNotificationStore();
  const { address, isConnected } = useWalletStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [treasury, setTreasury] = useState<string>('');
  const [isUpdatingTreasury, setIsUpdatingTreasury] = useState(false);
  const [ownerAddress, setOwnerAddress] = useState<string>('');
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [planOnChain, setPlanOnChain] = useState<Record<string, boolean>>({});
  const [planOnChainPrice, setPlanOnChainPrice] = useState<Record<string, string>>({});
  const [usdRates, setUsdRates] = useState<{ ETH: number; MATIC: number; USDC: number }>({ ETH: 0, MATIC: 0, USDC: 1 });
  const [siteStats, setSiteStats] = useState<{ activeUsers: number; subscriptions: number; activeSubscriptions: number; activePlans: number } | null>(null);

  const getMappedOnChainId = (dbId: string): number | null => {
    try {
      const raw = window.localStorage?.getItem(`onchain:planId:${dbId}`);
      return raw ? Number(raw) : null;
    } catch {
      return null;
    }
  };
  const setMappedOnChainId = (dbId: string, onChainId: number) => {
    try {
      window.localStorage?.setItem(`onchain:planId:${dbId}`, String(onChainId));
    } catch {}
  };
  
  const [formData, setFormData] = useState<PlanFormData>({
    name: '',
    description: '',
    price: '',
    duration: 30,
    currency: 'MATIC',
    features: [''],
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      duration: 30,
      currency: 'MATIC',
      features: [''],
      isActive: true,
    });
    setEditingPlan(null);
  };

  // Load current treasury from contract on mount
  useEffect(() => {
    (async () => {
      try {
        const { paymentService } = await import('../services/paymentService');
        const addr = await paymentService.getTreasuryAddress();
        setTreasury(addr);
      } catch {}
    })();
  }, []);

  // Load contract owner and mark whether current wallet is owner
  useEffect(() => {
    (async () => {
      try {
        const owner = await paymentService.getOwnerAddress();
        setOwnerAddress(owner);
        setIsOwner(!!address && owner?.toLowerCase() === address.toLowerCase());
      } catch {
        setOwnerAddress('');
        setIsOwner(false);
      }
    })();
  }, [address]);

  // Check which plans are already on-chain
  useEffect(() => {
    (async () => {
      const entries: Record<string, boolean> = {};
      const prices: Record<string, string> = {};
      for (const p of plans) {
        try {
          const mapped = getMappedOnChainId(p.id);
          const onChain = await paymentService.getPlanFromChain(Number(mapped ?? p.id));
          entries[p.id] = !!onChain;
          if (onChain && onChain.priceFormatted) {
            prices[p.id] = onChain.priceFormatted;
          }
        } catch {
          entries[p.id] = false;
        }
      }
      setPlanOnChain(entries);
      setPlanOnChainPrice(prices);
    })();
  }, [plans.length]);

  // Load site-wide stats (includes total active subscribers)
  useEffect(() => {
    (async () => {
      try {
        const s = await fetchStats();
        setSiteStats(s);
      } catch {}
    })();
  }, []);

  // Fetch live USD rates for ETH and MATIC (USDC ~ $1)
  useEffect(() => {
    (async () => {
      try {
        const url = 'https://api.coingecko.com/api/v3/simple/price?ids=ethereum,matic-network,usd-coin&vs_currencies=usd';
        const res = await fetch(url, { method: 'GET' });
        const json = await res.json();
        const next = {
          ETH: Number(json?.ethereum?.usd ?? 0),
          MATIC: Number(json?.['matic-network']?.usd ?? 0),
          USDC: Number(json?.['usd-coin']?.usd ?? 1),
        } as { ETH: number; MATIC: number; USDC: number };
        if (Number.isFinite(next.ETH) && Number.isFinite(next.MATIC)) {
          setUsdRates(next);
        }
      } catch {
        // Ignore network errors; keep defaults (USDC=1, others 0)
      }
    })();
  }, []);

  const formatUSD = (value: number) => {
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(value);
    } catch {
      return `$${value.toFixed(2)}`;
    }
  };

  const handleTreasuryUpdate = async () => {
    try {
      setIsUpdatingTreasury(true);
      const { paymentService } = await import('../services/paymentService');
      await paymentService.setTreasuryAddress(treasury.trim());
    } finally {
      setIsUpdatingTreasury(false);
    }
  };

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      description: plan.description,
      price: plan.price,
      duration: plan.duration,
      currency: plan.currency,
      features: [...plan.features],
      isActive: plan.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price.trim()) {
      addNotification({ type: 'error', title: 'Validation Error', message: 'Please fill in all required fields' });
      return;
    }
    if (!isConnected || !address) {
      addNotification({ type: 'error', title: 'Wallet Required', message: 'Please connect your wallet as admin to publish plans on-chain.' });
      return;
    }

    try {
      if (editingPlan) {
        const updated = await apiUpdatePlan(Number(editingPlan.id), {
          id: Number(editingPlan.id),
          name: formData.name,
          description: formData.description,
          price: formData.price,
          duration: formData.duration,
          currency: formData.currency,
          features: formData.features.filter(f => f.trim() !== ''),
          isActive: formData.isActive,
          wallet: address,
        } as any);
        updatePlan(editingPlan.id, {
          ...editingPlan,
          name: updated.name,
          description: updated.description,
          price: updated.price as any,
          duration: updated.duration,
          currency: updated.currency as any,
          features: updated.features,
          isActive: updated.isActive,
        });
        addNotification({ type: 'success', title: 'Plan Updated', message: `${updated.name} has been updated successfully` });
        // Publish/update on-chain (owner-only) with clear feedback
        try {
          const addr = paymentService.getContractAddress();
          if (!addr || addr.toLowerCase() === '0x0000000000000000000000000000000000000000') {
            addNotification({ type: 'error', title: 'Contract Not Configured', message: 'Set VITE_SUBSCRIPTION_CONTRACT_ADDRESS to publish on-chain.' });
          } else {
            const owner = await paymentService.getOwnerAddress();
            if (!owner || owner.toLowerCase() !== address!.toLowerCase()) {
              addNotification({ type: 'error', title: 'Owner Required', message: 'Connect the contract owner wallet to publish plans on-chain.' });
            } else {
              const onChain = await paymentService.getPlanFromChain(Number(editingPlan.id));
              if (onChain) {
                await paymentService.updatePlanOnChain(Number(editingPlan.id), updated.price as any, updated.duration, updated.isActive);
                addNotification({ type: 'success', title: 'On-chain Plan Updated', message: `${updated.name} updated on-chain` });
              } else {
                const newId = await paymentService.createPlanOnChain(updated.price as any, updated.duration);
                setMappedOnChainId(String(editingPlan.id), newId);
                addNotification({ type: 'success', title: 'On-chain Plan Created', message: `Plan published on-chain with id ${newId}` });
              }
            }
          }
        } catch (e) {
          addNotification({ type: 'error', title: 'On-chain Publish Failed', message: e instanceof Error ? e.message : 'Failed to publish plan on-chain' });
        }
    } else {
        const created = await apiCreatePlan({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          duration: formData.duration,
          currency: formData.currency,
          features: formData.features.filter(f => f.trim() !== ''),
          isActive: formData.isActive,
          wallet: address,
        });
        addPlan({
          id: String(created.id),
          name: created.name,
          description: created.description,
          price: created.price as any,
          duration: created.duration,
          currency: created.currency as any,
          features: created.features,
          isActive: created.isActive,
        });
        addNotification({ type: 'success', title: 'Plan Created', message: `${created.name} has been created successfully` });
        // Publish on-chain immediately (owner-only) with clear feedback
        try {
          const addr = paymentService.getContractAddress();
          if (!addr || addr.toLowerCase() === '0x0000000000000000000000000000000000000000') {
            addNotification({ type: 'error', title: 'Contract Not Configured', message: 'Set VITE_SUBSCRIPTION_CONTRACT_ADDRESS to publish on-chain.' });
          } else {
            const owner = await paymentService.getOwnerAddress();
            if (!owner || owner.toLowerCase() !== address!.toLowerCase()) {
              addNotification({ type: 'error', title: 'Owner Required', message: 'Connect the contract owner wallet to publish plans on-chain.' });
            } else {
              const newId = await paymentService.createPlanOnChain(created.price as any, created.duration);
              setMappedOnChainId(String(created.id), newId);
              addNotification({ type: 'success', title: 'On-chain Plan Created', message: `Plan published on-chain with id ${newId}` });
            }
          }
        } catch (e) {
          addNotification({ type: 'error', title: 'On-chain Publish Failed', message: e instanceof Error ? e.message : 'Failed to publish plan on-chain' });
        }
      }
    resetForm();
    setIsDialogOpen(false);
    } catch (err) {
      addNotification({ type: 'error', title: 'Request Failed', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  const publishPlanOnChain = async (plan: Plan) => {
    try {
      if (!isConnected || !address) {
        addNotification({ type: 'error', title: 'Wallet Required', message: 'Connect your wallet to publish plans.' });
        return;
      }
      const owner = await paymentService.getOwnerAddress();
      if (owner.toLowerCase() !== address.toLowerCase()) {
        addNotification({ type: 'error', title: 'Owner Required', message: 'Only the contract owner can publish plans on-chain.' });
        return;
      }
      const onChain = await paymentService.getPlanFromChain(Number(plan.id));
      if (onChain) {
        await paymentService.updatePlanOnChain(Number(plan.id), plan.price, plan.duration, plan.isActive);
        addNotification({ type: 'success', title: 'Plan Updated On-chain', message: `${plan.name} updated successfully` });
      } else {
        const newId = await paymentService.createPlanOnChain(plan.price, plan.duration);
        addNotification({ type: 'success', title: 'Plan Published', message: `Published with id ${newId}` });
      }
      // refresh markers
      const exists = await paymentService.getPlanFromChain(Number(plan.id));
      setPlanOnChain(prev => ({ ...prev, [plan.id]: !!exists }));
    } catch (e: any) {
      addNotification({ type: 'error', title: 'Publish Failed', message: e?.message || 'Failed to publish plan' });
    }
  };

  const handleFeatureChange = (index: number, value: string) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const addFeature = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const togglePlanStatus = async (planId: string, currentStatus: boolean) => {
    try {
      const updated = await apiUpdatePlan(Number(planId), { isActive: !currentStatus, wallet: address });
      updatePlan(planId, { isActive: updated.isActive });
      addNotification({ type: 'info', title: 'Plan Status Updated', message: `Plan has been ${!currentStatus ? 'activated' : 'deactivated'}` });
    } catch (err) {
      addNotification({ type: 'error', title: 'Update Failed', message: err instanceof Error ? err.message : 'Unknown error' });
    }
  };

  // Stats calculations
  const totalRevenue = userSubscriptions.reduce((sum, sub) => sum + parseFloat(sub.price), 0);
  const totalRevenueUsd = userSubscriptions.reduce((sum, sub) => {
    const amount = parseFloat((sub as any).price || '0');
    const curr = String((sub as any).currency || 'USDC').toUpperCase();
    const rate = curr === 'ETH' ? usdRates.ETH : curr === 'MATIC' ? usdRates.MATIC : usdRates.USDC;
    if (!Number.isFinite(amount) || !Number.isFinite(rate)) return sum;
    return sum + amount * rate;
  }, 0);
  const activeSubscriptionsCount = userSubscriptions.filter(sub => sub.status === 'active').length;
  const totalPlans = plans.length;
  const activePlans = plans.filter(plan => plan.isActive).length;

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
              <span className="text-gradient">Admin</span> Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage subscription plans and monitor platform metrics
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <ElectricBorder style={{ borderRadius: 8 }}>
                <Button className="btn-gradient mt-4 md:mt-0" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Plan
                </Button>
              </ElectricBorder>
            </DialogTrigger>
            
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'Edit Plan' : 'Create New Plan'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Plan Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Premium Plan"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="price">Price *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration">Duration (days)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                      placeholder="30"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value: 'MATIC' | 'USDC' | 'ETH') => 
                        setFormData(prev => ({ ...prev, currency: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MATIC">MATIC</SelectItem>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="ETH">ETH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Plan description..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Features</Label>
                  <div className="space-y-2">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          value={feature}
                          onChange={(e) => handleFeatureChange(index, e.target.value)}
                          placeholder="Feature description"
                        />
                        {formData.features.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeFeature(index)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addFeature}
                    >
                      Add Feature
                    </Button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                  />
                  <Label htmlFor="active">Active Plan</Label>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <ElectricBorder style={{ borderRadius: 8 }}>
                    <Button type="submit" className="btn-gradient">
                      {editingPlan ? 'Update Plan' : 'Create Plan'}
                    </Button>
                  </ElectricBorder>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <ElectricBorder style={{ borderRadius: 16 }}>
            <Card className="card-gradient p-6 h-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-neon-green">
                    {formatUSD(totalRevenueUsd)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-neon-green" />
              </div>
            </Card>
          </ElectricBorder>

          <ElectricBorder style={{ borderRadius: 16 }}>
            <Card className="card-gradient p-6 h-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Active Subscriptions (site-wide)</p>
                  <p className="text-2xl font-bold text-neon-cyan">
                    {siteStats?.activeSubscriptions ?? 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-neon-cyan" />
              </div>
            </Card>
          </ElectricBorder>

          <ElectricBorder style={{ borderRadius: 16 }}>
            <Card className="card-gradient p-6 h-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Plans</p>
                  <p className="text-2xl font-bold text-neon-purple">
                    {totalPlans}
                  </p>
                </div>
                <Settings className="h-8 w-8 text-neon-purple" />
              </div>
            </Card>
          </ElectricBorder>

          <ElectricBorder style={{ borderRadius: 16 }}>
            <Card className="card-gradient p-6 h-full">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Active Plans</p>
                  <p className="text-2xl font-bold text-neon-pink">
                    {activePlans}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-neon-pink" />
              </div>
            </Card>
          </ElectricBorder>
        </motion.div>

        {/* Treasury Settings */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
          <ElectricBorder style={{ borderRadius: 16 }} className="mb-8">
            <Card className="card-gradient p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Treasury Settings</h2>
                <Badge variant="outline" className="border-neon-cyan/30 text-neon-cyan">Owner-only</Badge>
              </div>

              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <Label htmlFor="treasury">Treasury Address</Label>
                  <TextInput
                    id="treasury"
                    value={treasury}
                    onChange={(e) => setTreasury(e.target.value)}
                    placeholder="0x..."
                  />
                </div>
                <div>
                  <ElectricBorder style={{ borderRadius: 8 }}>
                    <Button onClick={handleTreasuryUpdate} disabled={isUpdatingTreasury} className="w-full btn-gradient">
                      {isUpdatingTreasury ? 'Updating...' : 'Update Treasury'}
                    </Button>
                  </ElectricBorder>
                </div>
              </div>
            </Card>
          </ElectricBorder>
        </motion.div>

        {/* Plans Table */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <ElectricBorder style={{ borderRadius: 16 }}>
            <Card className="card-gradient p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Subscription Plans</h2>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-neon-cyan/30 text-neon-cyan">
                    {plans.length} Total Plans
                  </Badge>
                  {ownerAddress && (
                    <Badge variant="outline" className="border-neon-purple/30 text-neon-purple">
                      Owner: {ownerAddress.substring(0, 6)}...{ownerAddress.substring(ownerAddress.length - 4)}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.map((plan) => (
                      <motion.tr
                        key={plan.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{plan.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {plan.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {(planOnChainPrice[plan.id] ?? plan.price)} {plan.currency}
                            {planOnChain[plan.id] && planOnChainPrice[plan.id] && planOnChainPrice[plan.id] !== plan.price && (
                              <span className="ml-2 text-xs text-muted-foreground">(on-chain)</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{plan.duration} days</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={plan.isActive}
                              onCheckedChange={() => togglePlanStatus(plan.id, plan.isActive)}
                            />
                            <Badge
                              variant={plan.isActive ? 'default' : 'secondary'}
                              className={plan.isActive ? 'bg-neon-green/20 text-neon-green' : ''}
                            >
                              {plan.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditPlan(plan)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            {isOwner && (
                              <ElectricBorder style={{ borderRadius: 8 }}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => publishPlanOnChain(plan)}
                                >
                                  {planOnChain[plan.id] ? 'Update' : 'Publish'}
                                </Button>
                              </ElectricBorder>
                            )}
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </ElectricBorder>
        </motion.div>
      </div>
    </div>
  );
}