import { useEffect, useState, lazy, Suspense, startTransition } from "react"; // Import React
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
import MyListings from "./pages/MyListings"; // MyListings rimane importato direttamente
import CreditHistory from "./pages/CreditHistory"; // CreditHistory rimane importato direttamente
import MyTickets from "./pages/MyTickets"; // Importa MyTickets direttamente
const UserListingsAdminView = lazy(() => import("./pages/UserListingsAdminView"));
const BannedUser = lazy(() => import("./pages/BannedUser"));
const EditListing = lazy(() => import("./pages/EditListing"));
const Termini = lazy(() => import("./pages/Termini"));
const Privacy = lazy(() => import("./pages/Privacy"));
const NewTicket = lazy(() => import("./pages/NewTicket"));
const PromoteListingOptions = lazy(() => import("./pages/PromoteListingOptions"));
const RegistrationSuccess = lazy(() => import("./pages/RegistrationSuccess"));
const ChangePassword = lazy(() => import("./pages/ChangePassword")); // Percorso corretto
const TicketDetails = lazy(() => import("./pages/TicketDetails"));
const AuthCallback = lazy(() => import("./pages/AuthCallback")); // Importa la nuova pagina AuthCallback

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSupporto, setIsSupporto] = useState(false); // Rinomina da isCollaborator a isSupporto
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    const handleAuthAndRoleUpdate = async (currentSession: any | null) => {
      let newIsAdmin = false;
      let newIsSupporto = false; // Rinomina da newIsCollaborator a newIsSupporto
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
            newIsSupporto = profile.role === 'supporto'; // Aggiorna il controllo del ruolo
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
        setIsSupporto(newIsSupporto); // Aggiorna lo stato
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
        setIsSupporto(false); // Aggiorna lo stato
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

  console.log("App.tsx: Rendering Layout with isAdmin:", isAdmin, "isSupporto:", isSupporto, "isBanned:", isBanned, "Session exists:", !!session);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Nuova rotta per il callback di autenticazione di Supabase */}
            <Route 
              path="/auth/callback" 
              element={
                <Suspense fallback={<LoadingScreen />}>
                  <AuthCallback />
                </Suspense>
              } 
            />

            {/* Route per utenti bannati */}
            <Route path="/banned" element={<BannedUser />} />
            {/* Nuova rotta per la conferma registrazione */}
            <Route path="/registration-success" element={<RegistrationSuccess />} />

            <Route element={<Layout session={session} isAdmin={isAdmin} isSupporto={isSupporto} />}>
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
                element={session ? <MyTickets /> : <Navigate to="/auth" />} 
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
                  ) : (isAdmin || isSupporto) ? ( // Aggiorna il controllo del ruolo
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
                element={(isAdmin || isSupporto) ? <Suspense fallback={<LoadingScreen />}><AdminDashboard isAdmin={isAdmin} isSupporto={isSupporto} /></Suspense> : <Navigate to="/" />} 
              />
              <Route 
                path="/admin/users/:userId/listings" 
                element={(isAdmin || isSupporto) ? <Suspense fallback={<LoadingScreen />}><UserListingsAdminView /></Suspense> : <Navigate to="/" />} 
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
              <Route 
                path="/my-listings" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <MyListings />) : <Navigate to="/auth" />} 
              />
              <Route 
                path="/credit-history" 
                element={session ? (isBanned ? <Navigate to="/banned" /> : <Suspense fallback={<LoadingScreen />}><CreditHistory /></Suspense>) : <Navigate to="/auth" />} 
              />
            </Route> {/* Chiusura della rotta del Layout */}
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;