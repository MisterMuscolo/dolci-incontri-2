import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react"; // Import lazy and Suspense
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
const Contatti = lazy(() => import("./pages/Contatti")); // Ora è la pagina per creare un nuovo ticket
const PromoteListingOptions = lazy(() => import("./pages/PromoteListingOptions"));
const RegistrationSuccess = lazy(() => import("./pages/RegistrationSuccess"));
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const MyTickets = lazy(() => import("./pages/MyTickets")); // Nuova pagina
const TicketDetails = lazy(() => import("./pages/TicketDetails")); // Nuova pagina

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);

  // Function to fetch user role
  const fetchUserRole = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
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
        showError("Errore nel recupero del ruolo utente.");
      } else {
        console.log("App.tsx: No profile found for user, isAdmin/isBanned set to FALSE");
        setIsAdmin(false);
        setIsBanned(false);
      }
    } catch (err: any) {
      console.error("App.tsx: Unexpected error in fetchUserRole:", err);
      setIsAdmin(false);
      setIsBanned(false);
      showError("Errore inatteso nel recupero del ruolo utente.");
    }
  };

  useEffect(() => {
    const getInitialSessionAndRole = async () => {
      console.log("App.tsx: Fetching initial session and role...");
      setLoading(true);
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("App.tsx: Error getting initial session:", sessionError);
          showError("Errore nel recupero della sessione utente.");
          setSession(null);
          setIsAdmin(false);
          setIsBanned(false);
        } else {
          setSession(initialSession);
          if (initialSession) {
            await fetchUserRole(initialSession.user.id);
          } else {
            setIsAdmin(false);
            setIsBanned(false);
          }
        }
      } catch (err: any) {
        console.error("App.tsx: Unexpected error during initial session fetch:", err);
        showError("Errore inatteso durante il caricamento iniziale.");
        setSession(null);
        setIsAdmin(false);
        setIsBanned(false);
      } finally {
        setLoading(false);
      }
    };

    getInitialSessionAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log("App.tsx: Auth state changed. Event:", _event, "New Session:", newSession);
      setSession(newSession);
      setLoading(true);

      try {
        if (newSession) {
          await fetchUserRole(newSession.user.id);
        } else {
          setIsAdmin(false);
          setIsBanned(false);
        }
      } catch (err: any) {
        console.error("App.tsx: Unexpected error during auth state change:", err);
        showError("Errore inatteso durante il cambio di stato dell'autenticazione.");
        setIsAdmin(false);
        setIsBanned(false);
      } finally {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    console.log("App.tsx: Displaying loading screen.");
    return <LoadingScreen />;
  }

  console.log("App.tsx: Rendering Layout with isAdmin:", isAdmin, "isBanned:", isBanned, "Session exists:", !!session);

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
                path="/contatti" 
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <Contatti /> {/* Ora è la pagina per creare un nuovo ticket */}
                  </Suspense>
                } 
              />
              <Route 
                path="/new-ticket" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <Suspense fallback={<LoadingScreen />}><Contatti /></Suspense>) : <Navigate to="/auth" />} 
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
                  ) : isAdmin ? (
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
                element={isAdmin ? <Suspense fallback={<LoadingScreen />}><AdminDashboard /></Suspense> : <Navigate to="/" />} 
              />
              <Route 
                path="/admin/users/:userId/listings" 
                element={isAdmin ? <Suspense fallback={<LoadingScreen />}><UserListingsAdminView /></Suspense> : <Navigate to="/" />} 
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
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;