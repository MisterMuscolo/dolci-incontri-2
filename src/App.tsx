import React, { useEffect, useState, lazy, Suspense, startTransition } from "react"; // Import React
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { showError } from "./utils/toast";
import { LoadingScreen } from "./components/LoadingScreen";
import Layout from "./components/Layout";

// Lazy load all page components
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NewListing = lazy(() => import("./pages/NewListing"));
const BuyCredits = lazy(() => import("./pages/BuyCredits"));
const ProfileSettings = lazy(() => import("./pages/ProfileSettings"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const ListingDetails = lazy(() => import("./pages/ListingDetails"));
const MyListings = lazy(() => import("./pages/MyListings"));
const CreditHistory = lazy(() => import("./pages/CreditHistory"));
const UserListingsAdminView = lazy(() => import("./pages/UserListingsAdminView"));
const BannedUser = lazy(() => import("./pages/BannedUser"));
const EditListing = lazy(() => import("./pages/EditListing"));
const Termini = lazy(() => import("./pages/Termini"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NewTicket = lazy(() => import("./pages/NewTicket"));
const PromoteListingOptions = lazy(() => import("./pages/PromoteListingOptions"));
const RegistrationSuccess = lazy(() => import("./pages/RegistrationSuccess"));
const ChangePassword = lazy(() => import("./pages/ChangePassword")); // Percorso corretto
const MyTickets = lazy(() => import("./pages/MyTickets"));
const TicketDetails = lazy(() => import("./pages/TicketDetails"));

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCollaborator, setIsCollaborator] = useState(false); // Nuovo stato
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    const handleAuthAndRoleUpdate = async (currentSession: any | null) => {
      let newIsAdmin = false;
      let newIsCollaborator = false; // Nuovo stato
      let newIsBanned = false;

      if (currentSession) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentSession.user.id)
            .single();

          if (profile) {
            newIsAdmin = profile.role === 'admin';
            newIsCollaborator = profile.role === 'collaborator'; // Imposta il nuovo stato
            newIsBanned = profile.role === 'banned';
          } else if (error) {
            console.error("App.tsx: Error fetching profile:", error);
            showError("Errore nel recupero del ruolo utente.");
          }
        } catch (err: any) {
          console.error("App.tsx: Unexpected error in fetchUserRole:", err);
          showError("Errore inatteso nel recupero del ruolo utente.");
        }
      }

      // All state updates that might cause a suspension should be inside startTransition
      startTransition(() => {
        setSession(currentSession);
        setIsAdmin(newIsAdmin);
        setIsCollaborator(newIsCollaborator); // Imposta il nuovo stato
        setIsBanned(newIsBanned);
        setLoading(false); // Set loading to false after all data is processed
      });
    };

    // Initial session fetch
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      handleAuthAndRoleUpdate(initialSession);
    }).catch((err) => {
      console.error("App.tsx: Error fetching initial session:", err);
      showError("Errore inatteso durante il caricamento iniziale.");
      startTransition(() => {
        setSession(null);
        setIsAdmin(false);
        setIsCollaborator(false); // Imposta il nuovo stato
        setIsBanned(false);
        setLoading(false);
      });
    });

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log("App.tsx: Auth state changed. Event:", _event, "New Session:", newSession);
      setLoading(true); // Set loading true synchronously when auth state changes
      handleAuthAndRoleUpdate(newSession);
    });

    return () => subscription.unsubscribe();
  }, []); // Empty dependency array as this effect only runs once for setup

  if (loading) {
    console.log("App.tsx: Displaying loading screen.");
    return <LoadingScreen />;
  }

  console.log("App.tsx: Rendering Layout with isAdmin:", isAdmin, "isCollaborator:", isCollaborator, "isBanned:", isBanned, "Session exists:", !!session);

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

            <Route element={<Layout session={session} isAdmin={isAdmin} isCollaborator={isCollaborator} />}>
              <Route 
                path="/" 
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <Index session={session} />
                  </Suspense>
                } 
              />
              <Route 
                path="/search" 
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <SearchResults />
                  </Suspense>
                } 
              />
              <Route 
                path="/listing/:id" 
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <ListingDetails />
                  </Suspense>
                } 
              />
              <Route 
                path="/termini" 
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <Termini />
                  </Suspense>
                } 
              />
              <Route 
                path="/privacy" 
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <Privacy />
                  </Suspense>
                } 
              />
              <Route 
                path="/new-ticket" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <Suspense fallback={<LoadingScreen />}><NewTicket /></Suspense>) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/my-tickets" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <Suspense fallback={<LoadingScreen />}><MyTickets /></Suspense>) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/my-tickets/:ticketId" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <Suspense fallback={<LoadingScreen />}><TicketDetails /></Suspense>) : <Navigate to="/auth" />} 
              />
              
              {/* Reindirizza gli utenti in base allo stato di autenticazione e al ruolo */}
              <Route 
                path="/auth" 
                element={
                  !session ? (
                    <Suspense fallback={<LoadingScreen />}>
                      <Auth />
                    </Suspense>
                  ) : isBanned ? (
                    <Navigate to="/banned" />
                  ) : (isAdmin || isCollaborator) ? ( // Reindirizza admin/collaborator alla dashboard admin
                    <Navigate to="/admin" />
                  ) : (
                    <Navigate to="/dashboard" />
                  )
                } 
              />
              <Route 
                path="/dashboard" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <Suspense fallback={<LoadingScreen />}><Dashboard /></Suspense>) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/admin" 
                element={(isAdmin || isCollaborator) ? <Suspense fallback={<LoadingScreen />}><AdminDashboard isAdmin={isAdmin} isCollaborator={isCollaborator} /></Suspense> : <Navigate to="/" />} 
              />
              <Route 
                path="/admin/users/:userId/listings" 
                element={(isAdmin || isCollaborator) ? <Suspense fallback={<LoadingScreen />}><UserListingsAdminView /></Suspense> : <Navigate to="/" />} 
              />
              <Route 
                path="/new-listing" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <Suspense fallback={<LoadingScreen />}><NewListing /></Suspense>) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/edit-listing/:id" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <Suspense fallback={<LoadingScreen />}><EditListing /></Suspense>) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/promote-listing/:listingId" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <Suspense fallback={<LoadingScreen />}><PromoteListingOptions /></Suspense>) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/buy-credits" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <Suspense fallback={<LoadingScreen />}><BuyCredits /></Suspense>) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/profile-settings" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <Suspense fallback={<LoadingScreen />}><ProfileSettings /></Suspense>) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/change-password" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <Suspense fallback={<LoadingScreen />}><ChangePassword /></Suspense>) : <Navigate to="/auth" />} 
              />
            </Route> {/* Chiusura della rotta del Layout */}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;