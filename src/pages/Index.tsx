import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { italianProvinces } from '@/data/provinces';
import { Heart, MapPin, Search, Globe, Palette, Ruler, Eye, ChevronDown, ChevronUp, RotateCcw, User, Handshake, Clock, Home, Euro, Sparkles } from 'lucide-react'; // Aggiunte icone per i nuovi filtri
import { Card, CardContent } from '@/components/ui/card';
import { PWAInstallInstructions } from '@/components/PWAInstallInstructions';
import { Helmet } from 'react-helmet-async';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox'; // Importa Checkbox

interface IndexProps {
  session: any;
}

const ageRanges = [
  { value: 'tutte', label: 'Tutte le età' },
  { value: '18-24', label: '18-24 anni' },
  { value: '25-36', label: '25-36 anni' },
  { value: '37-45', label: '37-45 anni' },
  { value: 'over45', label: '+46 anni' }, // Modificato il value
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
  const [selectedAgeRange, setSelectedAgeRange] = useState('tutte'); // Stato per la fascia d'età
  const [ethnicity, setEthnicity] = useState('tutte');
  const [nationality, setNationality] = useState('tutte');
  const [breastType, setBreastType] = useState('tutte');
  const [hairColor, setHairColor] = useState('tutte');
  const [bodyType, setBodyType] = useState('tutte');
  const [eyeColor, setEyeColor] = useState('tutte');
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
  const [isOfferedServicesFiltersOpen, setIsOfferedServicesFiltersOpen] = useState(false); // Nuovo stato per i servizi offerti

  useEffect(() => {
    const referrerCode = searchParams.get('ref');
    if (referrerCode) {
      localStorage.setItem('referrer_code', referrerCode);
      console.log('Referrer code stored in localStorage:', referrerCode);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('ref');
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }

    // Sincronizza lo stato del filtro età con i parametri URL all'avvio o al cambio URL
    const minAgeParam = searchParams.get('min_age');
    const maxAgeParam = searchParams.get('max_age');
    let initialAgeRange = 'tutte';
    if (minAgeParam && maxAgeParam) {
      initialAgeRange = `${minAgeParam}-${maxAgeParam}`;
    } else if (minAgeParam === '46' && !maxAgeParam) { // Gestisce il caso '+46 anni'
      initialAgeRange = 'over45';
    } else if (minAgeParam && !maxAgeParam) { // Caso generico per altri min_age senza max_age
      initialAgeRange = `${minAgeParam}+`;
    }
    
    // Validate if the constructed age range is actually one of the predefined ones
    const isValidAgeRange = ageRanges.some(range => range.value === initialAgeRange);
    if (!isValidAgeRange) {
      initialAgeRange = 'tutte'; // Fallback to 'tutte' if invalid
    }
    setSelectedAgeRange(initialAgeRange);

    // Sincronizza i nuovi filtri con i parametri URL
    setSelectedMeetingTypes(searchParams.getAll('meeting_type'));
    setSelectedAvailabilityFor(searchParams.getAll('availability_for'));
    setSelectedMeetingLocations(searchParams.getAll('meeting_location'));
    setHourlyRateMin(searchParams.get('hourly_rate_min') || '');
    setHourlyRateMax(searchParams.get('hourly_rate_max') || '');
    setSelectedOfferedServices(searchParams.getAll('offered_services')); // Sincronizza il nuovo campo

  }, [searchParams, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams();
    if (category && category !== 'tutte') searchParams.append('category', category);
    if (city && city !== 'tutte') searchParams.append('city', city);
    if (keyword) searchParams.append('keyword', keyword);
    
    // Logica per la fascia d'età
    if (selectedAgeRange && selectedAgeRange !== 'tutte') {
      if (selectedAgeRange === 'over45') { // Gestisce il nuovo valore 'over45'
        searchParams.append('min_age', '46');
      } else {
        const [min, max] = selectedAgeRange.split('-');
        searchParams.append('min_age', min);
        if (max && max !== '+') {
          searchParams.append('max_age', max);
        }
      }
    }

    if (ethnicity && ethnicity !== 'tutte') searchParams.append('ethnicity', ethnicity);
    if (nationality && nationality !== 'tutte') searchParams.append('nationality', nationality);
    if (breastType && breastType !== 'tutte') searchParams.append('breast_type', breastType);
    if (hairColor && hairColor !== 'tutte') searchParams.append('hair_color', hairColor);
    if (bodyType && bodyType !== 'tutte') searchParams.append('body_type', bodyType);
    if (eyeColor && eyeColor !== 'tutte') searchParams.append('eye_color', eyeColor);
    
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
    setSelectedAgeRange('tutte'); // Resetta la fascia d'età
    setEthnicity('tutte');
    setNationality('tutte');
    setBreastType('tutte');
    setHairColor('tutte');
    setBodyType('tutte');
    setEyeColor('tutte');
    // Resetta i nuovi filtri
    setSelectedMeetingTypes([]);
    setSelectedAvailabilityFor([]);
    setSelectedMeetingLocations([]);
    setHourlyRateMin('');
    setHourlyRateMax('');
    setSelectedOfferedServices([]); // Resetta il nuovo campo

    setIsPersonalFiltersOpen(false); // Chiudi la sezione filtri personali
    setIsOfferedServicesFiltersOpen(false); // Resetta anche il nuovo stato
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

  const handleOfferedServiceChange = (serviceId: string, checked: boolean) => {
    setSelectedOfferedServices(prev =>
      checked ? [...prev, serviceId] : prev.filter(id => id !== serviceId)
    );
  };

  const hasActivePersonalFilters = 
    (selectedAgeRange && selectedAgeRange !== 'tutte') || // Includi età nei filtri attivi
    (ethnicity && ethnicity !== 'tutte') ||
    (nationality && nationality !== 'tutte') ||
    (breastType && breastType !== 'tutte') ||
    (hairColor && hairColor !== 'tutte') ||
    (bodyType && bodyType !== 'tutte') ||
    (eyeColor && eyeColor !== 'tutte') ||
    selectedMeetingTypes.length > 0 ||
    selectedAvailabilityFor.length > 0 ||
    selectedMeetingLocations.length > 0 ||
    hourlyRateMin !== '' ||
    hourlyRateMax !== '' ||
    selectedOfferedServices.length > 0; // Includi il nuovo campo

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
                className="w-full mt-4" // Aggiunto mt-4 qui
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer py-2">
                    <div className="flex flex-col items-start">
                      <h3 className="text-xl font-semibold text-gray-700">
                        Filtri
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedAgeRange && selectedAgeRange !== 'tutte' && (
                          <Badge variant="secondary" className="capitalize">
                            <User className="h-3 w-3 mr-1" /> {getAgeRangeLabel(selectedAgeRange)}
                          </Badge>
                        )}
                        {ethnicity && ethnicity !== 'tutte' && (
                          <Badge variant="secondary" className="capitalize">
                            <Globe className="h-3 w-3 mr-1" /> {getEthnicityLabel(ethnicity)}
                          </Badge>
                        )}
                        {nationality && nationality !== 'tutte' && (
                          <Badge variant="secondary" className="capitalize">
                            <Globe className="h-3 w-3 mr-1" /> {getNationalityLabel(nationality)}
                          </Badge>
                        )}
                        {breastType && breastType !== 'tutte' && (
                          <Badge variant="secondary" className="capitalize">
                            <Ruler className="h-3 w-3 mr-1" /> {getBreastTypeLabel(breastType)}
                          </Badge>
                        )}
                        {hairColor && hairColor !== 'tutte' && (
                          <Badge variant="secondary" className="capitalize">
                            <Palette className="h-3 w-3 mr-1" /> {getHairColorLabel(hairColor)}
                          </Badge>
                        )}
                        {bodyType && bodyType !== 'tutte' && (
                          <Badge variant="secondary" className="capitalize">
                            <Ruler className="h-3 w-3 mr-1" /> {getBodyTypeLabel(bodyType)}
                          </Badge>
                        )}
                        {eyeColor && eyeColor !== 'tutte' && (
                          <Badge variant="secondary" className="capitalize">
                            <Eye className="h-3 w-3 mr-1" /> {getEyeColorLabel(eyeColor)}
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
                    {/* Campo per la fascia d'età */}
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Select value={selectedAgeRange} onValueChange={setSelectedAgeRange}>
                        <SelectTrigger className="w-full pl-10">
                          <SelectValue placeholder="Fascia d'età" />
                        </SelectTrigger>
                        <SelectContent>
                          {ageRanges.map((range) => (
                            <SelectItem key={range.value} value={range.value}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Select value={ethnicity} onValueChange={setEthnicity}>
                        <SelectTrigger className="w-full pl-10">
                          <SelectValue placeholder="Origine" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tutte">Tutte le origini</SelectItem>
                          {ethnicities.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Select value={nationality} onValueChange={setNationality}>
                        <SelectTrigger className="w-full pl-10">
                          <SelectValue placeholder="Nazionalità" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          <SelectItem value="tutte">Tutte le nazionalità</SelectItem>
                          {nationalities.map((n) => <SelectItem key={n.value} value={n.value}>{n.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Select value={breastType} onValueChange={setBreastType}>
                        <SelectTrigger className="w-full pl-10">
                          <SelectValue placeholder="Tipo di Seno" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tutte">Tutti i tipi di seno</SelectItem>
                          {breastTypes.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <Palette className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Select value={hairColor} onValueChange={setHairColor}>
                        <SelectTrigger className="w-full pl-10">
                          <SelectValue placeholder="Colore Capelli" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tutte">Tutti i colori di capelli</SelectItem>
                          {hairColors.map((h) => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Select value={bodyType} onValueChange={setBodyType}>
                        <SelectTrigger className="w-full pl-10">
                          <SelectValue placeholder="Corporatura" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tutte">Tutte le corporature</SelectItem>
                          {bodyTypes.map((b) => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Select value={eyeColor} onValueChange={setEyeColor}>
                        <SelectTrigger className="w-full pl-10">
                          <SelectValue placeholder="Colore Occhi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tutte">Tutti i colori di occhi</SelectItem>
                          {eyeColors.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">Filtri Incontro</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Handshake className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Select
                        value={selectedMeetingTypes.length > 0 ? selectedMeetingTypes[0] : 'tutte'}
                        onValueChange={(value) => setSelectedMeetingTypes(value === 'tutte' ? [] : [value])}
                      >
                        <SelectTrigger className="w-full pl-10">
                          <SelectValue placeholder="Tipologia di Incontro" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tutte">Tutte le tipologie</SelectItem>
                          {meetingTypeOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Select
                        value={selectedAvailabilityFor.length > 0 ? selectedAvailabilityFor[0] : 'tutte'}
                        onValueChange={(value) => setSelectedAvailabilityFor(value === 'tutte' ? [] : [value])}
                      >
                        <SelectTrigger className="w-full pl-10">
                          <SelectValue placeholder="Disponibilità per" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tutte">Tutte le disponibilità</SelectItem>
                          {availabilityForOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Select
                        value={selectedMeetingLocations.length > 0 ? selectedMeetingLocations[0] : 'tutte'}
                        onValueChange={(value) => setSelectedMeetingLocations(value === 'tutte' ? [] : [value])}
                      >
                        <SelectTrigger className="w-full pl-10">
                          <SelectValue placeholder="Luogo Incontro" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tutte">Tutti i luoghi</SelectItem>
                          {meetingLocationOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                  </div>
                  <Separator className="my-4" />
                  {/* Nuova Collapsible per Filtri Servizi Offerti */}
                  <Collapsible
                    open={isOfferedServicesFiltersOpen}
                    onOpenChange={setIsOfferedServicesFiltersOpen}
                    className="w-full mt-4" // Aggiunto mt-4 qui
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between cursor-pointer py-2">
                        <h3 className="text-lg font-semibold text-gray-700">Filtri Servizi Offerti</h3>
                        <Button type="button" variant="ghost" size="sm" className="w-9 p-0">
                          {isOfferedServicesFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          <span className="sr-only">Toggle offered services filters</span>
                        </Button>
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                        {offeredServicesOptions.map((option) => (
                          <div key={option.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`service-${option.id}`}
                              checked={selectedOfferedServices.includes(option.id)}
                              onCheckedChange={(checked) => handleOfferedServiceChange(option.id, checked as boolean)}
                            />
                            <label
                              htmlFor={`service-${option.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                  <Button type="button" variant="outline" onClick={handleResetFilters} className="w-full border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-800 text-lg py-6 mt-2">
                    <RotateCcw className="h-5 w-5 mr-2" /> Reset Filtri
                  </Button>
                </CollapsibleContent>
              </Collapsible>
              
              <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white text-lg py-6 mt-4"> {/* Aggiunto mt-4 qui */}
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