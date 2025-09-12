import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Header } from "./components/header";
import { NotificationBanner } from "./components/ui/notification-banner";
import Home from "./pages/Home";
import Plans from "./pages/Plans";
import Subscriptions from "./pages/Subscriptions";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Watch from "./pages/Watch";
import { useEffect } from "react";
import { useSubscriptionStore } from "./stores/useSubscriptionStore";
import { useWalletStore } from "./stores/useWalletStore";
import { fetchPlans, getCurrentWallet } from "./lib/api";
import { Navigate } from "react-router-dom";

// Debug environment variables
console.log('=== ENVIRONMENT DEBUG ===');
console.log('VITE_SUBSCRIPTION_CONTRACT_ADDRESS:', import.meta.env.VITE_SUBSCRIPTION_CONTRACT_ADDRESS);
console.log('VITE_CHAIN_ID:', import.meta.env.VITE_CHAIN_ID);
console.log('VITE_NETWORK_NAME:', import.meta.env.VITE_NETWORK_NAME);
console.log('All env vars:', import.meta.env);
console.log('========================');
// Expose env to DevTools for debugging
;(window as any).__ENV__ = import.meta.env;

const queryClient = new QueryClient();

const BootstrapData = () => {
  const setPlans = useSubscriptionStore((s) => s.setPlans);
  const setUserSubscriptions = useSubscriptionStore((s) => s.setUserSubscriptions);
  const address = useWalletStore((s) => s.address);
  const setWalletData = useWalletStore((s) => s.setWalletData);

  useEffect(() => {
    fetchPlans().then((plans) => setPlans(plans as any));
  }, [setPlans]);

  useEffect(() => {
    if (address) {
      // fetch role and update wallet data with admin status
      getCurrentWallet(address).then((w) => {
        console.log('Admin check result:', w);
        setWalletData({ 
          address, 
          chainId: useWalletStore.getState().chainId ?? 0, 
          balance: useWalletStore.getState().balance ?? '0',
          isAdmin: w.isAdmin 
        });
      }).catch((err) => {
        console.error('Admin check failed:', err);
      });
      // Subscriptions are now loaded in the Subscriptions component
    }
  }, [address, setWalletData]);

  return null;
};

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const isConnected = useWalletStore((s) => s.isConnected);
  const isAdmin = useWalletStore((s) => s.isAdmin);
  const address = useWalletStore((s) => s.address);
  
  console.log('AdminRoute check:', { isConnected, isAdmin, address });
  
  // Show loading state while checking admin status
  if (isConnected && address && isAdmin === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking admin permissions...</p>
        </div>
      </div>
    );
  }
  
  if (!isConnected || !address || !isAdmin) {
    console.log('Admin access denied:', { isConnected, address, isAdmin });
    return <Navigate to="/" replace />;
  }
  
  console.log('Admin access granted');
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NotificationBanner />
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Header />
            <BootstrapData />
            <main>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/plans" element={<Plans />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/watch/:planId" element={<Watch />} />
                <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;