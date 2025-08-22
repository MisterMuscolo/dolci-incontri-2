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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    setCurrentUserId(user.id);

    const { count, error: countError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gt('expires_at', new Date().toISOString());

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

    let query = supabase
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
      .gt('expires_at', new Date().toISOString());

    // Applica l'ordinamento lato server per prioritizzare gli annunci Premium attivi
    query = query
      .order('is_premium', { ascending: false }) // Premium prima
      .order('promotion_end_at', { ascending: false, nullsFirst: false }) // Poi per scadenza promozione (più lontana prima)
      .order('last_bumped_at', { ascending: false, nullsFirst: false }) // Poi per ultimo 'bump'
      .order('created_at', { ascending: false }); // Infine per data di creazione

    const { data, error } = await query.range(from, to);

    if (error) {
      console.error("MyListings: Errore nel recupero degli annunci:", error.message, error.details);
    } else if (data) {
      // Rimosso l'ordinamento lato client, ora gestito dal server
      setListings(data as Listing[]);
    }
    setLoading(false);
  }, [currentPage]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

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
                    canEdit={true}
                    canManagePhotos={false}
                    canDelete={true}
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