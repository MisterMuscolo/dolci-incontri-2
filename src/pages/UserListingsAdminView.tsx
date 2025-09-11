import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ListingListItem, Listing } from '@/components/ListingListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, User } from 'lucide-react';
import { useDynamicBackLink } from '@/hooks/useDynamicBackLink';

const UserListingsAdminView = () => {
  const { userId } = useParams<{ userId: string }>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { getBackLinkText, handleNavigateBack } = useDynamicBackLink();

  const fetchUserDataAndListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!userId) {
      setError("ID utente non fornito.");
      setLoading(false);
      return;
    }

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
        description,
        created_at,
        expires_at,
        is_premium,
        promotion_mode,
        promotion_start_at,
        promotion_end_at,
        last_bumped_at,
        is_paused,
        paused_at,
        remaining_expires_at_duration,
        remaining_promotion_duration,
        listing_photos ( url, original_url, is_primary ),
        slug,
        ethnicity,
        nationality,
        breast_type,
        hair_color,
        body_type,
        eye_color,
        meeting_type,
        availability_for,
        meeting_location,
        hourly_rate,
        offered_services
      `);

    query = query.eq('user_id', userId);

    // Updated sorting logic
    query = query
      .order('is_paused', { ascending: true }) // Non-paused first
      .order('is_premium', { ascending: false }) // Premium first
      .order('promotion_end_at', { ascending: false, nullsLast: true }) // More active promotions first
      .order('last_bumped_at', { ascending: false, nullsLast: true }) // Recently bumped/created first
      .order('created_at', { ascending: false }); // Newest first as tie-breaker

    const { data, error: listingsError } = await query;

    if (listingsError) {
      console.error("Error fetching user listings:", listingsError);
      setError("Impossibile caricare gli annunci dell'utente.");
    } else if (data) {
      const processedListings = data.map((listing: any) => ({ // Modificato il tipo di 'listing' a 'any' per risolvere l'errore
        ...listing,
        listing_photos: (listing.listing_photos || []).sort((a: { is_primary: boolean }, b: { is_primary: boolean }) => {
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;
          return 0;
        })
      }));
      setListings(processedListings as Listing[]);
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
          <Button variant="ghost" onClick={handleNavigateBack} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            {getBackLinkText()}
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
                    canEdit={false}
                    canManagePhotos={true}
                    canDelete={true}
                    canPauseResume={true}
                    onListingUpdated={fetchUserDataAndListings}
                    isAdminContext={true}
                    dateTypeToDisplay="expires_at"
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