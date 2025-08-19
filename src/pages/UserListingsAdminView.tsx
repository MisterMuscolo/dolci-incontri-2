import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const fetchUserDataAndListings = async () => {
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

      // Fetch listings for the specific user
      const { data, error: listingsError } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          category,
          city,
          created_at,
          expires_at,
          listing_photos ( url, is_primary )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (listingsError) {
        console.error("Error fetching user listings:", listingsError);
        setError("Impossibile caricare gli annunci dell'utente.");
      } else if (data) {
        setListings(data as Listing[]);
      }
      setLoading(false);
    };

    fetchUserDataAndListings();
  }, [userId]);

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
                  <ListingListItem key={listing.id} listing={listing} showControls={true} showExpiryDate={true} />
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