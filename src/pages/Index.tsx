import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { italianProvinces } from '@/data/provinces';
import { Heart, MapPin, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ListingCard } from '@/components/ListingCard';
import { Skeleton } from '@/components/ui/skeleton';

interface IndexProps {
  session: any;
}

interface Listing {
  id: string;
  title: string;
  city: string;
  photo_url: string | null;
}

export default function Index({ session }: IndexProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select(`
          id,
          title,
          city,
          listing_photos (
            url,
            is_primary
          )
        `)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching listings:', error);
        setListings([]);
      } else if (data) {
        const formattedListings = data.map(listing => {
          const primaryPhoto = (listing.listing_photos as any[]).find(p => p.is_primary);
          return {
            id: listing.id,
            title: listing.title,
            city: listing.city,
            photo_url: primaryPhoto ? primaryPhoto.url : null,
          };
        });
        setListings(formattedListings);
      }
      setLoading(false);
    };

    fetchListings();
  }, []);

  return (
    <>
      <div className="bg-gradient-to-br from-rose-100 via-white to-sky-100">
        <div className="container mx-auto px-4 py-16 text-center">
          
          <h1 className="text-5xl font-bold text-rose-600 mb-4">
            Dolci Incontri
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Trova la tua complice avventura.
          </p>
          
          <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">Cerca il tuo incontro ideale</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Select>
                    <SelectTrigger className="w-full pl-10">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="donna-cerca-uomo">👩‍❤️‍👨 Donna cerca Uomo</SelectItem>
                      <SelectItem value="uomo-cerca-donna">👨‍❤️‍👩 Uomo cerca Donna</SelectItem>
                      <SelectItem value="coppie">👩‍❤️‍💋‍👨 Coppie</SelectItem>
                      <SelectItem value="uomo-cerca-uomo">👨‍❤️‍👨 Uomo cerca Uomo</SelectItem>
                      <SelectItem value="donna-cerca-donna">👩‍❤️‍👩 Donna cerca Donna</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Select>
                    <SelectTrigger className="w-full pl-10">
                      <SelectValue placeholder="Città" />
                    </SelectTrigger>
                    <SelectContent>
                      {italianProvinces.map((province) => (
                        <SelectItem key={province.value} value={province.value}>
                          {province.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input type="text" placeholder="Parola chiave o zona..." className="w-full pl-10" />
                </div>
              </div>
              <Button className="w-full bg-rose-500 hover:bg-rose-600 text-white text-lg py-6">
                Cerca
              </Button>
            </div>
            
            <div className="mt-8 text-center">
              {!session ? (
                <p className="text-gray-600">
                  Hai già un account?{' '}
                  <Link to="/auth?tab=login" className="font-semibold text-rose-500 hover:text-rose-600">
                    Accedi
                  </Link>
                  {' '}o{' '}
                  <Link to="/auth?tab=register" className="font-semibold text-rose-500 hover:text-rose-600">
                    Registrati
                  </Link>
                </p>
              ) : (
                <Link to="/dashboard">
                  <Button variant="outline" className="border-rose-500 text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                    Vai alla tua Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-10">
            Ultimi Annunci Inseriti
          </h2>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="space-y-4">
                  <Skeleton className="h-[200px] w-full rounded-lg" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}