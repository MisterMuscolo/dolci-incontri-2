import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ListingListItem, Listing } from '@/components/ListingListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ChevronLeft, MapPin, Search, Heart, ChevronDown, ChevronUp, Globe, Palette, Ruler, Eye, User } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useDynamicBackLink } from '@/hooks/useDynamicBackLink';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { italianProvinces } from '@/data/provinces';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const LISTINGS_PER_PAGE = 10;

const ageRanges = [
  { value: 'tutte', label: 'Tutte le età' },
  { value: '18-24', label: '18-24 anni' },
  { value: '25-36', label: '25-36 anni' },
  { value: '37-45', label: '37-45 anni' },
  { value: '46+', label: '+46 anni' },
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
  const [currentSelectedAgeRange, setCurrentSelectedAgeRange] = useState('tutte'); // Nuovo stato per la fascia d'età
  const [currentEthnicity, setCurrentEthnicity] = useState(searchParams.get('ethnicity') || 'tutte');
  const [currentNationality, setCurrentNationality] = useState(searchParams.get('nationality') || 'tutte');
  const [currentBreastType, setCurrentBreastType] = useState(searchParams.get('breast_type') || 'tutte');
  const [currentHairColor, setCurrentHairColor] = useState(searchParams.get('hair_color') || 'tutte');
  const [currentBodyType, setCurrentBodyType] = useState(searchParams.get('body_type') || 'tutte');
  const [currentEyeColor, setCurrentEyeColor] = useState(searchParams.get('eye_color') || 'tutte');
  const [isFilterFormOpen, setIsFilterFormOpen] = useState(false); // State for collapsible filter form

  // Update local states when URL search params change (e.g., direct URL access or browser back/forward)
  useEffect(() => {
    setCurrentCategory(searchParams.get('category') || 'tutte');
    setCurrentCity(searchParams.get('city') || 'tutte');
    setCurrentKeyword(searchParams.get('keyword') || '');
    
    // Ricostruisci currentSelectedAgeRange dai parametri min_age e max_age
    const minAgeParam = searchParams.get('min_age');
    const maxAgeParam = searchParams.get('max_age');
    if (minAgeParam && maxAgeParam) {
      setCurrentSelectedAgeRange(`${minAgeParam}-${maxAgeParam}`);
    } else if (minAgeParam && !maxAgeParam) {
      setCurrentSelectedAgeRange(`${minAgeParam}+`);
    } else {
      setCurrentSelectedAgeRange('tutte');
    }

    setCurrentEthnicity(searchParams.get('ethnicity') || 'tutte');
    setCurrentNationality(searchParams.get('nationality') || 'tutte');
    setCurrentBreastType(searchParams.get('breast_type') || 'tutte');
    setCurrentHairColor(searchParams.get('hair_color') || 'tutte');
    setCurrentBodyType(searchParams.get('body_type') || 'tutte');
    setCurrentEyeColor(searchParams.get('eye_color') || 'tutte');
    setCurrentPage(parseInt(searchParams.get('page') || '1', 10));
  }, [searchParams]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    const categoryParam = searchParams.get('category');
    const cityParam = searchParams.get('city');
    const keywordParam = searchParams.get('keyword');
    const minAgeParam = searchParams.get('min_age');
    const maxAgeParam = searchParams.get('max_age');
    const ethnicityParam = searchParams.get('ethnicity');
    const nationalityParam = searchParams.get('nationality');
    const breastTypeParam = searchParams.get('breast_type');
    const hairColorParam = searchParams.get('hair_color');
    const bodyTypeParam = searchParams.get('body_type');
    const eyeColorParam = searchParams.get('eye_color');
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
        ethnicity,
        nationality,
        breast_type,
        hair_color,
        body_type,
        eye_color
      `, { count: 'exact' })
      .gt('expires_at', new Date().toISOString());
      // .eq('is_paused', false); // Rimosso il filtro is_paused per mostrare tutti gli annunci attivi, inclusi quelli riattivati

    if (categoryParam && categoryParam !== 'tutte') {
      query = query.eq('category', categoryParam);
    }
    if (cityParam && cityParam !== 'tutte') {
      query = query.eq('city', cityParam);
    }
    if (keywordParam) {
      query = query.or(`title.ilike.%${keywordParam}%,description.ilike.%${keywordParam}%`);
    }
    if (minAgeParam) {
      query = query.gte('age', parseInt(minAgeParam, 10));
    }
    if (maxAgeParam) {
      query = query.lte('age', parseInt(maxAgeParam, 10));
    }
    if (ethnicityParam && ethnicityParam !== 'tutte') {
      query = query.eq('ethnicity', ethnicityParam);
    }
    if (nationalityParam && nationalityParam !== 'tutte') {
      query = query.eq('nationality', nationalityParam);
    }
    if (breastTypeParam && breastTypeParam !== 'tutte') {
      query = query.eq('breast_type', breastTypeParam);
    }
    if (hairColorParam && hairColorParam !== 'tutte') {
      query = query.eq('hair_color', hairColorParam);
    }
    if (bodyTypeParam && bodyTypeParam !== 'tutte') {
      query = query.eq('body_type', bodyTypeParam);
    }
    if (eyeColorParam && eyeColorParam !== 'tutte') {
      query = query.eq('eye_color', eyeColorParam);
    }

    query = query
      .order('last_bumped_at', { ascending: false, nullsFirst: false })
      .order('promotion_end_at', { ascending: false, nullsFirst: true })
      .order('created_at', { ascending: false });

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
        const processedListings = data.map((listing: Listing) => ({
          ...listing,
          listing_photos: (listing.listing_photos || []).sort((a, b) => {
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
    
    // Logica per la fascia d'età
    if (currentSelectedAgeRange && currentSelectedAgeRange !== 'tutte') {
      const [min, max] = currentSelectedAgeRange.split('-');
      newSearchParams.append('min_age', min);
      if (max && max !== '+') {
        newSearchParams.append('max_age', max);
      }
    }

    if (currentEthnicity && currentEthnicity !== 'tutte') newSearchParams.append('ethnicity', currentEthnicity);
    if (currentNationality && currentNationality !== 'tutte') newSearchParams.append('nationality', currentNationality);
    if (currentBreastType && currentBreastType !== 'tutte') newSearchParams.append('breast_type', currentBreastType);
    if (currentHairColor && currentHairColor !== 'tutte') newSearchParams.append('hair_color', currentHairColor);
    if (currentBodyType && currentBodyType !== 'tutte') newSearchParams.append('body_type', currentBodyType);
    if (currentEyeColor && currentEyeColor !== 'tutte') newSearchParams.append('eye_color', currentEyeColor);
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
    return eth ? eth.label : 'Tutte le origini';
  };

  const getNationalityLabel = (value: string) => {
    const nat = nationalities.find(n => n.value === value);
    return nat ? nat.label : 'Tutte le nazionalità';
  };

  const getBreastTypeLabel = (value: string) => {
    const bt = breastTypes.find(b => b.value === value);
    return bt ? bt.label : 'Tutti i tipi di seno';
  };

  const getHairColorLabel = (value: string) => {
    const hc = hairColors.find(h => h.value === value);
    return hc ? hc.label : 'Tutti i colori di capelli';
  };

  const getBodyTypeLabel = (value: string) => {
    const bt = bodyTypes.find(b => b.value === value);
    return bt ? bt.label : 'Tutte le corporature';
  };

  const getEyeColorLabel = (value: string) => {
    const ec = eyeColors.find(e => e.value === value);
    return ec ? ec.label : 'Tutti i colori di occhi';
  };

  const getAgeRangeLabel = (value: string) => {
    const range = ageRanges.find(r => r.value === value);
    return range ? range.label : 'Tutte le età';
  };

  const generateTitle = () => {
    let titleParts = ["Annunci Incontri"];
    if (currentCategory && currentCategory !== 'tutte') titleParts.push(getCategoryLabel(currentCategory));
    if (currentCity && currentCity !== 'tutte') titleParts.push(`a ${currentCity}`);
    if (currentKeyword) titleParts.push(`"${currentKeyword}"`);
    if (currentSelectedAgeRange && currentSelectedAgeRange !== 'tutte') titleParts.push(getAgeRangeLabel(currentSelectedAgeRange));
    return `${titleParts.join(' ')} | IncontriDolci`;
  };

  const generateDescription = () => {
    let description = "Cerca annunci di incontri e appuntamenti";
    if (currentCategory && currentCategory !== 'tutte') description += ` nella categoria "${getCategoryLabel(currentCategory)}"`;
    if (currentCity && currentCity !== 'tutte') description += ` nella città di ${currentCity}`;
    if (currentKeyword) description += ` per la parola chiave "${currentKeyword}"`;
    if (currentSelectedAgeRange && currentSelectedAgeRange !== 'tutte') description += ` con età ${getAgeRangeLabel(currentSelectedAgeRange)}`;
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
                    {currentSelectedAgeRange && currentSelectedAgeRange !== 'tutte' && (
                      <Badge variant="secondary" className="capitalize">
                        <User className="h-3 w-3 mr-1" /> {getAgeRangeLabel(currentSelectedAgeRange)}
                      </Badge>
                    )}
                    {currentEthnicity && currentEthnicity !== 'tutte' && (
                      <Badge variant="secondary" className="capitalize">
                        <Globe className="h-3 w-3 mr-1" /> {getEthnicityLabel(currentEthnicity)}
                      </Badge>
                    )}
                    {currentNationality && currentNationality !== 'tutte' && (
                      <Badge variant="secondary" className="capitalize">
                        <Globe className="h-3 w-3 mr-1" /> {getNationalityLabel(currentNationality)}
                      </Badge>
                    )}
                    {currentBreastType && currentBreastType !== 'tutte' && (
                      <Badge variant="secondary" className="capitalize">
                        <Ruler className="h-3 w-3 mr-1" /> {getBreastTypeLabel(currentBreastType)}
                      </Badge>
                    )}
                    {currentHairColor && currentHairColor !== 'tutte' && (
                      <Badge variant="secondary" className="capitalize">
                        <Palette className="h-3 w-3 mr-1" /> {getHairColorLabel(currentHairColor)}
                      </Badge>
                    )}
                    {currentBodyType && currentBodyType !== 'tutte' && (
                      <Badge variant="secondary" className="capitalize">
                        <Ruler className="h-3 w-3 mr-1" /> {getBodyTypeLabel(currentBodyType)}
                      </Badge>
                    )}
                    {currentEyeColor && currentEyeColor !== 'tutte' && (
                      <Badge variant="secondary" className="capitalize">
                        <Eye className="h-3 w-3 mr-1" /> {getEyeColorLabel(currentEyeColor)}
                      </Badge>
                    )}
                    {(!currentCategory || currentCategory === 'tutte') && 
                     (!currentCity || currentCity === 'tutte') && 
                     !currentKeyword &&
                     (!currentSelectedAgeRange || currentSelectedAgeRange === 'tutte') &&
                     (!currentEthnicity || currentEthnicity === 'tutte') &&
                     (!currentNationality || currentNationality === 'tutte') &&
                     (!currentBreastType || currentBreastType === 'tutte') &&
                     (!currentHairColor || currentHairColor === 'tutte') &&
                     (!currentBodyType || currentBodyType === 'tutte') &&
                     (!currentEyeColor || currentEyeColor === 'tutte') && (
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
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Modifica la tua ricerca</h3>
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

                {/* Nuovo filtro per la fascia d'età */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Select value={currentSelectedAgeRange} onValueChange={setCurrentSelectedAgeRange}>
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
                </div>

                {/* Nuovi filtri per Dettagli Personali */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Select value={currentEthnicity} onValueChange={setCurrentEthnicity}>
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
                    <Select value={currentNationality} onValueChange={setCurrentNationality}>
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
                    <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" /> {/* Modificato qui */}
                    <Select value={currentBreastType} onValueChange={setCurrentBreastType}>
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
                    <Select value={currentHairColor} onValueChange={setCurrentHairColor}>
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
                    <Select value={currentBodyType} onValueChange={setCurrentBodyType}>
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
                    <Select value={currentEyeColor} onValueChange={setCurrentEyeColor}>
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

                <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-lg py-6">
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