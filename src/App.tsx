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
import SearchResults from "./pages/SearchResults";
import ListingDetails from "./pages/ListingDetails";
import MyListings from "./pages/MyListings";
import CreditHistory from "./pages/CreditHistory";

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const getSessionAndRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile && profile.role === 'admin') {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };

    getSessionAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        // Re-fetch role on auth state change to ensure it's up-to-date
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (profile && profile.role === 'admin') {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          });
      } else {
        setIsAdmin(false);
      }
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
              <Route path="/search" element={<SearchResults />} />
              <Route path="/listing/:id" element={<ListingDetails />} />
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
                element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} 
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
              <Route 
                path="/my-listings" 
                element={session ? <MyListings /> : <Navigate to="/auth" />} 
              />
              <Route 
                path="/credit-history" 
                element={session ? <CreditHistory /> : <Navigate to="/auth" />} 
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