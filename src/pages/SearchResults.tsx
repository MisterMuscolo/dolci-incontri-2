import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ListingListItem, Listing } from '@/components/ListingListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const LISTINGS_PER_PAGE = 10;

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

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
          created_at,
          expires_at,
          listing_photos ( url, is_primary )
        `, { count: 'exact' })
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

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
        console.error("Errore nella ricerca degli annunci:", error);
        setError("Si è verificato un errore durante la ricerca. Riprova più tardi.");
      } else {
        if (count) {
          setTotalPages(Math.ceil(count / LISTINGS_PER_PAGE));
        }
        if (data) {
          setListings(data as Listing[]);
        }
      }
      setLoading(false);
    };

    fetchListings();
  }, [category, city, keyword, currentPage]);

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
        <h1 className="text-3xl font-bold mb-6">Risultati della ricerca</h1>
        {renderContent()}
      </div>
    </div>
  );
};

export default SearchResults;