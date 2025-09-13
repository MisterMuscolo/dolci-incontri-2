import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { italianProvinces } from '@/data/provinces';
import { Heart, MapPin, Search, Globe, Palette, Ruler, Eye, ChevronDown, ChevronUp, RotateCcw, User, Handshake, Clock, Home, Euro, Sparkles, CheckIcon, X } from 'lucide-react'; // Aggiunte icone per i nuovi filtri
import { Card, CardContent } from '@/components/ui/card';
import { PWAInstallInstructions } from '@/components/PWAInstallInstructions';
import { Helmet } from 'react-helmet-async';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox'; // Importa Checkbox
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface IndexProps {
  session: any;
}

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
  { id: 'altro', 'label': 'Altro' },
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

export default function Index({ session }: IndexProps) {
  const [category, setCategory] = useState('tutte');
  const [city, setCity] = useState('tutte');
  const [keyword, setKeyword] = useState('');
  const [selectedAgeRanges, setSelectedAgeRanges] = useState<string[]>([]); // Modificato a array
  const [selectedEthnicities, setSelectedEthnicities] = useState<string[]>([]); // Modificato a array
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>([]); // Modificato a array
  const [selectedBreastTypes, setSelectedBreastTypes] = useState<string[]>([]); // Modificato a array
  const [selectedHairColors, setSelectedHairColors] = useState<string[]>([]); // Modificato a array
  const [selectedBodyTypes, setSelectedBodyTypes] = useState<string[]>([]); // Modificato a array
  const [selectedEyeColors, setSelectedEyeColors] = useState<string[]>([]); // Modificato a array
  // Nuovi stati per i filtri di incontro
  const [selectedMeetingTypes, setSelectedMeetingTypes] = useState<string[]>([]);
  const [selectedAvailabilityFor, setSelectedAvailabilityFor] = useState<string[]>([]);
  const [selectedMeetingLocations, setSelectedMeetingLocations] = useState<string[]>([]);
  const [hourlyRateMin, setHourlyRateMin] = useState<string>('');
  const [hourlyRateMax, setHourlyRateMax] = useState<string>('');
  // Nuovo stato per i servizi offerti
  const [selectedOfferedServices, setSelectedOfferedServices] = useState<string[]>([]);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isPersonalFiltersOpen, setIsPersonalFiltersOpen] = useState(false);
  const [isOfferedServicesPopoverOpen, setIsOfferedServicesPopoverOpen] = useState(false); // Nuovo stato per il popover dei servizi offerti
  const [isMeetingTypePopoverOpen, setIsMeetingTypePopoverOpen] = useState(false);
  const [isAvailabilityForPopoverOpen, setIsAvailabilityForPopoverOpen] = useState(false);
  const [isMeetingLocationPopoverOpen, setIsMeetingLocationPopoverOpen] = useState(false);

  // Nuovi stati per i popover dei filtri personali
  const [isAgeRangePopoverOpen, setIsAgeRangePopoverOpen] = useState(false);
  const [isEthnicityPopoverOpen, setIsEthnicityPopoverOpen] = useState(false);
  const [isNationalityPopoverOpen, setIsOpenNationalityPopover] = useState(false);
  const [isBreastTypePopoverOpen, setIsBreastTypePopoverOpen] = useState(false);
  const [isHairColorPopoverOpen, setIsHairColorPopoverOpen] = useState(false);
  const [isBodyTypePopoverOpen, setIsBodyTypePopoverOpen] = useState(false);
  const [isEyeColorPopoverOpen, setIsEyeColorPopoverOpen] = useState(false);


  useEffect(() => {
    const referrerCode = searchParams.get('ref');
    if (referrerCode) {
      localStorage.setItem('referrer_code', referrerCode);
      console.log('Referrer code stored in localStorage:', referrerCode);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('ref');
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }

    // Sincronizza lo stato dei filtri con i parametri URL all'avvio o al cambio URL
    setSelectedAgeRanges(searchParams.getAll('age_range')); // Usa age_range per multi-select
    setSelectedEthnicities(searchParams.getAll('ethnicity'));
    setSelectedNationalities(searchParams.getAll('nationality'));
    setSelectedBreastTypes(searchParams.getAll('breast_type'));
    setSelectedHairColors(searchParams.getAll('hair_color'));
    setSelectedBodyTypes(searchParams.getAll('body_type'));
    setSelectedEyeColors(searchParams.getAll('eye_color'));

    setSelectedMeetingTypes(searchParams.getAll('meeting_type'));
    setSelectedAvailabilityFor(searchParams.getAll('availability_for'));
    setSelectedMeetingLocations(searchParams.getAll('meeting_location'));
    setHourlyRateMin(searchParams.get('hourly_rate_min') || '');
    setHourlyRateMax(searchParams.get('hourly_rate_max') || '');
    setSelectedOfferedServices(searchParams.getAll('offered_services'));

  }, [searchParams, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams();
    if (category && category !== 'tutte') searchParams.append('category', category);
    if (city && city !== 'tutte') searchParams.append('city', city);
    if (keyword) searchParams.append('keyword', keyword);
    
    // Logica per la fascia d'età (multi-select)
    selectedAgeRanges.forEach(range => searchParams.append('age_range', range));

    selectedEthnicities.forEach(eth => searchParams.append('ethnicity', eth));
    selectedNationalities.forEach(nat => searchParams.append('nationality', nat));
    selectedBreastTypes.forEach(bt => searchParams.append('breast_type', bt));
    selectedHairColors.forEach(hc => searchParams.append('hair_color', hc));
    selectedBodyTypes.forEach(bt => searchParams.append('body_type', bt));
    selectedEyeColors.forEach(ec => searchParams.append('eye_color', ec));
    
    // Aggiungi i nuovi filtri
    selectedMeetingTypes.forEach(type => searchParams.append('meeting_type', type));
    selectedAvailabilityFor.forEach(avail => searchParams.append('availability_for', avail));
    selectedMeetingLocations.forEach(loc => searchParams.append('meeting_location', loc));
    if (hourlyRateMin) searchParams.append('hourly_rate_min', hourlyRateMin);
    if (hourlyRateMax) searchParams.append('hourly_rate_max', hourlyRateMax);
    selectedOfferedServices.forEach(service => searchParams.append('offered_services', service)); // Aggiungi il nuovo campo

    navigate(`/search?${searchParams.toString()}`);
    setIsPersonalFiltersOpen(false);
  };

  const handleResetFilters = () => {
    setCategory('tutte');
    setCity('tutte');
    setKeyword('');
    setSelectedAgeRanges([]); // Resetta la fascia d'età
    setSelectedEthnicities([]);
    setSelectedNationalities([]);
    setSelectedBreastTypes([]);
    setSelectedHairColors([]);
    setSelectedBodyTypes([]);
    setSelectedEyeColors([]);
    // Resetta i nuovi filtri
    setSelectedMeetingTypes([]);
    setSelectedAvailabilityFor([]);
    setSelectedMeetingLocations([]);
    setHourlyRateMin('');
    setHourlyRateMax('');
    setSelectedOfferedServices([]); // Resetta il nuovo campo

    setIsPersonalFiltersOpen(false); // Chiudi la sezione filtri personali
    // Chiudi tutti i popover individuali
    setIsOfferedServicesPopoverOpen(false); 
    setIsMeetingTypePopoverOpen(false);
    setIsAvailabilityForPopoverOpen(false);
    setIsMeetingLocationPopoverOpen(false);
    setIsAgeRangePopoverOpen(false);
    setIsEthnicityPopoverOpen(false);
    setIsOpenNationalityPopover(false); // Corretto il nome della funzione
    setIsBreastTypePopoverOpen(false);
    setIsHairColorPopoverOpen(false);
    setIsBodyTypePopoverOpen(false);
    setIsEyeColorPopoverOpen(false);
    navigate('/'); // Naviga alla homepage senza parametri di ricerca
  };

  const handleCategoryCardClick = (selectedCategory: string) => {
    const searchParams = new URLSearchParams();
    searchParams.append('category', selectedCategory);
    navigate(`/search?${searchParams.toString()}`);
  };

  const categories = [
    { value: 'donna-cerca-uomo', label: '👩‍❤️‍👨 Donna cerca Uomo' },
    { value: 'uomo-cerca-donna', label: '👨‍❤️‍👩 Uomo cerca Donna' },
    { value: 'coppie', label: '👩‍❤️‍💋‍👨 Coppie' },
    { value: 'uomo-cerca-uomo', label: '👨‍❤️‍👨 Uomo cerca Uomo' },
    { value: 'donna-cerca-donna', label: '👩‍❤️‍👩 Donna cerca Donna' },
  ];

  // Helper functions to get labels for badges
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
    onChange: React.Dispatch<React.SetStateAction<string[]>>,
    currentSelection: string[],
    itemId: string,
    checked: boolean
  ) => {
    const newSelection = checked
      ? [...currentSelection, itemId.toLowerCase()] // Normalize to lowercase on add
      : currentSelection.filter(id => id.toLowerCase() !== itemId.toLowerCase()); // Normalize for comparison on remove
    onChange(newSelection);
  };

  const hasActivePersonalFilters = 
    selectedAgeRanges.length > 0 ||
    selectedEthnicities.length > 0 ||
    selectedNationalities.length > 0 ||
    selectedBreastTypes.length > 0 ||
    selectedHairColors.length > 0 ||
    selectedBodyTypes.length > 0 ||
    selectedEyeColors.length > 0 ||
    selectedMeetingTypes.length > 0 ||
    selectedAvailabilityFor.length > 0 ||
    selectedMeetingLocations.length > 0 ||
    hourlyRateMin !== '' ||
    hourlyRateMax !== '' ||
    selectedOfferedServices.length > 0;

  return (
    <>
      <Helmet>
        <title>IncontriDolci: Annunci Incontri, Appuntamenti e Relazioni in Italia</title>
        <meta name="description" content="Trova il tuo incontro ideale su IncontriDolci. Annunci per donna cerca uomo, uomo cerca donna, coppie e altro. Incontri autentici e appuntamenti seri in tutte le città italiane." />
        <meta name="keywords" content="incontri, annunci incontri, sito incontri, appuntamenti, relazioni, amore, single, donna cerca uomo, uomo cerca donna, coppie, incontri Milano, incontri Roma, incontri Torino, incontri Napoli, bakeca incontri" />
      </Helmet>
      <div className="bg-gradient-to-br from-rose-100 via-white to-sky-100">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold text-rose-600 mb-4">
            IncontriDolci
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Trova la tua complice avventura.
          </p>
          
          <div className="max-w-2xl mx-auto bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-6 text-gray-700">Cerca il tuo incontro ideale</h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Heart className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="w-full pl-10">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tutte">Tutte le categorie</SelectItem>
                      <SelectItem value="donna-cerca-uomo">👩‍❤️‍👨 Donna cerca Uomo</SelectItem>
                      <SelectItem value="donna-cerca-donna">👩‍❤️‍👩 Donna cerca Donna</SelectItem>
                      <SelectItem value="uomo-cerca-donna">👨‍❤️‍👩 Uomo cerca Donna</SelectItem>
                      <SelectItem value="uomo-cerca-uomo">👨‍❤️‍👨 Uomo cerca Uomo</SelectItem>
                      <SelectItem value="coppie">👩‍❤️‍💋‍👨 Coppie</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Select value={city} onValueChange={setCity}>
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
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                  />
                </div>
              </div>

              {/* Sezione Filtri Dettagli Personali (collassabile) */}
              <Collapsible
                open={isPersonalFiltersOpen}
                onOpenChange={setIsPersonalFiltersOpen}
                className="w-full mt-4"
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer py-2">
                    <div className="flex flex-col items-start">
                      <h3 className="text-xl font-semibold text-gray-700">
                        Filtri
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedAgeRanges.length > 0 && (
                          <Badge variant="secondary" className="capitalize">
                            <User className="h-3 w-3 mr-1" /> {selectedAgeRanges.map(getAgeRangeLabel).join(', ')}
                          </Badge>
                        )}
                        {selectedEthnicities.length > 0 && (
                          <Badge variant="secondary" className="capitalize">
                            <Globe className="h-3 w-3 mr-1" /> {selectedEthnicities.map(getEthnicityLabel).join(', ')}
                          </Badge>
                        )}
                        {selectedNationalities.length > 0 && (
                          <Badge variant="secondary" className="capitalize">
                            <Globe className="h-3 w-3 mr-1" /> {selectedNationalities.map(getNationalityLabel).join(', ')}
                          </Badge>
                        )}
                        {selectedBreastTypes.length > 0 && (
                          <Badge variant="secondary" className="capitalize">
                            <Ruler className="h-3 w-3 mr-1" /> {selectedBreastTypes.map(getBreastTypeLabel).join(', ')}
                          </Badge>
                        )}
                        {selectedHairColors.length > 0 && (
                          <Badge variant="secondary" className="capitalize">
                            <Palette className="h-3 w-3 mr-1" /> {selectedHairColors.map(getHairColorLabel).join(', ')}
                          </Badge>
                        )}
                        {selectedBodyTypes.length > 0 && (
                          <Badge variant="secondary" className="capitalize">
                            <Ruler className="h-3 w-3 mr-1" /> {selectedBodyTypes.map(getBodyTypeLabel).join(', ')}
                          </Badge>
                        )}
                        {selectedEyeColors.length > 0 && (
                          <Badge variant="secondary" className="capitalize">
                            <Eye className="h-3 w-3 mr-1" /> {selectedEyeColors.map(getEyeColorLabel).join(', ')}
                          </Badge>
                        )}
                        {selectedMeetingTypes.length > 0 && (
                          <Badge variant="secondary" className="capitalize">
                            <Handshake className="h-3 w-3 mr-1" /> {selectedMeetingTypes.map(getMeetingTypeLabel).join(', ')}
                          </Badge>
                        )}
                        {selectedAvailabilityFor.length > 0 && (
                          <Badge variant="secondary" className="capitalize">
                            <Clock className="h-3 w-3 mr-1" /> {selectedAvailabilityFor.map(getAvailabilityForLabel).join(', ')}
                          </Badge>
                        )}
                        {selectedMeetingLocations.length > 0 && (
                          <Badge variant="secondary" className="capitalize">
                            <Home className="h-3 w-3 mr-1" /> {selectedMeetingLocations.map(getMeetingLocationLabel).join(', ')}
                          </Badge>
                        )}
                        {(hourlyRateMin || hourlyRateMax) && (
                          <Badge variant="secondary" className="capitalize">
                            <Euro className="h-3 w-3 mr-1" /> Tariffa: {hourlyRateMin || 'Min'} - {hourlyRateMax || 'Max'}€
                          </Badge>
                        )}
                        {selectedOfferedServices.length > 0 && (
                          <Badge variant="secondary" className="capitalize">
                            <Sparkles className="h-3 w-3 mr-1" /> {selectedOfferedServices.map(getOfferedServiceLabel).join(', ')}
                          </Badge>
                        )}
                        {!hasActivePersonalFilters && (
                          <Badge variant="secondary">Tutti i dettagli personali</Badge>
                        )}
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="w-9 p-0">
                      {isPersonalFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="sr-only">Toggle personal filters</span>
                    </Button>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Multi-select per la fascia d'età */}
                    <Popover open={isAgeRangePopoverOpen} onOpenChange={setIsAgeRangePopoverOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isAgeRangePopoverOpen}
                          className="w-full justify-between pl-10 relative"
                        >
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          {selectedAgeRanges.length > 0
                            ? `${selectedAgeRanges.length} selezionati`
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
                                const isSelected = selectedAgeRanges.map(v => v.toLowerCase()).includes(range.value.toLowerCase());
                                return (
                                  <CommandItem
                                    key={range.value}
                                    value={range.label}
                                    onSelect={() => {
                                      handleMultiSelectChange(setSelectedAgeRanges, selectedAgeRanges, range.value, !isSelected);
                                    }}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => handleMultiSelectChange(setSelectedAgeRanges, selectedAgeRanges, range.value, checked as boolean)}
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
                          {selectedAgeRanges.length > 0 && (
                            <>
                              <Separator className="my-2" />
                              <div className="p-2">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-center text-red-500 hover:text-red-600"
                                  onClick={() => setSelectedAgeRanges([])}
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
                          {selectedEthnicities.length > 0
                            ? `${selectedEthnicities.length} selezionati`
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
                                const isSelected = selectedEthnicities.map(v => v.toLowerCase()).includes(option.value.toLowerCase());
                                return (
                                  <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                      handleMultiSelectChange(setSelectedEthnicities, selectedEthnicities, option.value, !isSelected);
                                    }}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => handleMultiSelectChange(setSelectedEthnicities, selectedEthnicities, option.value, checked as boolean)}
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
                          {selectedEthnicities.length > 0 && (
                            <>
                              <Separator className="my-2" />
                              <div className="p-2">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-center text-red-500 hover:text-red-600"
                                  onClick={() => setSelectedEthnicities([])}
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
                    <Popover open={isNationalityPopoverOpen} onOpenChange={setIsOpenNationalityPopover}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isNationalityPopoverOpen}
                          className="w-full justify-between pl-10 relative"
                        >
                          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                          {selectedNationalities.length > 0
                            ? `${selectedNationalities.length} selezionati`
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
                                const isSelected = selectedNationalities.map(v => v.toLowerCase()).includes(option.value.toLowerCase());
                                return (
                                  <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => {
                                      handleMultiSelectChange(setSelectedNationalities, selectedNationalities, option.value, !isSelected);
                                    }}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => handleMultiSelectChange(setSelectedNationalities, selectedNationalities, option.value, checked as boolean)}
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
                          {selectedNationalities.length > 0 && (
                            <>
                              <Separator className="my-2" />
                              <div className="p-2">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-center text-red-500 hover:text-red-600"
                                  onClick={() => setSelectedNationalities([])}
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
                          {selectedBreastTypes.length > 0
                            ? `${selectedBreastTypes.length} selezionati`
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
                                const isSelected = selectedBreastTypes.map(v => v.toLowerCase()).includes(option.value.toLowerCase());
                                return (
                                  <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => handleMultiSelectChange(setSelectedBreastTypes, selectedBreastTypes, option.value, !isSelected)}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => handleMultiSelectChange(setSelectedBreastTypes, selectedBreastTypes, option.value, checked as boolean)}
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
                          {selectedBreastTypes.length > 0 && (
                            <>
                              <Separator className="my-2" />
                              <div className="p-2">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-center text-red-500 hover:text-red-600"
                                  onClick={() => setSelectedBreastTypes([])}
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
                          {selectedHairColors.length > 0
                            ? `${selectedHairColors.length} selezionati`
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
                                const isSelected = selectedHairColors.map(v => v.toLowerCase()).includes(option.value.toLowerCase());
                                return (
                                  <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => handleMultiSelectChange(setSelectedHairColors, selectedHairColors, option.value, !isSelected)}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => handleMultiSelectChange(setSelectedHairColors, selectedHairColors, option.value, checked as boolean)}
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
                          {selectedHairColors.length > 0 && (
                            <>
                              <Separator className="my-2" />
                              <div className="p-2">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-center text-red-500 hover:text-red-600"
                                  onClick={() => setSelectedHairColors([])}
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
                          {selectedBodyTypes.length > 0
                            ? `${selectedBodyTypes.length} selezionati`
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
                                const isSelected = selectedBodyTypes.map(v => v.toLowerCase()).includes(option.value.toLowerCase());
                                return (
                                  <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => handleMultiSelectChange(setSelectedBodyTypes, selectedBodyTypes, option.value, !isSelected)}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => handleMultiSelectChange(setSelectedBodyTypes, selectedBodyTypes, option.value, checked as boolean)}
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
                          {selectedBodyTypes.length > 0 && (
                            <>
                              <Separator className="my-2" />
                              <div className="p-2">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-center text-red-500 hover:text-red-600"
                                  onClick={() => setSelectedBodyTypes([])}
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
                          {selectedEyeColors.length > 0
                            ? `${selectedEyeColors.length} selezionati`
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
                                const isSelected = selectedEyeColors.map(v => v.toLowerCase()).includes(option.value.toLowerCase());
                                return (
                                  <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={() => handleMultiSelectChange(setSelectedEyeColors, selectedEyeColors, option.value, !isSelected)}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => handleMultiSelectChange(setSelectedEyeColors, selectedEyeColors, option.value, checked as boolean)}
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
                          {selectedEyeColors.length > 0 && (
                            <>
                              <Separator className="my-2" />
                              <div className="p-2">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-center text-red-500 hover:text-red-600"
                                  onClick={() => setSelectedEyeColors([])}
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
                          {selectedMeetingTypes.length > 0
                            ? `${selectedMeetingTypes.length} selezionati`
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
                                const isSelected = selectedMeetingTypes.map(v => v.toLowerCase()).includes(option.id.toLowerCase());
                                return (
                                  <CommandItem
                                    key={option.id}
                                    value={option.label}
                                    onSelect={() => handleMultiSelectChange(setSelectedMeetingTypes, selectedMeetingTypes, option.id, !isSelected)}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => handleMultiSelectChange(setSelectedMeetingTypes, selectedMeetingTypes, option.id, checked as boolean)}
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
                          {selectedMeetingTypes.length > 0 && (
                            <>
                              <Separator className="my-2" />
                              <div className="p-2">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-center text-red-500 hover:text-red-600"
                                  onClick={() => setSelectedMeetingTypes([])}
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
                          {selectedAvailabilityFor.length > 0
                            ? `${selectedAvailabilityFor.length} selezionati`
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
                                const isSelected = selectedAvailabilityFor.map(v => v.toLowerCase()).includes(option.id.toLowerCase());
                                return (
                                  <CommandItem
                                    key={option.id}
                                    value={option.label}
                                    onSelect={() => handleMultiSelectChange(setSelectedAvailabilityFor, selectedAvailabilityFor, option.id, !isSelected)}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => handleMultiSelectChange(setSelectedAvailabilityFor, selectedAvailabilityFor, option.id, checked as boolean)}
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
                          {selectedAvailabilityFor.length > 0 && (
                            <>
                              <Separator className="my-2" />
                              <div className="p-2">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-center text-red-500 hover:text-red-600"
                                  onClick={() => setSelectedAvailabilityFor([])}
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
                          {selectedMeetingLocations.length > 0
                            ? `${selectedMeetingLocations.length} selezionati`
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
                                const isSelected = selectedMeetingLocations.map(v => v.toLowerCase()).includes(option.id.toLowerCase());
                                return (
                                  <CommandItem
                                    key={option.id}
                                    value={option.label}
                                    onSelect={() => handleMultiSelectChange(setSelectedMeetingLocations, selectedMeetingLocations, option.id, !isSelected)}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => handleMultiSelectChange(setSelectedMeetingLocations, selectedMeetingLocations, option.id, checked as boolean)}
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
                          {selectedMeetingLocations.length > 0 && (
                            <>
                              <Separator className="my-2" />
                              <div className="p-2">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-center text-red-500 hover:text-red-600"
                                  onClick={() => setSelectedMeetingLocations([])}
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
                          value={hourlyRateMin}
                          onChange={(e) => setHourlyRateMin(e.target.value)}
                        />
                      </div>
                      <div className="relative">
                        <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <Input
                          type="number"
                          placeholder="Tariffa Max"
                          className="w-full pl-10"
                          value={hourlyRateMax}
                          onChange={(e) => setHourlyRateMax(e.target.value)}
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
                          {selectedOfferedServices.length > 0
                            ? `${selectedOfferedServices.length} selezionati`
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
                                const isSelected = selectedOfferedServices.map(v => v.toLowerCase()).includes(option.id.toLowerCase());
                                return (
                                  <CommandItem
                                    key={option.id}
                                    value={option.label}
                                    onSelect={() => {
                                      handleMultiSelectChange(setSelectedOfferedServices, selectedOfferedServices, option.id, !isSelected);
                                    }}
                                    className="flex items-center cursor-pointer"
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      onCheckedChange={(checked) => handleMultiSelectChange(setSelectedOfferedServices, selectedOfferedServices, option.id, checked as boolean)}
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
                          {selectedOfferedServices.length > 0 && (
                            <>
                              <Separator className="my-2" />
                              <div className="p-2">
                                <Button
                                  variant="ghost"
                                  className="w-full justify-center text-red-500 hover:text-red-600"
                                  onClick={() => setSelectedOfferedServices([])}
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
                  <Button type="button" variant="outline" onClick={handleResetFilters} className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-800 text-lg py-6 mt-4">
                    <RotateCcw className="h-5 w-5 mr-2" /> Reset Filtri
                  </Button>
                </CollapsibleContent>
              </Collapsible>
              
              <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white text-lg py-6 mt-4">
                Cerca
              </Button>
            </form>
            
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
                <p className="text-gray-600">
                  Benvenuto! Esplora gli annunci o crea il tuo.
                </p>
              )}
            </div>
          </div>

          {/* Sezione per le categorie cliccabili */}
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Esplora per Categoria</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {categories.map((cat) => {
                return (
                  <Card 
                    key={cat.value} 
                    className="cursor-pointer hover:shadow-lg transition-shadow duration-200 bg-white/80 backdrop-blur-sm"
                    onClick={() => handleCategoryCardClick(cat.value)}
                  >
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="text-5xl mb-4">{cat.label.split(' ')[0]}</div>
                      <p className="text-lg font-semibold text-gray-700">{cat.label.substring(cat.label.indexOf(' ') + 1)}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
          
          {/* Nuova sezione per le istruzioni PWA, ora solo sulla homepage */}
          <PWAInstallInstructions />

        </div>
      </div>
    </>
  );
}