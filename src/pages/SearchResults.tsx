import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ListingListItem, Listing } from '@/components/ListingListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ChevronLeft } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const LISTINGS_PER_PAGE = 10;

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
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
        age,
        description,
        created_at,
        expires_at,
        is_premium,
        promotion_mode,
        promotion_start_at,
        promotion_end_at,
        last_bumped_at,
        listing_photos ( url, original_url, is_primary ),
        slug
      `, { count: 'exact' })
      .gt('expires_at', new Date().toISOString());

    if (category && category !== 'tutte') {
      query = query.eq('category', category);
    }
    if (city && city !== 'tutte') {
      query = query.eq('city', city);
    }
    if (keyword) {
      query = query.or(`title.ilike.%${keyword}%,description.ilike.%${keyword}%`);
    }

    query = query
      .order('last_bumped_at', { ascending: false, nullsFirst: false })
      .order('promotion_end_at', { ascending: false, nullsFirst: true })
      .order('created_at', { ascending: false });

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
        const processedListings = data.map(listing => ({
          ...listing,
          listing_photos: (listing.listing_photos || []).sort((a, b) => {
            if (a.is_primary && !b.is_primary) return -1;
            if (!a.is_primary && b.is_primary) return 1;
            return 0;
          })
        }));
        setListings(processedListings as Listing[]);
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

  const generateTitle = () => {
    let titleParts = ["Annunci Incontri"];
    if (category && category !== 'tutte') titleParts.push(category.replace(/-/g, ' '));
    if (city && city !== 'tutte') titleParts.push(`a ${city}`);
    if (keyword) titleParts.push(`"${keyword}"`);
    return `${titleParts.join(' ')} | IncontriDolci`;
  };

  const generateDescription = () => {
    let description = "Cerca annunci di incontri e appuntamenti";
    if (category && category !== 'tutte') description += ` nella categoria "${category.replace(/-/g, ' ')}"`;
    if (city && city !== 'tutte') description += ` nella città di ${city}`;
    if (keyword) description += ` per la parola chiave "${keyword}"`;
    description += ". Trova la tua prossima relazione su IncontriDolci.";
    return description;
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
          <ListingListItem 
            key={listing.id} 
            listing={listing} 
            allowNonPremiumImage={false} 
            isCompact={true}
            dateTypeToDisplay="created_at"
          />
        ))}
        {totalPages > 1 && (
          <Pagination className="pt-4 col-span-full">
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
      <Helmet>
        <title>{generateTitle()}</title>
        <meta name="description" content={generateDescription()} />
        <meta name="keywords" content={`incontri, annunci, ${keyword || ''}, ${category || ''}, ${city || ''}, appuntamenti, relazioni, single, bakeca incontri`} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-2 sm:px-8">
        <div className="flex items-center gap-4 mb-6">
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