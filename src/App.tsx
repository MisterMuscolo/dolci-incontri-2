import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense, startTransition } from "react"; // Import lazy, Suspense, and startTransition
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
const ChangePassword = lazy(() => import("./pages/ChangePassword"));
const MyTickets = lazy(() => import("./pages/MyTickets"));
const TicketDetails = lazy(() => import("./pages/TicketDetails"));

const queryClient = new QueryClient();

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isBanned, setIsBanned] = useState(false);

  useEffect(() => {
    const getInitialSessionAndRole = async () => {
      setLoading(true); // Keep this synchronous to show loading immediately
      
      // Wrap all subsequent state updates in a single transition
      startTransition(async () => {
        try {
          const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
          
          setSession(initialSession); // Update session
          
          if (initialSession) {
            // Fetch user role and update isAdmin/isBanned
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', initialSession.user.id)
              .single();

            if (profile) {
              setIsAdmin(profile.role === 'admin');
              setIsBanned(profile.role === 'banned');
            } else if (profileError) {
              console.error("App.tsx: Error fetching profile:", profileError);
              showError("Errore nel recupero del ruolo utente.");
              setIsAdmin(false);
              setIsBanned(false);
            } else {
              setIsAdmin(false);
              setIsBanned(false);
            }
          } else {
            setIsAdmin(false);
            setIsBanned(false);
          }
        } catch (err: any) {
          console.error("App.tsx: Unexpected error during initial session fetch:", err);
          showError("Errore inatteso durante il caricamento iniziale.");
          setSession(null);
          setIsAdmin(false);
          setIsBanned(false);
        } finally {
          setLoading(false); // Set loading to false at the very end of the transition
        }
      });
    };

    getInitialSessionAndRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setLoading(true); // Keep this synchronous
      
      startTransition(async () => {
        setSession(newSession);
        try {
          if (newSession) {
            // Fetch user role and update isAdmin/isBanned
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', newSession.user.id)
              .single();

            if (profile) {
              setIsAdmin(profile.role === 'admin');
              setIsBanned(profile.role === 'banned');
            } else if (profileError) {
              console.error("App.tsx: Error fetching profile:", profileError);
              showError("Errore nel recupero del ruolo utente.");
              setIsAdmin(false);
              setIsBanned(false);
            } else {
              setIsAdmin(false);
              setIsBanned(false);
            }
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