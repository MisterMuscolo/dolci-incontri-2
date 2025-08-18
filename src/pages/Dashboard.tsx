import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ListingCard, Listing } from "@/components/ListingCard";
import { Skeleton } from "@/components/ui/skeleton";

const Dashboard = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          category,
          city,
          listing_photos ( url, is_primary )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Errore nel recupero degli annunci:", error);
      } else if (data) {
        setListings(data as Listing[]);
      }
      setLoading(false);
    };

    fetchListings();
  }, []);

  return (
    <div className="bg-gray-50 p-6 flex-grow">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">La tua Dashboard</h1>
          <Link to="/new-listing">
            <Button>Crea nuovo annuncio</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">I tuoi annunci</h2>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : listings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} showControls={true} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-600">Non hai ancora creato nessun annuncio.</p>
                <Link to="/new-listing" className="mt-4 inline-block">
                  <Button>Pubblica il tuo primo annuncio</Button>
                </Link>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Portafoglio crediti</h2>
              <p className="text-gray-600 mb-4">Crediti disponibili: 0</p>
              <Link to="/buy-credits" className="w-full">
                <Button className="w-full">Acquista crediti</Button>
              </Link>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Impostazioni account</h2>
              <Link to="/profile-settings" className="w-full">
                <Button variant="outline" className="w-full">Modifica profilo</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;