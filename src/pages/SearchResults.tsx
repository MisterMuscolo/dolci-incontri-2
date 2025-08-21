import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom'; // Importa useNavigate
import { supabase } from '@/integrations/supabase/client';
import { ListingListItem, Listing } from '@/components/ListingListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ChevronLeft } from 'lucide-react'; // Importa l'icona

const LISTINGS_PER_PAGE = 10;

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate(); // Inizializza useNavigate
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const category = searchParams.get('category');
  const city = searchParams.get('city');
  const keyword = searchParams.get('keyword');

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    let query = supabase
      .from('listings')
      .select(`
        id,
        title,
        category,
        city,
        zone,
        description,
        created_at,
        expires_at,
        is_premium,
        age,
        promotion_mode,
        promotion_start_at,
        promotion_end_at,
        last_bumped_at,
        listing_photos ( url, is_primary )
      `, { count: 'exact' })
      .gt('expires_at', new Date().toISOString()); // Questo filtro è gestito dalla RLS policy "Active listings are visible to all"

    if (category && category !== 'tutte') {
      query = query.eq('category', category);
    }
    if (city && city !== 'tutte') {
      query = query.eq('city', city);
    }
    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    const from = (currentPage - 1) * LISTINGS_PER_PAGE;
    const to = from + LISTINGS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("SearchResults: Errore nella ricerca degli annunci:", error.message, error.details);
      setError("Si è verificato un errore durante la ricerca. Riprova più tardi.");
    } else {
      if (count) {
        setTotalPages(Math.ceil(count / LISTINGS_PER_PAGE));
        console.log("SearchResults: Conteggio annunci trovati:", count, "Pagine totali:", totalPages);
      }
      if (data) {
        console.log("SearchResults: Dati ricevuti:", data);
        // Client-side sorting for active premium listings
        const now = new Date();
        const sortedData = (data as Listing[]).sort((a, b) => {
          const aIsActivePremium = a.is_premium && a.promotion_start_at && a.promotion_end_at && new Date(a.promotion_start_at) <= now && new Date(a.promotion_end_at) >= now;
          const bIsActivePremium = b.is_premium && b.promotion_start_at && b.promotion_end_at && new Date(b.promotion_end_at) >= now;

          // Prioritize active premium listings
          if (aIsActivePremium && !bIsActivePremium) return -1;
          if (!aIsActivePremium && bIsActivePremium) return 1;

          // If both are active premium or both are not, then sort by last_bumped_at (desc)
          // Use created_at as fallback for last_bumped_at if it's null
          const aBumpedAt = a.last_bumped_at ? new Date(a.last_bumped_at).getTime() : new Date(a.created_at).getTime();
          const bBumpedAt = b.last_bumped_at ? new Date(b.last_bumped_at).getTime() : new Date(b.created_at).getTime();
          if (aBumpedAt !== bBumpedAt) {
              return bBumpedAt - aBumpedAt; // Descending
          }

          // Fallback to created_at (desc) if all else is equal
          const aCreatedAt = new Date(a.created_at).getTime();
          const bCreatedAt = new Date(b.created_at).getTime();
          return bCreatedAt - aCreatedAt;
        });
        setListings(sortedData);
      }
    }
    setLoading(false);
  }, [category, city, keyword, currentPage]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
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
      <div className="space-y-4">
        {listings.map((listing) => (
          <ListingListItem key={listing.id} listing={listing} showExpiryDate={false} />
        ))}
        {totalPages > 1 && (
          <Pagination className="pt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage - 1); }} />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink href="#" isActive={currentPage === i + 1} onClick={(e) => { e.preventDefault(); handlePageChange(i + 1); }}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext href="#" onClick={(e) => { e.preventDefault(); handlePageChange(currentPage + 1); }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-50 p-6 flex-grow">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6"> {/* Aggiunto il div per il pulsante Indietro */}
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
          </Button>
          <h1 className="text-3xl font-bold">Risultati della ricerca</h1>
        </div>
        {renderContent()}
      </div>
    </div>
  );
};

export default SearchResults;