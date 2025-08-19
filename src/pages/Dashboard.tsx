import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, Settings, LayoutGrid } from "lucide-react";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [totalListingsCount, setTotalListingsCount] = useState(0);
  const [currentCredits, setCurrentCredits] = useState<number | null>(0);
  const [totalCreditsSpent, setTotalCreditsSpent] = useState<number>(0); // Nuovo stato per i crediti utilizzati

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch listings count
      const { count: listingsCount, error: countError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString());

      if (countError) {
        console.error("Errore nel conteggio degli annunci:", countError);
      } else if (listingsCount !== null) {
        setTotalListingsCount(listingsCount);
      }

      // Fetch current credits from profiles table
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Errore nel recupero dei crediti:", profileError);
        setCurrentCredits(0);
      } else if (profileData) {
        setCurrentCredits(profileData.credits);
      }

      // Fetch credit transactions to calculate total spent
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('amount')
        .eq('user_id', user.id);

      if (transactionsError) {
        console.error("Errore nel recupero delle transazioni per i crediti utilizzati:", transactionsError);
        setTotalCreditsSpent(0);
      } else if (transactionsData) {
        const spent = transactionsData
          .filter(t => t.amount < 0) // Solo transazioni negative (spese)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0); // Somma i valori assoluti
        setTotalCreditsSpent(spent);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="bg-gray-50 p-6 flex-grow">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">La Mia Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">Gestisci i tuoi annunci, crediti e impostazioni del tuo account.</p>
          </div>
          <Link to="/new-listing">
            <Button className="bg-rose-500 hover:bg-rose-600">Crea nuovo annuncio</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Link to="/my-listings">
              <Card className="w-full transition-shadow hover:shadow-lg cursor-pointer bg-white hover:bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                    <LayoutGrid className="h-6 w-6 text-rose-500" />
                    <span className="text-gray-800">I Miei Annunci</span>
                  </CardTitle>
                  <CardDescription>Visualizza e gestisci i tuoi annunci.</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-3/4" />
                  ) : (
                    <p className="text-gray-600 text-xl">
                      Hai <span className="font-bold text-rose-500">{totalListingsCount}</span> annunci attivi
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="space-y-6">
            <Card className="w-full transition-shadow hover:shadow-lg bg-white hover:bg-gray-50">
              <CardHeader>
                <Link to="/credit-history" className="block">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 cursor-pointer">
                    <Wallet className="h-5 w-5 text-rose-500" />
                    <span>Crediti</span> {/* Modificato il titolo */}
                  </CardTitle>
                </Link>
                <CardDescription>Acquista e gestisci i tuoi crediti.</CardDescription> {/* Nuova descrizione */}
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-gray-600 text-lg">
                      Disponibili: <span className="font-bold text-rose-500">{currentCredits !== null ? currentCredits : 0}</span>
                    </p>
                    <p className="text-gray-600 text-lg">
                      Utilizzati: <span className="font-bold text-gray-800">{totalCreditsSpent}</span>
                    </p>
                  </div>
                )}
                <Link to="/buy-credits">
                  <Button className="bg-rose-500 hover:bg-rose-600 mt-4">Acquista crediti</Button>
                </Link>
              </CardContent>
            </Card>
            
            <Card className="w-full transition-shadow hover:shadow-lg bg-white hover:bg-gray-50">
              <CardHeader>
                <Link to="/profile-settings" className="block">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 cursor-pointer">
                    <Settings className="h-5 w-5 text-rose-500" />
                    <span>Impostazioni account</span>
                  </CardTitle>
                </Link>
              </CardHeader>
              <CardContent>
                {/* Il pulsante "Modifica profilo" è stato rimosso in quanto il titolo della card è già cliccabile */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;