import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Rocket, CheckCircle, LayoutGrid } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';

const ListingPostCreation = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const [listingTitle, setListingTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchListingTitle = async () => {
      if (!listingId) {
        showError("ID annuncio non fornito.");
        navigate('/my-listings');
        return;
      }
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('title')
        .eq('id', listingId)
        .single();

      if (error || !data) {
        console.error("Error fetching listing title:", error);
        showError("Impossibile recuperare i dettagli dell'annuncio.");
        navigate('/my-listings');
      } else {
        setListingTitle(data.title);
      }
      setLoading(false);
    };
    fetchListingTitle();
  }, [listingId, navigate]);

  if (loading) {
    return (
      <div className="bg-gray-50 p-6 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full space-y-6 text-center">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  if (!listingTitle) {
    return (
      <div className="bg-gray-50 p-6 min-h-screen flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-800">Annuncio non trovato</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">Sembra che l'annuncio che stavi cercando non esista più o non sia accessibile.</p>
            <Link to="/my-listings">
              <Button className="bg-rose-500 hover:bg-rose-600">Vai ai miei annunci</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 min-h-screen flex items-center justify-center">
      <Card className="max-w-2xl w-full text-center shadow-lg">
        <CardHeader className="pb-4">
          <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <CardTitle className="text-3xl font-bold text-gray-800">Annuncio Pubblicato!</CardTitle>
          <CardDescription className="text-lg text-gray-600">
            Il tuo annuncio "<span className="font-semibold text-rose-600">{listingTitle}</span>" è stato pubblicato con successo.
            Cosa vuoi fare ora?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <Link to={`/promote-listing/${listingId}`}>
            <Button className="w-full bg-rose-500 hover:bg-rose-600 text-lg py-6 flex items-center justify-center gap-2">
              <Rocket className="h-6 w-6" /> Promuovi Annuncio
            </Button>
          </Link>
          <Link to="/my-listings">
            <Button variant="outline" className="w-full border-rose-500 text-rose-500 hover:bg-rose-50 hover:text-rose-600 text-lg py-6 flex items-center justify-center gap-2">
              <LayoutGrid className="h-6 w-6" /> Continua con annuncio gratuito
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default ListingPostCreation;