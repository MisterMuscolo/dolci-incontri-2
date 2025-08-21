import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ListingListItem, Listing } from "@/components/ListingListItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

const LISTINGS_PER_PAGE = 10;

const MyListings = () => {
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null); // Stato per l'ID utente corrente

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id); // Imposta l'ID utente corrente

    // Query per il conteggio totale degli annunci attivi dell'utente
    const { count, error: countError } = await supabase
      .from('listings')
      .select('id', { count: 'exact', head: true }) // Select only 'id' for count
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString()); // Filtra solo gli annunci attivi

    if (countError) {
      console.error("MyListings: Errore nel conteggio degli annunci:", countError.message, countError.details);
      setLoading(false);
      return;
    }

    if (count !== null) {
      setTotalPages(Math.ceil(count / LISTINGS_PER_PAGE));
    }

    const from = (currentPage - 1) * LISTINGS_PER_PAGE;
    const to = from + LISTINGS_PER_PAGE - 1;

    // Query per recuperare gli annunci attivi, ordinati per premium e poi per data
    const { data, error } = await supabase
      .from('listings')
      .select(`
        id,
        user_id,
        title,
        category,
        city,
        zone,
        age,
        created_at,
        expires_at,
        is_premium,
        promotion_mode,
        promotion_start_at,
        promotion_end_at,
        last_bumped_at,
        listing_photos ( url, is_primary )
      `)
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString()) // Filtra solo gli annunci attivi
      .range(from, to); 

    if (error) {
      console.error("MyListings: Errore nel recupero degli annunci:", error.message, error.details);
    } else if (data) {
      // Client-side sorting for active premium listings
      const now = new Date();
      const sortedData = (data as Listing[]).sort((a, b) => {
        const aIsActivePremium = a.is_premium && a.promotion_start_at && a.promotion_end_at && new Date(a.promotion_start_at) <= now && new Date(a.promotion_end_at) >= now;
        const bIsActivePremium = b.is_premium && b.promotion_start_at && b.promotion_end_at && new Date(b.promotion_start_at) <= now && new Date(b.promotion_end_at) >= now;

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
    setLoading(false);
  }, [currentPage]); // Dipendenza da currentPage

  useEffect(() => {
    fetchListings();
  }, [fetchListings]); // Dipendenza dalla funzione fetchListings

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-gray-50 p-6 flex-grow">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
              <ChevronLeft className="h-5 w-5 mr-2" />
              Indietro
            </Button>
            <h1 className="text-3xl font-bold">I tuoi annunci</h1>
          </div>
          {/* Il pulsante "Crea nuovo annuncio" è stato rimosso da qui */}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              Annunci
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            ) : listings.length > 0 ? (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <ListingListItem 
                    key={listing.id} 
                    listing={listing} 
                    canEdit={true} // L'utente può modificare i propri annunci
                    canManagePhotos={false} // Rimosso: la gestione delle foto avviene nella pagina di modifica
                    canDelete={true} // L'utente può eliminare i propri annunci
                    showExpiryDate={true} 
                    onListingUpdated={fetchListings} 
                  />
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
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Non hai ancora creato nessun annuncio.</p>
                <Link to="/new-listing" className="mt-4 inline-block">
                  <Button className="bg-rose-500 hover:bg-rose-600">Pubblica il tuo primo annuncio</Button>
                </Link>
              </div>
            )}
          </CardContent>
          </Card>
      </div>
    </div>
  );
};

export default MyListings;