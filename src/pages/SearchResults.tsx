import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ListingCard, Listing } from '@/components/ListingCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const category = searchParams.get('category');
  const city = searchParams.get('city');
  const keyword = searchParams.get('keyword');

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('listings')
        .select(`
          id,
          title,
          category,
          city,
          description,
          listing_photos ( url, is_primary )
        `)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }
      if (city) {
        query = query.eq('city', city);
      }
      if (keyword) {
        query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Errore nella ricerca degli annunci:", error);
        setError("Si è verificato un errore durante la ricerca. Riprova più tardi.");
      } else if (data) {
        setListings(data as Listing[]);
      }
      setLoading(false);
    };

    fetchListings();
  }, [category, city, keyword]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-red-500">{error}</p>;
    }

    if (listings.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-lg">Nessun annuncio trovato per la tua ricerca.</p>
          <Link to="/" className="mt-4 inline-block">
            <Button>Torna alla Home</Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing) => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 p-6 flex-grow">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Risultati della ricerca</h1>
        {renderContent()}
      </div>
    </div>
  );
};

export default SearchResults;