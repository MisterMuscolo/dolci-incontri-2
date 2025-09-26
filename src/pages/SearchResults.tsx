import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ListingListItem, Listing } from '@/components/ListingListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ChevronLeft, MapPin, Search, Heart, ChevronDown, ChevronUp, RotateCcw, User, Handshake, Clock, Home, Euro, Sparkles, CheckIcon, X, Globe, Palette, Ruler, Eye } from 'lucide-react'; // Aggiunte icone per i nuovi filtri
import { Helmet } from 'react-helmet-async';
import { useDynamicBackLink } from '@/hooks/useDynamicBackLink';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { italianProvinces } from '@/data/provinces';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox'; // Importa Checkbox
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

const LISTINGS_PER_PAGE = 10;

const ageRanges = [
  { value: '18-24', label: '18-24 anni', min: 18, max: 24 },
  { value: '25-36', label: '25-36 anni', min: 25, max: 36 },
  { value: '37-45', label: '37-45 anni', min: 37, max: 45 },
  { value: 'over45', label: '+46 anni', min: 46, max: null },
];

// Definizioni delle opzioni per i nuovi campi (copiate da NewListing.tsx)
const meetingTypeOptions = [
  { id: 'cena', label: 'Cena' },
  { id: 'aperitivo', label: 'Aperitivo' },
  { id: 'relax', label: 'Relax' },
  { id: 'massaggio', label: 'Massaggio' },
  { id: 'viaggio', label: 'Viaggio' },
  { id: 'altro', label: 'Altro' },
];

const availabilityForOptions = [
  { id: 'mattina', label: 'Mattina' },
  { id: 'pomeriggio', label: 'Pomeriggio' },
  { id: 'sera', label: 'Sera' },
  { id: 'notte', label: 'Notte' },
  { id: 'weekend', label: 'Weekend' },
];

const meetingLocationOptions = [
  { id: 'mio-domicilio', label: 'Mio domicilio' },
  { id: 'tuo-domicilio', label: 'Tuo domicilio' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'esterno', label: 'Esterno' },
  { id: 'online', label: 'Online' },
];

const offeredServicesOptions = [
  { id: '69', label: '69' },
  { id: 'baci-profondi', label: 'Baci profondi (FK)' },
  { id: 'bacio-leggero', label: 'Bacio leggero' },
  { id: 'due-ragazze', label: 'Due ragazze' },
  { id: 'girlfriend-experience', label: 'Girlfriend experience (GFE)' },
  { id: 'massaggio-professionale', label: 'Massaggio Professionale' },
  { id: 'massaggio-prostatico', label: 'Massaggio Prostatico' },
  { id: 'massaggio-sensuale-con-corpo', label: 'Massaggio sensuale con corpo' },
  { id: 'massaggio-tantrico', label: 'Massaggio Tantrico' },
  { id: 'masturbazione-con-mano', label: 'Masturbazione con mano (HJ)' },
  { id: 'orale-coperto-con-condom', label: 'Orale coperto con Condom' },
  { id: 'orale-scoperto', label: 'Orale scoperto (BBJ)' },
  { id: 'orgasmo-multiplo', label: 'Orgasmo multiplo' },
  { id: 'porn-star-experience', label: 'Porn Star Experience (PSE)' },
  { id: 'rapporto-anale', label: 'Rapporto anale' },
  { id: 'rapporto-sessuale', label: 'Rapporto sessuale' },
  { id: 'rimming', label: 'Rimming' },
  { id: 'sesso-orale', label: 'Sesso orale (DATY)' },
  { id: 'venuta-in-bocca', label: 'Venuta in bocca (CIM)' },
  { id: 'venuta-su-seno', label: 'Venuta su seno (COB)' },
  { id: 'altro', label: 'Altro' },
];

const ethnicities = [
  { value: 'africana', label: 'Africana' },
  { value: 'indiana', label: 'Indiana' },
  { value: 'asiatica', label: 'Asiatica' },
  { value: 'araba', label: 'Araba' },
  { value: 'latina', label: 'Latina' },
  { value: 'caucasica', label: 'Caucasica' },
  { value: 'italiana', label: 'Italiana' },
  { value: 'mista', label: 'Mista' },
  { value: 'altro', label: 'Altro' },
];

const nationalities = [
  { value: 'italiana', label: 'Italiana' },
  { value: 'rumena', label: 'Rumena' },
  { value: 'brasiliana', label: 'Brasiliana' },
  { value: 'spagnola', label: 'Spagnola' },
  { value: 'francese', label: 'Francese' },
  { value: 'tedesca', label: 'Tedesca' },
  { value: 'russa', label: 'Russa' },
  { value: 'ucraina', label: 'Ucraina' },
  { value: 'colombiana', label: 'Colombiana' },
  { value: 'venezuelana', label: 'Venezuelana' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'cubana', label: 'Cubana' },
  { value: 'dominicana', label: 'Dominicana' },
  { value: 'cinese', label: 'Cinese' },
  { value: 'filippina', label: 'Filippina' },
  { value: 'indonesiana', label: 'Indonesiana' },
  { value: 'thailandese', label: 'Thailandese' },
  { value: 'nigeriana', label: 'Nigeriana' },
  { value: 'egiziana', label: 'Egiziana' },
  { value: 'marocchina', label: 'Marocchina' },
  { value: 'albanese', label: 'Albanese' },
  { value: 'polacca', label: 'Polacca' },
  { value: 'britannica', label: 'Britannica' },
  { value: 'americana', label: 'Americana' },
  { value: 'canadese', label: 'Canadese' },
  { value: 'australiana', label: 'Australiana' },
  { value: 'altro', label: 'Altro' },
];

const breastTypes = [
  { value: 'naturale', label: 'Naturale' },
  { value: 'rifatto', label: 'Rifatto' },
  { value: 'piccolo', label: 'Piccolo' },
  { value: 'medio', label: 'Medio' },
  { value: 'grande', label: 'Grande' },
];

