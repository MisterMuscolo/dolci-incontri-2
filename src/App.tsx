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
import UserListingsAdminView from "./pages/UserListingsAdminView";
import BannedUser from "./pages/BannedUser";
import EditListing from "./pages/EditListing";
import Termini from "./pages/Termini"; 
import Privacy from "./pages/Privacy"; 
import Contatti from "./pages/Contatti";
import PromoteListingOptions from "./pages/PromoteListingOptions";
import RegistrationSuccess from "./pages/RegistrationSuccess";
import ChangePassword from "./pages/ChangePassword"; // Importa la nuova pagina

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    const getSessionAndRole = async () => {
      console.log("App.tsx: Fetching session and role...");
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      if (session) {
        console.log("App.tsx: Session found for user:", session.user.email);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          console.log("App.tsx: Profile role fetched:", profile.role);
          if (profile.role === 'admin') {
            setIsAdmin(true);
            setIsBanned(false);
            console.log("App.tsx: isAdmin set to TRUE");
          } else if (profile.role === 'banned') {
            setIsBanned(true);
            setIsAdmin(false);
            console.log("App.tsx: isBanned set to TRUE");
          } else {
            setIsAdmin(false);
            setIsBanned(false);
            console.log("App.tsx: isAdmin/isBanned set to FALSE (role was:", profile.role, ")");
          }
        } else if (error) {
          console.error("App.tsx: Error fetching profile:", error);
          setIsAdmin(false);
          setIsBanned(false);
        } else {
          console.log("App.tsx: No profile found for user, isAdmin/isBanned set to FALSE");
          setIsAdmin(false);
          setIsBanned(false);
        }
      } else {
        console.log("App.tsx: No session found, isAdmin/isBanned set to FALSE");
        setIsAdmin(false);
        setIsBanned(false);
      }
      setLoading(false);
    };

    getSessionAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("App.tsx: Auth state changed. Event:", _event, "Session:", session);
      setSession(session);
      if (session) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (profile) {
              console.log("App.tsx: Auth state change: Profile role fetched:", profile.role);
              if (profile.role === 'admin') {
                setIsAdmin(true);
                setIsBanned(false);
                console.log("App.tsx: Auth state change: isAdmin set to TRUE");
              } else if (profile.role === 'banned') {
                setIsBanned(true);
                setIsAdmin(false);
                console.log("App.tsx: Auth state change: isBanned set to TRUE");
              } else {
                setIsAdmin(false);
                setIsBanned(false);
                console.log("App.tsx: Auth state change: isAdmin/isBanned set to FALSE (role was:", profile.role, ")");
              }
            } else if (error) {
              console.error("App.tsx: Auth state change: Error fetching profile:", error);
              setIsAdmin(false);
              setIsBanned(false);
            } else {
              console.log("App.tsx: Auth state change: No profile found, isAdmin/isBanned set to FALSE");
              setIsAdmin(false);
              setIsBanned(false);
            }
          });
      } else {
        console.log("App.tsx: Auth state change: No session, isAdmin/isBanned set to FALSE");
        setIsAdmin(false);
        setIsBanned(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-screen">Caricamento...</div>;

  console.log("App.tsx: Rendering Layout with isAdmin:", isAdmin, "isBanned:", isBanned);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Route per utenti bannati */}
            <Route path="/banned" element={<BannedUser />} />
            {/* Nuova rotta per la conferma registrazione */}
            <Route path="/registration-success" element={<RegistrationSuccess />} />

            <Route element={<Layout session={session} isAdmin={isAdmin} />}>
              <Route path="/" element={<Index session={session} />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/listing/:id" element={<ListingDetails />} />
              <Route path="/termini" element={<Termini />} /> 
              <Route path="/privacy" element={<Privacy />} /> 
              <Route path="/contatti" element={<Contatti />} />
              
              {/* Reindirizza gli utenti bannati alla pagina /banned */}
              <Route 
                path="/auth" 
                element={!session ? <Auth /> : (isBanned ? <Navigate to="/banned" /> : <Navigate to="/dashboard" />)} 
              />
              <Route 
                path="/dashboard" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <Dashboard />) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/admin" 
                element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />} 
              />
              <Route 
                path="/admin/users/:userId/listings" 
                element={isAdmin ? <UserListingsAdminView /> : <Navigate to="/" />} 
              />
              <Route 
                path="/new-listing" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <NewListing />) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/edit-listing/:id" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <EditListing />) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/promote-listing/:listingId" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <PromoteListingOptions />) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/buy-credits" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <BuyCredits />) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/profile-settings" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <ProfileSettings />) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/change-password" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <ChangePassword />) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/my-listings" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <MyListings />) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/credit-history" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <CreditHistory />) : <Navigate to="/auth" />} 
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