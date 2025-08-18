import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Import Card components
import { ListFilter } from "lucide-react";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [totalListingsCount, setTotalListingsCount] = useState(0); // State for total count

  useEffect(() => {
    const fetchListingsCount = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { count, error: countError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString()); // Only count active listings

      if (countError) {
        console.error("Errore nel conteggio degli annunci:", countError);
      } else if (count !== null) {
        setTotalListingsCount(count); // Set the total active listings count
      }
      setLoading(false);
    };

    fetchListingsCount();
  }, []);

  return (
    <div className="bg-gray-50 p-6 flex-grow">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">La tua Dashboard</h1>
          <Link to="/new-listing">
            <Button className="bg-rose-500 hover:bg-rose-600">Crea nuovo annuncio</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Link to="/my-listings">
              <Card className="w-full transition-shadow hover:shadow-lg cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold flex items-center gap-2">
                    <ListFilter className="h-6 w-6 text-rose-500" />
                    <span>I miei annunci</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <Skeleton className="h-8 w-3/4" />
                  ) : (
                    <p className="text-gray-600 text-xl">
                      Annunci attivi: <span className="font-bold text-rose-500">{totalListingsCount}</span>
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Portafoglio crediti</h2>
              <p className="text-gray-600 mb-4">Crediti disponibili: 0</p>
              <Link to="/buy-credits" className="w-full">
                <Button className="w-full bg-rose-500 hover:bg-rose-600">Acquista crediti</Button>
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Impostazioni account</h2>
              <Link to="/profile-settings" className="w-full">
                <Button className="w-full bg-rose-500 hover:bg-rose-600">Modifica profilo</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;