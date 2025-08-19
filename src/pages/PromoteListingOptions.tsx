import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, Rocket, Sun, Moon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';

interface PromotionOption {
  id: 'day' | 'night';
  name: string;
  credits: number;
  durationHours: number;
  description: string;
  icon: React.ElementType;
  details: string[];
}

const promotionOptions: PromotionOption[] = [
  {
    id: 'day',
    name: 'Modalità Giorno',
    credits: 10,
    durationHours: 24,
    description: 'Il tuo annuncio sarà in evidenza durante il giorno.',
    icon: Sun,
    details: [
      '1 risalita immediata (in cima ai risultati)',
      'Visibilità premium per 24 ore',
      'Ideale per annunci con alta interazione diurna',
    ],
  },
  {
    id: 'night',
    name: 'Modalità Notte',
    credits: 30,
    durationHours: 48,
    description: 'Massima visibilità durante le ore notturne.',
    icon: Moon,
    details: [
      '5 risalite (più frequenti) durante il periodo',
      'Visibilità premium per 48 ore',
      'Perfetto per raggiungere un pubblico diverso',
    ],
  },
];

const PromoteListingOptions = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [currentCredits, setCurrentCredits] = useState<number | null>(null);
  const [listingTitle, setListingTitle] = useState<string | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);

  useEffect(() => {
    const fetchUserDataAndListing = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError('Devi essere autenticato per promuovere un annuncio.');
        navigate('/auth');
        return;
      }

      // Fetch user credits
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (profileError || !profileData) {
        console.error("Error fetching profile credits:", profileError);
        showError('Impossibile recuperare i tuoi crediti.');
        setCurrentCredits(0);
      } else {
        setCurrentCredits(profileData.credits);
      }

      // Fetch listing title
      if (listingId) {
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('title')
          .eq('id', listingId)
          .single();

        if (listingError || !listingData) {
          console.error("Error fetching listing title:", listingError);
          showError('Annuncio non trovato.');
          navigate('/my-listings');
          return;
        }
        setListingTitle(listingData.title);
      } else {
        showError('ID annuncio non fornito.');
        navigate('/my-listings');
        return;
      }

      setIsLoading(false);
    };

    fetchUserDataAndListing();
  }, [listingId, navigate]);

  const handlePromote = async (option: PromotionOption) => {
    if (!listingId || currentCredits === null || currentCredits < option.credits) {
      showError('Crediti insufficienti o annuncio non valido.');
      return;
    }

    setIsPromoting(true);
    const toastId = showLoading(`Promozione annuncio in Modalità ${option.name} in corso...`);

    try {
      const { error } = await supabase.functions.invoke('promote-listing', {
        body: {
          listingId: listingId,
          promotionType: option.id,
          cost: option.credits,
          durationHours: option.durationHours,
        },
      });

      dismissToast(toastId);

      if (error) {
        let errorMessage = 'Errore durante la promozione dell\'annuncio.';
        // @ts-ignore
        if (error.context && typeof error.context.body === 'string') {
          try {
            // @ts-ignore
            const errorBody = JSON.parse(error.context.body);
            if (errorBody.error) {
              errorMessage = errorBody.error;
            }
          } catch (e) {
            console.error("Could not parse error response from edge function:", e);
          }
        }
        throw new Error(errorMessage);
      }

      showSuccess(`Annuncio promosso in Modalità ${option.name} con successo!`);
      navigate('/my-listings'); // Reindirizza a "I miei annunci"
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setIsPromoting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 p-6 min-h-screen">
        <div className="max-w-3xl mx-auto space-y-8">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Promuovi Annuncio</h1>
        </div>

        {listingTitle && (
          <p className="text-lg text-gray-700">
            Stai promuovendo: <span className="font-semibold text-rose-600">"{listingTitle}"</span>
          </p>
        )}
        
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold flex items-center gap-2">
              <Rocket className="h-6 w-6 text-rose-500" />
              I tuoi crediti disponibili
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-gray-800">
              {currentCredits !== null ? currentCredits : 0} <span className="text-rose-500">crediti</span>
            </p>
            <Button onClick={() => navigate('/buy-credits')} className="mt-4 bg-rose-500 hover:bg-rose-600">
              Acquista più crediti
            </Button>
          </CardContent>
        </Card>

        <h2 className="text-2xl font-bold text-gray-800 mt-8">Scegli la modalità di promozione:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promotionOptions.map((option) => {
            const Icon = option.icon;
            const canAfford = currentCredits !== null && currentCredits >= option.credits;

            return (
              <Card
                key={option.id}
                className={`flex flex-col border-2 ${canAfford ? 'border-gray-200 hover:border-rose-500' : 'border-red-300 opacity-70 cursor-not-allowed'} transition-all duration-200`}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Icon className="h-6 w-6 text-rose-500" /> {option.name}
                  </CardTitle>
                  <div className="text-2xl font-bold text-gray-900">
                    {option.credits} <span className="text-rose-500">crediti</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between pt-4">
                  <CardDescription className="mb-4 text-gray-600">{option.description}</CardDescription>
                  <ul className="list-disc list-inside text-sm text-gray-700 mb-4 space-y-1">
                    {option.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => handlePromote(option)}
                    disabled={!canAfford || isPromoting}
                    className="w-full bg-rose-500 hover:bg-rose-600"
                  >
                    {isPromoting ? 'Promozione in corso...' : `Promuovi per ${option.credits} crediti`}
                  </Button>
                  {!canAfford && (
                    <p className="text-red-500 text-sm mt-2 text-center">Crediti insufficienti.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PromoteListingOptions;