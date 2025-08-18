import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import NewListing from "./pages/NewListing";
import BuyCredits from "./pages/BuyCredits";
import ProfileSettings from "./pages/ProfileSettings";
import Layout from "./components/Layout";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-screen">Caricamento...</div>;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<Layout session={session} />}>
              <Route path="/" element={<Index session={session} />} />
              <Route 
                path="/auth" 
                element={!session ? <Auth /> : <Navigate to="/dashboard" />} 
              />
              <Route 
                path="/dashboard" 
                element={session ? <Dashboard /> : <Navigate to="/auth" />} 
              />
              <Route 
                path="/admin" 
                element={session?.user?.email === 'admin@example.com' ? <AdminDashboard /> : <Navigate to="/" />} 
              />
              <Route 
                path="/new-listing" 
                element={session ? <NewListing /> : <Navigate to="/auth" />} 
              />
              <Route 
                path="/buy-credits" 
                element={session ? <BuyCredits /> : <Navigate to="/auth" />} 
              />
              <Route 
                path="/profile-settings" 
                element={session ? <ProfileSettings /> : <Navigate to="/auth" />} 
              />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;