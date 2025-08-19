import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Importa CardDescription
import { Wallet, Settings, LayoutGrid } from "lucide-react"; // Importa LayoutGrid

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [totalListingsCount, setTotalListingsCount] = useState(0);
  const [currentCredits, setCurrentCredits] = useState<number | null>(0); // Initialize with 0

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
        setCurrentCredits(0); // Ensure it's 0 on error
      } else if (profileData) {
        setCurrentCredits(profileData.credits);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  return (
    <div className="bg-gray-50 p-6 flex-grow">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4"> {/* Ridotto mb per fare spazio al sottotitolo */}
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
                    <LayoutGrid className="h-6 w-6 text-rose-500" /> {/* Nuova icona */}
                    <span className="text-gray-800">I Miei Annunci</span> {/* Nuovo testo */}
                  </CardTitle>
                  <CardDescription>Visualizza e gestisci i tuoi annunci.</CardDescription> {/* Nuovo sottotitolo */}
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
                    <span>Portafoglio crediti</span>
                  </CardTitle>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-gray-600 text-xl">
                    Crediti disponibili: <span className="font-bold text-rose-500">{currentCredits !== null ? currentCredits : 0}</span>
                  </p>
                  <Link to="/buy-credits">
                    <Button className="bg-rose-500 hover:bg-rose-600">Acquista crediti</Button>
                  </Link>
                </div>
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