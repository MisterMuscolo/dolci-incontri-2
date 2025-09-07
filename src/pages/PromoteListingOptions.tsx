import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'; // Importa useSearchParams
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChevronLeft, Rocket, Sun, Moon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils'; // Importa cn per le classi condizionali
import { useDynamicBackLink } from '@/hooks/useDynamicBackLink';

interface PromotionOption {
  id: 'day' | 'night';
  name: string;
  description: string;
  icon: React.ElementType;
  details: string[];
  coverageText: string;
  costs: { [duration: number]: number }; // Nuovo campo per i costi specifici per durata
}

const promotionOptions: PromotionOption[] = [
  {
    id: 'day',
    name: 'Modalità Giorno',
    description: 'Il tuo annuncio sarà in evidenza durante il giorno.',
    icon: Sun,
    details: [
      '1 risalita immediata (in cima ai risultati)',
      'Visibilità premium per ogni giorno selezionato',
      'Ideale per annunci con alta interazione diurna',
    ],
    coverageText: 'Copertura: dalle 07:00 alle 23:00',
    costs: { // Nuovi costi specifici per la Modalità Giorno
      1: 15,
      3: 30,
      7: 62,
    },
  },
  {
    id: 'night',
    name: 'Modalità Notte',
    description: 'Massima visibilità durante le ore notturne.',
    icon: Moon,
    details: [
      '5 risalite (più frequenti) durante il periodo',
      'Visibilità premium per ogni giorno selezionato',
      'Perfetto per raggiungere un pubblico diverso',
    ],
    coverageText: 'Copertura: dalle 23:00 alle 07:00',
    costs: { // Nuovi costi specifici per la Modalità Notte
      1: 20,
      3: 45,
      7: 90,
    },
  },
];

const durations = [
  { value: 1, label: '1 Giorno' },
  { value: 3, label: '3 Giorni' },
  { value: 7, label: '7 Giorni' },
];

const dayTimeSlots = [
  { value: '07:00-08:00', label: '07:00 - 08:00' },
  { value: '08:00-09:00', label: '08:00 - 09:00' },
  { value: '09:00-10:00', label: '09:00 - 10:00' },
  { value: '10:00-11:00', label: '10:00 - 11:00' },
  { value: '11:00-12:00', label: '11:00 - 12:00' },
  { value: '12:00-13:00', label: '12:00 - 13:00' },
  { value: '13:00-14:00', label: '13:00 - 14:00' },
  { value: '14:00-15:00', label: '14:00 - 15:00' },
  { value: '15:00-16:00', label: '15:00 - 16:00' },
  { value: '16:00-17:00', label: '16:00 - 17:00' },
  { value: '17:00-18:00', label: '17:00 - 18:00' },
  { value: '18:00-19:00', label: '18:00 - 19:00' },
  { value: '19:00-20:00', label: '19:00 - 20:00' },
  { value: '20:00-21:00', label: '20:00 - 21:00' },
  { value: '21:00-22:00', label: '21:00 - 22:00' },
  { value: '22:00-23:00', label: '22:00 - 23:00' },
];

