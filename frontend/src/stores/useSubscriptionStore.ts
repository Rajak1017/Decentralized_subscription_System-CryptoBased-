import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  duration: number; // in days
  features: string[];
  isActive: boolean;
  currency: 'MATIC' | 'USDC' | 'ETH';
}

export interface UserSubscription {
  id: string;
  planId: string;
  planName: string;
  startDate: Date;
  endDate: Date;
  status: 'active' | 'expired' | 'cancelled';
  txHash: string;
  price: string;
  currency: string;
}

interface SubscriptionState {
  plans: Plan[];
  userSubscriptions: UserSubscription[];
  
  // Actions
  setPlans: (plans: Plan[]) => void;
  updatePlan: (planId: string, updates: Partial<Plan>) => void;
  addPlan: (plan: Plan) => void;
  setUserSubscriptions: (subscriptions: UserSubscription[]) => void;
  addUserSubscription: (subscription: UserSubscription) => void;
  cancelUserSubscription: (subscriptionId: string) => void;
}

export const useSubscriptionStore = create<SubscriptionState>()(
  devtools(
    persist(
      (set) => ({
        plans: [
          {
            id: '0', // Updated to match on-chain plan ID
            name: 'Starter',
            description: 'Perfect for individuals getting started with DeFi',
            price: '10', // Updated to match on-chain price
            duration: 30,
            currency: 'ETH', // Updated to ETH for Sepolia
            features: [
              'Basic portfolio tracking',
              'Price alerts',
              'Community access',
              'Mobile app'
            ],
            isActive: true,
          },
          {
            id: '1', // Updated to match on-chain plan ID
            name: 'Professional',
            description: 'Advanced tools for serious DeFi traders',
            price: '50', // Updated to match on-chain price
            duration: 30,
            currency: 'ETH', // Updated to ETH for Sepolia
            features: [
              'Advanced analytics',
              'Portfolio optimization',
              'Premium indicators',
              'API access',
              'Priority support'
            ],
            isActive: true,
          },
          {
            id: '2', // Updated to match on-chain plan ID
            name: 'Enterprise',
            description: 'Complete solution for institutions and power users',
            price: '0.1', // Updated to match on-chain price
            duration: 90,
            currency: 'ETH',
            features: [
              'White-label solution',
              'Dedicated account manager',
              'Custom integrations',
              'Advanced reporting',
              'SLA guarantee'
            ],
            isActive: true,
          },
          {
            id: '3',
            name: 'Basic',
            description: 'Essential features for beginners',
            price: '0.01',
            duration: 7,
            currency: 'ETH',
            features: [
              'Basic portfolio view',
              'Price tracking',
              'Email support'
            ],
            isActive: true,
          },
          {
            id: '4',
            name: 'Premium',
            description: 'Advanced features for active traders',
            price: '0.05',
            duration: 30,
            currency: 'ETH',
            features: [
              'Advanced charts',
              'Real-time alerts',
              'Portfolio analytics',
              'API access',
              'Priority support'
            ],
            isActive: true,
          },
          {
            id: '5',
            name: 'Ultimate',
            description: 'Maximum features for power users',
            price: '0.2',
            duration: 60,
            currency: 'ETH',
            features: [
              'All Premium features',
              'Custom indicators',
              'Advanced backtesting',
              'White-label options',
              'Dedicated support',
              'Custom integrations'
            ],
            isActive: true,
          },
        ],
        userSubscriptions: [],
        
        setPlans: (plans) => set({ plans }),
        
        updatePlan: (planId, updates) => set((state) => ({
          plans: state.plans.map((plan) =>
            plan.id === planId ? { ...plan, ...updates } : plan
          ),
        })),
        
        addPlan: (plan) => set((state) => ({
          plans: [...state.plans, plan],
        })),
        
        setUserSubscriptions: (subscriptions) => set({
          userSubscriptions: subscriptions,
        }),
        
        addUserSubscription: (subscription) => set((state) => ({
          userSubscriptions: [...state.userSubscriptions, subscription],
        })),
        
        cancelUserSubscription: (subscriptionId) => set((state) => ({
          userSubscriptions: state.userSubscriptions.map((sub) =>
            sub.id === subscriptionId ? { ...sub, status: 'cancelled' as const } : sub
          ),
        })),
      }),
      { name: 'subscription-store' }
    ),
    { name: 'subscription-store' }
  )
);