const hairColors = [
  { value: 'biondi', label: 'Biondi' },
  { value: 'castani', label: 'Castani' },
  { value: 'neri', label: 'Neri' },
  { value: 'rossi', label: 'Rossi' },
  { value: 'grigi', label: 'Grigi' },
  { value: 'colorati', label: 'Colorati' },
];

const bodyTypes = [
  { value: 'snella', label: 'Snella' },
  { value: 'atletica', label: 'Atletica' },
  { value: 'curvy', label: 'Curvy' },
  { value: 'robusta', label: 'Robusta' },
  { value: 'media', label: 'Media' },
];

const eyeColors = [
  { value: 'azzurri', label: 'Azzurri' },
  { value: 'marroni', label: 'Marroni' },
  { value: 'verdi', label: 'Verdi' },
  { value: 'neri', label: 'Neri' },
  { value: 'grigi', label: 'Grigi' },
  { value: 'misti', label: 'Misti' },
];

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const { getBackLinkText, handleNavigateBack } = useDynamicBackLink();

  // Local states for filters
  const [currentCategory, setCurrentCategory] = useState(searchParams.get('category') || 'tutte');
  const [currentCity, setCurrentCity] = useState(searchParams.get('city') || 'tutte');
  const [currentKeyword, setCurrentKeyword] = useState(searchParams.get('keyword') || '');
  const [currentSelectedAgeRanges, setCurrentSelectedAgeRanges] = useState<string[]>([]); // Modificato a array
  const [currentEthnicities, setCurrentEthnicities] = useState<string[]>([]); // Modificato a array
  const [currentNationalities, setCurrentNationalities] = useState<string[]>([]); // Modificato a array
  const [currentBreastTypes, setCurrentBreastTypes] = useState<string[]>([]); // Modificato a array
  const [currentHairColors, setCurrentHairColors] = useState<string[]>([]); // Modificato a array
  const [currentBodyTypes, setCurrentBodyTypes] = useState<string[]>([]); // Modificato a array
  const [currentEyeColors, setCurrentEyeColors] = useState<string[]>([]); // Modificato a array
  // Nuovi stati per i filtri di incontro
  const [currentMeetingTypes, setCurrentMeetingTypes] = useState<string[]>(searchParams.getAll('meeting_type'));
  const [currentAvailabilityFor, setCurrentAvailabilityFor] = useState<string[]>(searchParams.getAll('availability_for'));
  const [currentMeetingLocations, setCurrentMeetingLocations] = useState<string[]>(searchParams.getAll('meeting_location'));
  const [currentHourlyRateMin, setCurrentHourlyRateMin] = useState<string>(searchParams.get('hourly_rate_min') || '');
  const [currentHourlyRateMax, setCurrentHourlyRateMax] = useState<string>(searchParams.get('hourly_rate_max') || '');
  // Nuovo stato per i servizi offerti
  const [currentOfferedServices, setCurrentOfferedServices] = useState<string[]>(searchParams.getAll('offered_services'));

  const [isFilterFormOpen, setIsFilterFormOpen] = useState(false); // State for collapsible filter form
  const [isOtherFiltersOpen, setIsOtherFiltersOpen] = useState(false); // NEW: State for the "Altri Filtri" collapsible
  const [isOfferedServicesPopoverOpen, setIsOfferedServicesPopoverOpen] = useState(false); // Nuovo stato per il popover dei servizi offerti
  const [isMeetingTypePopoverOpen, setIsMeetingTypePopoverOpen] = useState(false);
  const [isAvailabilityForPopoverOpen, setIsAvailabilityForPopoverOpen] = useState(false);
  const [isMeetingLocationPopoverOpen, setIsMeetingLocationPopoverOpen] = useState(false);

  // Nuovi stati per i popover dei filtri personali
  const [isAgeRangePopoverOpen, setIsAgeRangePopoverOpen] = useState(false);
  const [isEthnicityPopoverOpen, setIsEthnicityPopoverOpen] = useState(false);
  const [isNationalityPopoverOpen, setIsNationalityPopoverOpen] = useState(false);
  const [isBreastTypePopoverOpen, setIsBreastTypePopoverOpen] = useState(false);
  const [isHairColorPopoverOpen, setIsHairColorPopoverOpen] = useState(false);
  const [isBodyTypePopoverOpen, setIsBodyTypePopoverOpen] = useState(false);
  const [isEyeColorPopoverOpen, setIsEyeColorPopoverOpen] = useState(false);

  // Update local states when URL search params change (e.g., direct URL access or browser back/forward)
  useEffect(() => {
    setCurrentCategory(searchParams.get('category') || 'tutte');
    setCurrentCity(searchParams.get('city') || 'tutte');
    setCurrentKeyword(searchParams.get('keyword') || '');
    
    // Sincronizza lo stato dei filtri con i parametri URL all'avvio o al cambio URL
    setCurrentSelectedAgeRanges(searchParams.getAll('age_range')); // Usa age_range per multi-select
    setCurrentEthnicities(searchParams.getAll('ethnicity'));
    setCurrentNationalities(searchParams.getAll('nationality'));
    setCurrentBreastTypes(searchParams.getAll('breast_type'));
    setCurrentHairColors(searchParams.getAll('hair_color'));
    setCurrentBodyTypes(searchParams.getAll('body_type'));
    setCurrentEyeColors(searchParams.getAll('eye_color'));

    setCurrentMeetingTypes(searchParams.getAll('meeting_type'));
    setCurrentAvailabilityFor(searchParams.getAll('availability_for'));
    setCurrentMeetingLocations(searchParams.getAll('meeting_location'));
    setCurrentHourlyRateMin(searchParams.get('hourly_rate_min') || '');
    setCurrentHourlyRateMax(searchParams.get('hourly_rate_max') || '');
    setCurrentOfferedServices(searchParams.getAll('offered_services'));

    setCurrentPage(parseInt(searchParams.get('page') || '1', 10));
  }, [searchParams]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    const categoryParam = searchParams.get('category');
    const cityParam = searchParams.get('city');
    const keywordParam = searchParams.get('keyword');
    const ageRangeParams = searchParams.getAll('age_range'); // Usa age_range per multi-select
    const ethnicityParams = searchParams.getAll('ethnicity');
    const nationalityParams = searchParams.getAll('nationality');
    const breastTypeParams = searchParams.getAll('breast_type');
    const hairColorParams = searchParams.getAll('hair_color');
    const bodyTypeParams = searchParams.getAll('body_type');
    const eyeColorParams = searchParams.getAll('eye_color');
    const meetingTypeParams = searchParams.getAll('meeting_type');
    const availabilityForParams = searchParams.getAll('availability_for');
    const meetingLocationParams = searchParams.getAll('meeting_location');
    const hourlyRateMinParam = searchParams.get('hourly_rate_min');
    const hourlyRateMaxParam = searchParams.get('hourly_rate_max');
    const offeredServicesParams = searchParams.getAll('offered_services'); // Nuovo parametro
    const pageParam = parseInt(searchParams.get('page') || '1', 10);

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
      `, { count: 'exact' })
      .gt('expires_at', new Date().toISOString())
      .eq('is_paused', false); // Only show non-paused listings

    if (categoryParam && categoryParam !== 'tutte') {
      query = query.eq('category', categoryParam);
    }
    if (cityParam && cityParam !== 'tutte') {
      query = query.eq('city', cityParam);
    }
    if (keywordParam) {
      query = query.or(`title.ilike.%${keywordParam}%,description.ilike.%${keywordParam}%`);
    }
    
    // Logica per la fascia d'età (multi-select)
    if (ageRangeParams.length > 0) {
      const ageConditions = ageRangeParams.map(rangeValue => {
        const range = ageRanges.find(r => r.value === rangeValue);
        if (range) {
          if (range.max === null) { // +46 anni
            return `(age.gte.${range.min})`;
          } else {
            return `(age.gte.${range.min},age.lte.${range.max})`;
          }
        }
        return ''; // Should not happen if ageRanges are valid
      }).filter(Boolean); // Remove empty strings

      if (ageConditions.length > 0) {
        query = query.or(ageConditions.join(','));
      }
    }

    // Modificato per usare `overlaps` per i campi array
    if (ethnicityParams.length > 0) {
      query = query.overlaps('ethnicity', ethnicityParams);
    }
    if (nationalityParams.length > 0) {
      query = query.overlaps('nationality', nationalityParams);
    }
    if (breastTypeParams.length > 0) {
      query = query.overlaps('breast_type', breastTypeParams);
    }
    if (hairColorParams.length > 0) {
      query = query.overlaps('hair_color', hairColorParams);
    }
    if (bodyTypeParams.length > 0) {
      query = query.overlaps('body_type', bodyTypeParams);
    }
    if (eyeColorParams.length > 0) {
      query = query.overlaps('eye_color', eyeColorParams);
    }
    // Nuovi filtri per array (usiamo `cs` per "contains string" o `ov` per "overlaps")
    if (meetingTypeParams.length > 0) {
      query = query.overlaps('meeting_type', meetingTypeParams);
    }
    if (availabilityForParams.length > 0) {
      query = query.overlaps('availability_for', availabilityForParams);
    }
    if (meetingLocationParams.length > 0) {
      query = query.overlaps('meeting_location', meetingLocationParams);
    }
    if (hourlyRateMinParam) {
      query = query.gte('hourly_rate', parseFloat(hourlyRateMinParam));
    }
    if (hourlyRateMaxParam) {
      query = query.lte('hourly_rate', parseFloat(hourlyRateMaxParam));
    }
    if (offeredServicesParams.length > 0) { // Applica il nuovo filtro
      query = query.overlaps('offered_services', offeredServicesParams);
    }

    // Updated sorting logic
    query = query
      .order('is_paused', { ascending: true }) // Non-paused first
      .order('is_premium', { ascending: false }) // Premium first
      .order('promotion_end_at', { ascending: false }) // More active promotions first
      .order('last_bumped_at', { ascending: false }) // Recently bumped/created first
      .order('created_at', { ascending: false }); // Newest first as tie-breaker

    const from = (pageParam - 1) * LISTINGS_PER_PAGE;
    const to = from + LISTINGS_PER_PAGE - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error("SearchResults: Errore nella ricerca degli annunci:", error.message, error.details);
      setError("Si è verificato un errore durante la ricerca. Riprova più tardi.");
    } else {
      if (count !== null) {
        setTotalPages(Math.ceil(count / LISTINGS_PER_PAGE));
      }
      if (data) {
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
    }
    setLoading(false);
  }, [searchParams]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleApplyFilters = (page: number = 1) => {
    const newSearchParams = new URLSearchParams();
    if (currentCategory && currentCategory !== 'tutte') newSearchParams.append('category', currentCategory);
    if (currentCity && currentCity !== 'tutte') newSearchParams.append('city', currentCity);
    if (currentKeyword) newSearchParams.append('keyword', currentKeyword);
    
    // Logica per la fascia d'età (multi-select)
    currentSelectedAgeRanges.forEach(range => newSearchParams.append('age_range', range));

    currentEthnicities.forEach(eth => newSearchParams.append('ethnicity', eth));
    currentNationalities.forEach(nat => newSearchParams.append('nationality', nat));
    currentBreastTypes.forEach(bt => newSearchParams.append('breast_type', bt));
    currentHairColors.forEach(hc => newSearchParams.append('hair_color', hc));
    currentBodyTypes.forEach(bt => newSearchParams.append('body_type', bt));
    currentEyeColors.forEach(ec => newSearchParams.append('eye_color', ec));
    // Aggiungi i nuovi filtri
    currentMeetingTypes.forEach(type => newSearchParams.append('meeting_type', type));
    currentAvailabilityFor.forEach(avail => newSearchParams.append('availability_for', avail));
    currentMeetingLocations.forEach(loc => newSearchParams.append('meeting_location', loc));
    if (currentHourlyRateMin) newSearchParams.append('hourly_rate_min', currentHourlyRateMin);
    if (currentHourlyRateMax) newSearchParams.append('hourly_rate_max', currentHourlyRateMax);
    currentOfferedServices.forEach(service => newSearchParams.append('offered_services', service)); // Aggiungi il nuovo campo

    newSearchParams.append('page', String(page));
    navigate(`/search?${newSearchParams.toString()}`);
    setIsFilterFormOpen(false); // Close the collapsible after applying filters
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
      handleApplyFilters(page);
    }
  };

  const categories = [
    { value: 'donna-cerca-uomo', label: '👩‍❤️‍👨 Donna cerca Uomo' },
    { value: 'uomo-cerca-donna', label: '👨‍❤️‍👩 Uomo cerca Donna' },
    { value: 'coppie', label: '👩‍❤️‍💋‍👨 Coppie' },
    { value: 'uomo-cerca-uomo', label: '👨‍❤️‍👨 Uomo cerca Uomo' },
    { value: 'donna-cerca-donna', label: '👩‍❤️‍👩 Donna cerca Donna' },
  ];

  // Helper to get category label
  const getCategoryLabel = (value: string) => {
    const cat = categories.find(c => c.value === value);
    // Return only the text part of the label, removing emoji and first word
    return cat ? cat.label.substring(cat.label.indexOf(' ') + 1) : 'Tutte le categorie';
  };

  // Helper to get city label
  const getCityLabel = (value: string) => {
    const city = italianProvinces.find(p => p.label === value);
    return city ? city.label : 'Tutte le città';
  };

  const getEthnicityLabel = (value: string) => {
    const eth = ethnicities.find(e => e.value === value);
    return eth ? eth.label : null;
  };

  const getNationalityLabel = (value: string) => {
    const nat = nationalities.find(n => n.value === value);
    return nat ? nat.label : null;
  };

  const getBreastTypeLabel = (value: string) => {
    const bt = breastTypes.find(b => b.value === value);
    return bt ? bt.label : null;
  };

  const getHairColorLabel = (value: string) => {
    const hc = hairColors.find(h => h.value === value);
    return hc ? hc.label : null;
  };

  const getBodyTypeLabel = (value: string) => {
    const bt = bodyTypes.find(b => b.value === value);
    return bt ? bt.label : null;
  };

  const getEyeColorLabel = (value: string) => {
    const ec = eyeColors.find(e => e.value === value);
    return ec ? ec.label : null;
  };

  const getAgeRangeLabel = (value: string) => {
    const range = ageRanges.find(r => r.value === value);
    return range ? range.label : null;
  };

  const getMeetingTypeLabel = (value: string) => {
    const type = meetingTypeOptions.find(o => o.id === value);
    return type ? type.label : value;
  };

  const getAvailabilityForLabel = (value: string) => {
    const avail = availabilityForOptions.find(o => o.id === value);
    return avail ? avail.label : value;
  };

  const getMeetingLocationLabel = (value: string) => {
    const loc = meetingLocationOptions.find(o => o.id === value);
    return loc ? loc.label : value;
  };

  const getOfferedServiceLabel = (value: string) => {
    const service = offeredServicesOptions.find(o => o.id === value);
    return service ? service.label : value;
  };

  const handleMultiSelectChange = (
    _currentSelection: string[], // Renamed to _currentSelection to suppress TS6133
    setSelection: React.Dispatch<React.SetStateAction<string[]>>,
    itemId: string,
    checked: boolean
  ) => {
    setSelection(prev =>
      checked ? [...prev, itemId] : prev.filter(id => id !== itemId)
    );
  };

  const generateTitle = () => {
    let titleParts = ["Annunci Incontri"];
    if (currentCategory && currentCategory !== 'tutte') titleParts.push(getCategoryLabel(currentCategory));
    if (currentCity && currentCity !== 'tutte') titleParts.push(`a ${currentCity}`);
    if (currentKeyword) titleParts.push(`"${currentKeyword}"`);
    if (currentSelectedAgeRanges.length > 0) titleParts.push(currentSelectedAgeRanges.map(getAgeRangeLabel).filter(Boolean).join(', ')); // Filter Boolean
    return `${titleParts.join(' ')} | IncontriDolci`;
  };

  const generateDescription = () => {
    let description = "Cerca annunci di incontri e appuntamenti";
    if (currentCategory && currentCategory !== 'tutte') description += ` nella categoria "${getCategoryLabel(currentCategory)}"`;
    if (currentCity && currentCity !== 'tutte') description += ` nella città di ${currentCity}`;
    if (currentKeyword) description += ` per la parola chiave "${currentKeyword}"`;
    if (currentSelectedAgeRanges.length > 0) description += ` con età ${currentSelectedAgeRanges.map(getAgeRangeLabel).filter(Boolean).join(', ')}`; // Filter Boolean
    description += ". Trova la tua prossima relazione su IncontriDolci.";
    return description;
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      );
    }

    if (error) {
      return <p className="text-center text-red-500">{error}</p>;
    }

    if (listings.length === 0) {
      return (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-600 text-lg">Nessun annuncio trovato per la tua ricerca.</p>
          <Link to="/" className="mt-4 inline-block">
            <Button>Torna alla Home</Button>
          </Link>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {listings.map((listing) => (
          <ListingListItem 
            key={listing.id} 
            listing={listing} 
            allowNonPremiumImage={false} 
            isCompact={true}
            dateTypeToDisplay="created_at"
          />
        ))}
        {totalPages > 1 && (
          <Pagination className="pt-4 col-span-full">
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
    );
  };

  return (
    <div className="bg-gray-50 p-6 flex-grow">
      <Helmet>
        <title>{generateTitle()}</title>
        <meta name="description" content={generateDescription()} />
        <meta name="keywords" content={`incontri, annunci, ${currentKeyword || ''}, ${currentCategory || ''}, ${currentCity || ''}, appuntamenti, relazioni, single, bakeca incontri`} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-2 sm:px-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={handleNavigateBack} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            {getBackLinkText()}
          </Button>
          <h1 className="text-3xl font-bold">Risultati della ricerca</h1>
        </div>

        {/* Dynamic Filter Section - now collapsible */}
        <Card className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 mb-8">
          <Collapsible
            open={isFilterFormOpen}
            onOpenChange={setIsFilterFormOpen}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer py-2">
                <div className="flex flex-col items-start">
                  <h2 className="text-xl font-semibold text-gray-700">
                    Filtri di ricerca
                  </h2>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {currentCategory && currentCategory !== 'tutte' && (
                      <Badge variant="secondary" className="capitalize">
                        <Heart className="h-3 w-3 mr-1" /> {getCategoryLabel(currentCategory)}
                      </Badge>
                    )}
                    {currentCity && currentCity !== 'tutte' && (
                      <Badge variant="secondary" className="capitalize">
                        <MapPin className="h-3 w-3 mr-1" /> {getCityLabel(currentCity)}
                      </Badge>
                    )}
                    {currentKeyword && (
                      <Badge variant="secondary" className="capitalize">
                        <Search className="h-3 w-3 mr-1" /> "{currentKeyword}"
                      </Badge>
                    )}
                    {currentSelectedAgeRanges.length > 0 && (
                      <Badge variant="secondary" className="capitalize">
                        <User className="h-3 w-3 mr-1" /> {currentSelectedAgeRanges.map(getAgeRangeLabel).filter(Boolean).join(', ')}
                      </Badge>
                    )}
                    {currentEthnicities.length > 0 && (
                      <Badge variant="secondary" className="capitalize">
                        <Globe className="h-3 w-3 mr-1" /> {currentEthnicities.map(getEthnicityLabel).filter(Boolean).join(', ')}
                      </Badge>
                    )}
                    {currentNationalities.length > 0 && (
                      <Badge variant="secondary" className="capitalize">
                        <Globe className="h-3 w-3 mr-1" /> {currentNationalities.map(getNationalityLabel).filter(Boolean).join(', ')}
                      </Badge>
                    )}
                    {currentBreastTypes.length > 0 && (
                      <Badge variant="secondary" className="capitalize">
                        <Ruler className="h-3 w-3 mr-1" /> {currentBreastTypes.map(getBreastTypeLabel).filter(Boolean).join(', ')}
                      </Badge>
                    )}
                    {currentHairColors.length > 0 && (
                      <Badge variant="secondary" className="capitalize">
                        <Palette className="h-3 w-3 mr-1" /> {currentHairColors.map(getHairColorLabel).filter(Boolean).join(', ')}
                      </Badge>
                    )}
                    {currentBodyTypes.length > 0 && (
                      <Badge variant="secondary" className="capitalize">
                        <Ruler className="h-3 w-3 mr-1" /> {currentBodyTypes.map(getBodyTypeLabel).filter(Boolean).join(', ')}
                      </Badge>
                    )}
                    {currentEyeColors.length > 0 && (
                      <Badge variant="secondary" className="capitalize">
                        <Eye className="h-3 w-3 mr-1" /> {currentEyeColors.map(getEyeColorLabel).filter(Boolean).join(', ')}
                      </Badge>
                    )}
                    {currentMeetingTypes.length > 0 && (
                      <Badge variant="secondary" className="capitalize">
                        <Handshake className="h-3 w-3 mr-1" /> {currentMeetingTypes.map(getMeetingTypeLabel).filter(Boolean).join(', ')}
                      </Badge>
                    )}
                    {currentAvailabilityFor.length > 0 && (
                      <Badge variant="secondary" className="capitalize">
                        <Clock className="h-3 w-3 mr-1" /> {currentAvailabilityFor.map(getAvailabilityForLabel).filter(Boolean).join(', ')}
                      </Badge>
                    )}
                    {currentMeetingLocations.length > 0 && (
                      <Badge variant="secondary" className="capitalize">
                        <Home className="h-3 w-3 mr-1" /> {currentMeetingLocations.map(getMeetingLocationLabel).filter(Boolean).join(', ')}
                      </Badge>
                    )}
                    {(currentHourlyRateMin || currentHourlyRateMax) && (
                      <Badge variant="secondary" className="capitalize">
                        <Euro className="h-3 w-3 mr-1" /> Tariffa: {currentHourlyRateMin || 'Min'} - {currentHourlyRateMax || 'Max'}€
                      </Badge>
                    )}
                    {currentOfferedServices.length > 0 && (
                      <Badge variant="secondary" className="capitalize">
                        <Sparkles className="h-3 w-3 mr-1" /> {currentOfferedServices.map(getOfferedServiceLabel).filter(Boolean).join(', ')}
                      </Badge>
                    )}
                    {(!currentCategory || currentCategory === 'tutte') && 
                     (!currentCity || currentCity === 'tutte') && 
                     !currentKeyword &&
                     currentSelectedAgeRanges.length === 0 &&
                     currentEthnicities.length === 0 &&
                     currentNationalities.length === 0 &&
                     currentBreastTypes.length === 0 &&
                     currentHairColors.length === 0 &&
                     currentBodyTypes.length === 0 &&
                     currentEyeColors.length === 0 &&
                     currentMeetingTypes.length === 0 &&
                     currentAvailabilityFor.length === 0 &&
                     currentMeetingLocations.length === 0 &&
                     !currentHourlyRateMin &&
                     !currentHourlyRateMax &&
                     currentOfferedServices.length === 0 && (
                      <Badge variant="secondary">Tutti gli annunci</Badge>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  {isFilterFormOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  <span className="sr-only">Toggle filters</span>
                </Button>
              </div>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Separator className="my-4" />
              {/* Rimosso: <h3 className="text-lg font-semibold mb-4 text-gray-700">Modifica la tua ricerca</h3> */}
              <form onSubmit={(e) => { e.preventDefault(); handleApplyFilters(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Select value={currentCategory} onValueChange={setCurrentCategory}>
                      <SelectTrigger className="w-full pl-10">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tutte">Tutte le categorie</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Select value={currentCity} onValueChange={setCurrentCity}>
                      <SelectTrigger className="w-full pl-10">
                        <SelectValue placeholder="Città" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectItem value="tutte">Tutte le città</SelectItem>
                        {italianProvinces.map((province) => (
                          <SelectItem key={province.value} value={province.label}>
                            {province.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input 
                      type="text" 
                      placeholder="Parola chiave o zona..." 
                      className="w-full pl-10"
                      value={currentKeyword}
                      onChange={(e) => setCurrentKeyword(e.target.value)}
                    />
                  </div>
                </div>

                {/* NEW: Altri Filtri Collapsible */}
                <Collapsible
                  open={isOtherFiltersOpen}
                  onOpenChange={setIsOtherFiltersOpen}
                  className="w-full mt-4"
                >
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between cursor-pointer py-2">
                      <h3 className="text-lg font-semibold text-gray-700">Altri Filtri</h3>
                      <Button variant="ghost" size="sm" className="w-9 p-0">
                        {isOtherFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        <span className="sr-only">Toggle other filters</span>
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <Separator className="my-4" />
                    {/* Multi-select per la fascia d'età */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Popover open={isAgeRangePopoverOpen} onOpenChange={setIsAgeRangePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isAgeRangePopoverOpen}
                            className="w-full justify-between pl-10 relative"
                          >
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            {currentSelectedAgeRanges.length > 0
                              ? `${currentSelectedAgeRanges.length} selezionati`
                              : "Fascia d'età"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Cerca fascia d'età..." />
                            <CommandEmpty>Nessuna fascia d'età trovata.</CommandEmpty>
                            <CommandGroup>
                              <div className="max-h-60 overflow-y-auto">
                                {ageRanges.map((range) => {
                                  const isSelected = currentSelectedAgeRanges.includes(range.value);
                                  return (
                                    <CommandItem
                                      key={range.value}
                                      value={range.label}
                                      onSelect={() => {
                                        handleMultiSelectChange(currentSelectedAgeRanges, setCurrentSelectedAgeRanges, range.value, !isSelected);
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => handleMultiSelectChange(currentSelectedAgeRanges, setCurrentSelectedAgeRanges, range.value, checked as boolean)}
                                        className="mr-2"
                                      />
                                      {range.label}
                                      <CheckIcon
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  );
                                })}
                              </div>
                            </CommandGroup>
                            {currentSelectedAgeRanges.length > 0 && (
                              <>
                                <Separator className="my-2" />
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-center text-red-500 hover:text-red-600"
                                    onClick={() => setCurrentSelectedAgeRanges([])}
                                  >
                                    <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                  </Button>
                                </div>
                              </>
                            )}
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Multi-select per Origine */}
                      <Popover open={isEthnicityPopoverOpen} onOpenChange={setIsEthnicityPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isEthnicityPopoverOpen}
                            className="w-full justify-between pl-10 relative"
                          >
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            {currentEthnicities.length > 0
                              ? `${currentEthnicities.length} selezionati`
                              : "Origine"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Cerca origine..." />
                            <CommandEmpty>Nessuna origine trovata.</CommandEmpty>
                            <CommandGroup>
                              <div className="max-h-60 overflow-y-auto">
                                {ethnicities.map((option) => {
                                  const isSelected = currentEthnicities.includes(option.value);
                                  return (
                                    <CommandItem
                                      key={option.value}
                                      value={option.label}
                                      onSelect={() => {
                                        handleMultiSelectChange(currentEthnicities, setCurrentEthnicities, option.value, !isSelected);
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => handleMultiSelectChange(currentEthnicities, setCurrentEthnicities, option.value, checked as boolean)}
                                        className="mr-2"
                                      />
                                      {option.label}
                                      <CheckIcon
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  );
                                })}
                              </div>
                            </CommandGroup>
                            {currentEthnicities.length > 0 && (
                              <>
                                <Separator className="my-2" />
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-center text-red-500 hover:text-red-600"
                                    onClick={() => setCurrentEthnicities([])}
                                  >
                                    <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                  </Button>
                                </div>
                              </>
                            )}
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Multi-select per Nazionalità */}
                      <Popover open={isNationalityPopoverOpen} onOpenChange={setIsNationalityPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isNationalityPopoverOpen}
                            className="w-full justify-between pl-10 relative"
                          >
                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            {currentNationalities.length > 0
                              ? `${currentNationalities.length} selezionati`
                              : "Nazionalità"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Cerca nazionalità..." />
                            <CommandEmpty>Nessuna nazionalità trovata.</CommandEmpty>
                            <CommandGroup>
                              <div className="max-h-60 overflow-y-auto">
                                {nationalities.map((option) => {
                                  const isSelected = currentNationalities.includes(option.value);
                                  return (
                                    <CommandItem
                                      key={option.value}
                                      value={option.label}
                                      onSelect={() => {
                                        handleMultiSelectChange(currentNationalities, setCurrentNationalities, option.value, !isSelected);
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => handleMultiSelectChange(currentNationalities, setCurrentNationalities, option.value, checked as boolean)}
                                        className="mr-2"
                                      />
                                      {option.label}
                                      <CheckIcon
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  );
                                })}
                              </div>
                            </CommandGroup>
                            {currentNationalities.length > 0 && (
                              <>
                                <Separator className="my-2" />
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-center text-red-500 hover:text-red-600"
                                    onClick={() => setCurrentNationalities([])}
                                  >
                                    <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                  </Button>
                                </div>
                              </>
                            )}
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Multi-select per Tipo di Seno */}
                      <Popover open={isBreastTypePopoverOpen} onOpenChange={setIsBreastTypePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isBreastTypePopoverOpen}
                            className="w-full justify-between pl-10 relative"
                          >
                            <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            {currentBreastTypes.length > 0
                              ? `${currentBreastTypes.length} selezionati`
                              : "Tipo di Seno"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Cerca tipo di seno..." />
                            <CommandEmpty>Nessun tipo di seno trovato.</CommandEmpty>
                            <CommandGroup>
                              <div className="max-h-60 overflow-y-auto">
                                {breastTypes.map((option) => {
                                  const isSelected = currentBreastTypes.includes(option.value);
                                  return (
                                    <CommandItem
                                      key={option.value}
                                      value={option.label}
                                      onSelect={() => {
                                        handleMultiSelectChange(currentBreastTypes, setCurrentBreastTypes, option.value, !isSelected);
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => handleMultiSelectChange(currentBreastTypes, setCurrentBreastTypes, option.value, checked as boolean)}
                                        className="mr-2"
                                      />
                                      {option.label}
                                      <CheckIcon
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  );
                                })}
                              </div>
                            </CommandGroup>
                            {currentBreastTypes.length > 0 && (
                              <>
                                <Separator className="my-2" />
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-center text-red-500 hover:text-red-600"
                                    onClick={() => setCurrentBreastTypes([])}
                                  >
                                    <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                  </Button>
                                </div>
                              </>
                            )}
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Multi-select per Colore Capelli */}
                      <Popover open={isHairColorPopoverOpen} onOpenChange={setIsHairColorPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isHairColorPopoverOpen}
                            className="w-full justify-between pl-10 relative"
                          >
                            <Palette className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            {currentHairColors.length > 0
                              ? `${currentHairColors.length} selezionati`
                              : "Colore Capelli"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Cerca colore capelli..." />
                            <CommandEmpty>Nessun colore capelli trovato.</CommandEmpty>
                            <CommandGroup>
                              <div className="max-h-60 overflow-y-auto">
                                {hairColors.map((option) => {
                                  const isSelected = currentHairColors.includes(option.value);
                                  return (
                                    <CommandItem
                                      key={option.value}
                                      value={option.label}
                                      onSelect={() => {
                                        handleMultiSelectChange(currentHairColors, setCurrentHairColors, option.value, !isSelected);
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => handleMultiSelectChange(currentHairColors, setCurrentHairColors, option.value, checked as boolean)}
                                        className="mr-2"
                                      />
                                      {option.label}
                                      <CheckIcon
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  );
                                })}
                              </div>
                            </CommandGroup>
                            {currentHairColors.length > 0 && (
                              <>
                                <Separator className="my-2" />
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-center text-red-500 hover:text-red-600"
                                    onClick={() => setCurrentHairColors([])}
                                  >
                                    <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                  </Button>
                                </div>
                              </>
                            )}
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Multi-select per Corporatura */}
                      <Popover open={isBodyTypePopoverOpen} onOpenChange={setIsBodyTypePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isBodyTypePopoverOpen}
                            className="w-full justify-between pl-10 relative"
                          >
                            <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            {currentBodyTypes.length > 0
                              ? `${currentBodyTypes.length} selezionati`
                              : "Corporatura"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Cerca corporatura..." />
                            <CommandEmpty>Nessuna corporatura trovata.</CommandEmpty>
                            <CommandGroup>
                              <div className="max-h-60 overflow-y-auto">
                                {bodyTypes.map((option) => {
                                  const isSelected = currentBodyTypes.includes(option.value);
                                  return (
                                    <CommandItem
                                      key={option.value}
                                      value={option.label}
                                      onSelect={() => {
                                        handleMultiSelectChange(currentBodyTypes, setCurrentBodyTypes, option.value, !isSelected);
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => handleMultiSelectChange(currentBodyTypes, setCurrentBodyTypes, option.value, checked as boolean)}
                                        className="mr-2"
                                      />
                                      {option.label}
                                      <CheckIcon
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  );
                                })}
                              </div>
                            </CommandGroup>
                            {currentBodyTypes.length > 0 && (
                              <>
                                <Separator className="my-2" />
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-center text-red-500 hover:text-red-600"
                                    onClick={() => setCurrentBodyTypes([])}
                                  >
                                    <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                  </Button>
                                </div>
                              </>
                            )}
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Multi-select per Colore Occhi */}
                      <Popover open={isEyeColorPopoverOpen} onOpenChange={setIsEyeColorPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isEyeColorPopoverOpen}
                            className="w-full justify-between pl-10 relative"
                          >
                            <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            {currentEyeColors.length > 0
                              ? `${currentEyeColors.length} selezionati`
                              : "Colore Occhi"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Cerca colore occhi..." />
                            <CommandEmpty>Nessun colore occhi trovato.</CommandEmpty>
                            <CommandGroup>
                              <div className="max-h-60 overflow-y-auto">
                                {eyeColors.map((option) => {
                                  const isSelected = currentEyeColors.includes(option.value);
                                  return (
                                    <CommandItem
                                      key={option.value}
                                      value={option.label}
                                      onSelect={() => {
                                        handleMultiSelectChange(currentEyeColors, setCurrentEyeColors, option.value, !isSelected);
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => handleMultiSelectChange(currentEyeColors, setCurrentEyeColors, option.value, checked as boolean)}
                                        className="mr-2"
                                      />
                                      {option.label}
                                      <CheckIcon
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  );
                                })}
                              </div>
                            </CommandGroup>
                            {currentEyeColors.length > 0 && (
                              <>
                                <Separator className="my-2" />
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-center text-red-500 hover:text-red-600"
                                    onClick={() => setCurrentEyeColors([])}
                                  >
                                    <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                  </Button>
                                </div>
                              </>
                            )}
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <Separator className="my-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Filtri Incontro</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Multi-select per Tipologia di Incontro */}
                      <Popover open={isMeetingTypePopoverOpen} onOpenChange={setIsMeetingTypePopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isMeetingTypePopoverOpen}
                            className="w-full justify-between pl-10 relative"
                          >
                            <Handshake className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            {currentMeetingTypes.length > 0
                              ? `${currentMeetingTypes.length} selezionati`
                              : "Tipologia di Incontro"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Cerca tipologia..." />
                            <CommandEmpty>Nessuna tipologia trovata.</CommandEmpty>
                            <CommandGroup>
                              <div className="max-h-60 overflow-y-auto">
                                {meetingTypeOptions.map((option) => {
                                  const isSelected = currentMeetingTypes.includes(option.id);
                                  return (
                                    <CommandItem
                                      key={option.id}
                                      value={option.label}
                                      onSelect={() => {
                                        handleMultiSelectChange(currentMeetingTypes, setCurrentMeetingTypes, option.id, !isSelected);
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => handleMultiSelectChange(currentMeetingTypes, setCurrentMeetingTypes, option.id, checked as boolean)}
                                        className="mr-2"
                                      />
                                      {option.label}
                                      <CheckIcon
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  );
                                })}
                              </div>
                            </CommandGroup>
                            {currentMeetingTypes.length > 0 && (
                              <>
                                <Separator className="my-2" />
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-center text-red-500 hover:text-red-600"
                                    onClick={() => setCurrentMeetingTypes([])}
                                  >
                                    <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                  </Button>
                                </div>
                              </>
                            )}
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Multi-select per Disponibilità per */}
                      <Popover open={isAvailabilityForPopoverOpen} onOpenChange={setIsAvailabilityForPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isAvailabilityForPopoverOpen}
                            className="w-full justify-between pl-10 relative"
                          >
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            {currentAvailabilityFor.length > 0
                              ? `${currentAvailabilityFor.length} selezionati`
                              : "Disponibilità per"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Cerca disponibilità..." />
                            <CommandEmpty>Nessuna disponibilità trovata.</CommandEmpty>
                            <CommandGroup>
                              <div className="max-h-60 overflow-y-auto">
                                {availabilityForOptions.map((option) => {
                                  const isSelected = currentAvailabilityFor.includes(option.id);
                                  return (
                                    <CommandItem
                                      key={option.id}
                                      value={option.label}
                                      onSelect={() => {
                                        handleMultiSelectChange(currentAvailabilityFor, setCurrentAvailabilityFor, option.id, !isSelected);
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => handleMultiSelectChange(currentAvailabilityFor, setCurrentAvailabilityFor, option.id, checked as boolean)}
                                        className="mr-2"
                                      />
                                      {option.label}
                                      <CheckIcon
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  );
                                })}
                              </div>
                            </CommandGroup>
                            {currentAvailabilityFor.length > 0 && (
                              <>
                                <Separator className="my-2" />
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-center text-red-500 hover:text-red-600"
                                    onClick={() => setCurrentAvailabilityFor([])}
                                  >
                                    <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                  </Button>
                                </div>
                              </>
                            )}
                          </Command>
                        </PopoverContent>
                      </Popover>

                      {/* Multi-select per Luogo Incontro */}
                      <Popover open={isMeetingLocationPopoverOpen} onOpenChange={setIsMeetingLocationPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isMeetingLocationPopoverOpen}
                            className="w-full justify-between pl-10 relative"
                          >
                            <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            {currentMeetingLocations.length > 0
                              ? `${currentMeetingLocations.length} selezionati`
                              : "Luogo Incontro"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Cerca luogo..." />
                            <CommandEmpty>Nessun luogo trovato.</CommandEmpty>
                            <CommandGroup>
                              <div className="max-h-60 overflow-y-auto">
                                {meetingLocationOptions.map((option) => {
                                  const isSelected = currentMeetingLocations.includes(option.id);
                                  return (
                                    <CommandItem
                                      key={option.id}
                                      value={option.label}
                                      onSelect={() => {
                                        handleMultiSelectChange(currentMeetingLocations, setCurrentMeetingLocations, option.id, !isSelected);
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => handleMultiSelectChange(currentMeetingLocations, setCurrentMeetingLocations, option.id, checked as boolean)}
                                        className="mr-2"
                                      />
                                      {option.label}
                                      <CheckIcon
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  );
                                })}
                              </div>
                            </CommandGroup>
                            {currentMeetingLocations.length > 0 && (
                              <>
                                <Separator className="my-2" />
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-center text-red-500 hover:text-red-600"
                                    onClick={() => setCurrentMeetingLocations([])}
                                  >
                                    <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                  </Button>
                                </div>
                              </>
                            )}
                          </Command>
                        </PopoverContent>
                      </Popover>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="relative">
                          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            type="number"
                            placeholder="Tariffa Min"
                            className="w-full pl-10"
                            value={currentHourlyRateMin}
                            onChange={(e) => setCurrentHourlyRateMin(e.target.value)}
                          />
                        </div>
                        <div className="relative">
                          <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          <Input
                            type="number"
                            placeholder="Tariffa Max"
                            className="w-full pl-10"
                            value={currentHourlyRateMax}
                            onChange={(e) => setCurrentHourlyRateMax(e.target.value)}
                          />
                        </div>
                      </div>
                      {/* Multi-select per Filtri Servizi Offerti */}
                      <Popover open={isOfferedServicesPopoverOpen} onOpenChange={setIsOfferedServicesPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isOfferedServicesPopoverOpen}
                            className="w-full justify-between pl-10 relative"
                          >
                            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                            {currentOfferedServices.length > 0
                              ? `${currentOfferedServices.length} selezionati`
                              : "Servizi Offerti"}
                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0">
                          <Command>
                            <CommandInput placeholder="Cerca servizio..." />
                            <CommandEmpty>Nessun servizio trovato.</CommandEmpty>
                            <CommandGroup>
                              <div className="max-h-60 overflow-y-auto">
                                {offeredServicesOptions.map((option) => {
                                  const isSelected = currentOfferedServices.includes(option.id);
                                  return (
                                    <CommandItem
                                      key={option.id}
                                      value={option.label}
                                      onSelect={() => {
                                        handleMultiSelectChange(currentOfferedServices, setCurrentOfferedServices, option.id, !isSelected);
                                      }}
                                      className="flex items-center cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={isSelected}
                                        onCheckedChange={(checked) => handleMultiSelectChange(currentOfferedServices, setCurrentOfferedServices, option.id, checked as boolean)}
                                        className="mr-2"
                                      />
                                      {option.label}
                                      <CheckIcon
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  );
                                })}
                              </div>
                            </CommandGroup>
                            {currentOfferedServices.length > 0 && (
                              <>
                                <Separator className="my-2" />
                                <div className="p-2">
                                  <Button
                                    variant="ghost"
                                    className="w-full justify-center text-red-500 hover:text-red-600"
                                    onClick={() => setCurrentOfferedServices([])}
                                  >
                                    <X className="h-4 w-4 mr-2" /> Deseleziona tutto
                                  </Button>
                                </div>
                              </>
                            )}
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                {/* END NEW: Altri Filtri Collapsible */}

                <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-lg py-6 mt-4">
                  Applica Filtri
                </Button>
              </form>
            </CollapsibleContent>
          </Collapsible>
        </Card>

        {renderContent()}
      </div>
    </div>
  );
};

export default SearchResults;