const PromoteListingOptions = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Ottieni i parametri di ricerca
  const initialModeFromUrl = searchParams.get('mode'); // Leggi il parametro 'mode'

  const [isLoading, setIsLoading] = useState(true);
  const [currentCredits, setCurrentCredits] = useState<number | null>(null);
  const [listingTitle, setListingTitle] = useState<string | null>(null);
  const [isPromoting, setIsPromoting] = useState(false);
  const [selectedDurations, setSelectedDurations] = useState<{ [key: string]: number }>({
    day: durations[0].value,
    night: durations[0].value,
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(dayTimeSlots[0].value); // Default to first time slot
  const [initialPromotionMode, setInitialPromotionMode] = useState<string | null>(null); // Stato per il tipo di promozione iniziale (se si sta estendendo)
  const { getBackLinkText, handleNavigateBack } = useDynamicBackLink(); // Usa handleNavigateBack

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

      // Fetch listing title and promotion_mode
      if (listingId) {
        const { data: listingData, error: listingError } = await supabase
          .from('listings')
          .select('title, promotion_mode, slug') // Fetch promotion_mode and slug
          .eq('id', listingId)
          .single();

        if (listingError || !listingData) {
          console.error("Error fetching listing title:", listingError);
          showError('Annuncio non trovato.');
          navigate('/my-listings');
          return;
        }
        setListingTitle(listingData.title);

        // Se il parametro 'mode' è presente nell'URL e corrisponde alla modalità di promozione dell'annuncio,
        // imposta initialPromotionMode per disabilitare l'altra opzione.
        if (initialModeFromUrl && initialModeFromUrl === listingData.promotion_mode) {
            setInitialPromotionMode(initialModeFromUrl);
        } else {
            setInitialPromotionMode(null); // Non in modalità estensione per un tipo specifico
        }
      } else {
        showError('ID annuncio non fornito.');
        navigate('/my-listings');
        return;
      }

      setIsLoading(false);
    };

    fetchUserDataAndListing();
  }, [listingId, navigate, initialModeFromUrl]); // Aggiungi initialModeFromUrl alle dipendenze

  const handlePromote = async (option: PromotionOption) => {
    const currentDuration = selectedDurations[option.id];
    const totalCost = option.costs[currentDuration]; // Usa il costo specifico dalla mappa
    const totalDurationHours = currentDuration * 24; // Ogni giorno è 24 ore di visibilità premium
    const timezoneOffsetMinutes = new Date().getTimezoneOffset(); // Get local timezone offset in minutes

    if (!listingId || currentCredits === null || currentCredits < totalCost) {
      showError('Crediti insufficienti o annuncio non valido.');
      return;
    }

    setIsPromoting(true);
    const toastId = showLoading(`Promozione annuncio in Modalità ${option.name} per ${currentDuration} giorni in corso...`);

    try {
      const { error } = await supabase.functions.invoke('promote-listing', {
        body: {
          listingId: listingId,
          promotionType: option.id,
          cost: totalCost,
          durationHours: totalDurationHours, // Pass total hours
          timeSlot: option.id === 'day' ? selectedTimeSlot : undefined, // Pass time slot only for 'day' mode
          timezoneOffsetMinutes: timezoneOffsetMinutes, // Add this
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

      showSuccess(`Annuncio promosso in Modalità ${option.name} per ${currentDuration} giorni con successo!`);
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
          <Button variant="ghost" onClick={handleNavigateBack} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            {getBackLinkText()}
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
            const currentDuration = selectedDurations[option.id]; // Usa la durata specifica per l'opzione
            const totalCost = option.costs[currentDuration]; // Ottieni il costo dalla mappa
            const canAfford = currentCredits !== null && currentCredits >= totalCost;

            // Determina se questa opzione dovrebbe essere disabilitata per l'estensione
            const isDisabledForExtension = initialPromotionMode !== null && option.id !== initialPromotionMode;

            return (
              <Card
                key={option.id}
                className={cn(
                  `flex flex-col border-2`,
                  canAfford && !isDisabledForExtension ? 'border-gray-200 hover:border-rose-500' : 'border-red-300 opacity-70 cursor-not-allowed',
                  isDisabledForExtension && 'opacity-50 cursor-not-allowed' // Stile aggiuntivo per l'opzione disabilitata
                )}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Icon className="h-6 w-6 text-rose-500" /> {option.name}
                  </CardTitle>
                  <div className="text-2xl font-bold text-gray-900">
                    {totalCost} <span className="text-rose-500">crediti</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-between pt-4">
                  <CardDescription className="mb-2 text-gray-600">{option.description}</CardDescription>
                  <p className="text-sm text-gray-500 mb-4">{option.coverageText}</p> {/* Testo di copertura */}
                  {option.id === 'day' && (
                    <div className="mb-4">
                      <Select 
                        onValueChange={setSelectedTimeSlot} 
                        value={selectedTimeSlot}
                        disabled={isDisabledForExtension} // Disabilita anche la selezione della fascia oraria
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleziona fascia oraria" />
                        </SelectTrigger>
                        <SelectContent>
                          {dayTimeSlots.map((slot) => (
                            <SelectItem key={slot.value} value={slot.value}>
                              {slot.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div className="mb-4">
                    <Select
                      onValueChange={(value) => setSelectedDurations(prev => ({ ...prev, [option.id]: parseInt(value) }))}
                      value={String(currentDuration)}
                      disabled={isDisabledForExtension} // Disabilita la selezione della durata
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleziona durata" />
                      </SelectTrigger>
                      <SelectContent>
                        {durations.map((d) => (
                          <SelectItem key={d.value} value={String(d.value)}>
                            {d.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => handlePromote(option)}
                    disabled={!canAfford || isPromoting || isDisabledForExtension} // Aggiungi isDisabledForExtension
                    className="w-full bg-rose-500 hover:bg-rose-600"
                  >
                    {isPromoting ? 'Promozione in corso...' : `Promuovi per ${totalCost} crediti`}
                  </Button>
                  {(!canAfford && !isDisabledForExtension) && ( // Mostra crediti insufficienti solo se non disabilitato dalla modalità estensione
                    <p className="text-red-500 text-sm mt-2 text-center">Crediti insufficienti.</p>
                  )}
                  {isDisabledForExtension && (
                    <p className="text-gray-500 text-sm mt-2 text-center">
                      Puoi estendere solo la Modalità {initialPromotionMode === 'day' ? 'Giorno' : 'Notte'}.
                    </p>
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