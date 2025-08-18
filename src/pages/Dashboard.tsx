import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ListingListItem, Listing } from "@/components/ListingListItem";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const LISTINGS_PER_PAGE = 10;

const Dashboard = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { count, error: countError } = await supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (countError) {
        console.error("Errore nel conteggio degli annunci:", countError);
        setLoading(false);
        return;
      }

      if (count) {
        setTotalPages(Math.ceil(count / LISTINGS_PER_PAGE));
      }

      const from = (currentPage - 1) * LISTINGS_PER_PAGE;
      const to = from + LISTINGS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          category,
          city,
          created_at,
          listing_photos ( url, is_primary )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        console.error("Errore nel recupero degli annunci:", error);
      } else if (data) {
        setListings(data as Listing[]);
      }
      setLoading(false);
    };

    fetchListings();
  }, [currentPage]);

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

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
            <h2 className="text-2xl font-semibold mb-4 border-b pb-2">I tuoi annunci</h2>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            ) : listings.length > 0 ? (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <ListingListItem key={listing.id} listing={listing} showControls={true} />
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
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <p className="text-gray-600">Non hai ancora creato nessun annuncio.</p>
                <Link to="/new-listing" className="mt-4 inline-block">
                  <Button className="bg-rose-500 hover:bg-rose-600">Pubblica il tuo primo annuncio</Button>
                </Link>
              </div>
            )}
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