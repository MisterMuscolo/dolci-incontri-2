import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ListingListItem, Listing } from '@/components/ListingListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, User } from 'lucide-react';
import { showError } from '@/utils/toast';

const UserListingsAdminView = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchUserDataAndListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!userId) {
      setError("ID utente non fornito.");
      setLoading(false);
      return;
    }

    // Fetch user email
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (profileError || !profileData) {
      console.error("Error fetching user profile:", profileError);
      setError("Impossibile recuperare i dettagli dell'utente.");
      setLoading(false);
      return;
    }
    setUserEmail(profileData.email);

    // Fetch listings for the specific user, ordered by premium and then by date
    const { data, error: listingsError } = await supabase
      .from('listings')
      .select(`
        id,
        user_id,
        title,
        category,
        city,
        created_at,
        expires_at,
        is_premium,
        age,
        promotion_mode,
        promotion_start_at,
        promotion_end_at,
        last_bumped_at,
        listing_photos ( url, is_primary )
      `)
      .eq('user_id', userId); // Rimosso l'ordinamento lato server per gestirlo lato client

    if (listingsError) {
      console.error("Error fetching user listings:", listingsError);
      setError("Impossibile caricare gli annunci dell'utente.");
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
        const aBumpedAt = a.last_bumped_at ? new Date(a.last_bumped_at).getTime() : 0;
        const bBumpedAt = b.last_bumped_at ? new Date(b.last_bumped_at).getTime() : 0;
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
  }, [userId]);

  useEffect(() => {
    fetchUserDataAndListings();
  }, [fetchUserDataAndListings]);

  return (
    <div className="bg-gray-50 p-6 flex-grow">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
          </Button>
          <h1 className="text-3xl font-bold">Annunci di {userEmail || 'Utente'}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <User className="h-6 w-6 text-rose-500" />
              Annunci
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
              </div>
            ) : error ? (
              <p className="text-red-500 text-center py-8">{error}</p>
            ) : listings.length > 0 ? (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <ListingListItem 
                    key={listing.id} 
                    listing={listing} 
                    canEdit={false} // Gli amministratori non modificano direttamente gli annunci degli utenti da qui
                    canManagePhotos={true} // Gli amministratori possono gestire le foto
                    canDelete={true} // Gli amministratori possono eliminare
                    showExpiryDate={true} 
                    onListingUpdated={fetchUserDataAndListings}
                    isAdminContext={true} // Passa la prop per nascondere i pulsanti di promozione/acquisto
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Questo utente non ha ancora creato nessun annuncio.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserListingsAdminView;