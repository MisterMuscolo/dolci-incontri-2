import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ListingListItem, Listing } from '@/components/ListingListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { ChevronLeft, MapPin, Search, Heart, ChevronDown, ChevronUp } from 'lucide-react'; // Add ChevronDown, ChevronUp icons
import { Helmet } from 'react-helmet-async';
import { useDynamicBackLink } from '@/hooks/useDynamicBackLink';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { italianProvinces } from '@/data/provinces';
import { Card } from '@/components/ui/card'; // Ensure Card is imported
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'; // Import Collapsible components
import { Separator } from '@/components/ui/separator'; // Import Separator
import { Badge } from '@/components/ui/badge'; // Import Badge

const LISTINGS_PER_PAGE = 10;

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
  const [isFilterFormOpen, setIsFilterFormOpen] = useState(false); // State for collapsible filter form

  // Update local states when URL search params change (e.g., direct URL access or browser back/forward)
  useEffect(() => {
    setCurrentCategory(searchParams.get('category') || 'tutte');
    setCurrentCity(searchParams.get('city') || 'tutte');
    setCurrentKeyword(searchParams.get('keyword') || '');
    setCurrentPage(parseInt(searchParams.get('page') || '1', 10));
  }, [searchParams]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);

    const categoryParam = searchParams.get('category');
    const cityParam = searchParams.get('city');
    const keywordParam = searchParams.get('keyword');
    const pageParam = parseInt(searchParams.get('page') || '1', 10);

    let query = supabase
      .from('listings')
      .select(`
        id,
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
        is_paused, -- Nuovo campo
        paused_at, -- Nuovo campo
        remaining_expires_at_duration, -- Nuovo campo
        remaining_promotion_duration, -- Nuovo campo
        listing_photos ( url, original_url, is_primary )
      `, { count: 'exact' })
      .gt('expires_at', new Date().toISOString())
      .eq('is_paused', false); // Filtra gli annunci in pausa

    if (categoryParam && categoryParam !== 'tutte') {
      query = query.eq('category', categoryParam);
    }
    if (cityParam && cityParam !== 'tutte') {
      query = query.eq('city', cityParam);
    }
    if (keywordParam) {
      query = query.or(`title.ilike.%${keywordParam}%,description.ilike.%${keywordParam}%`);
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
        const processedListings = data.map(listing => ({
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

  const generateTitle = () => {
    let titleParts = ["Annunci Incontri"];
    if (currentCategory && currentCategory !== 'tutte') titleParts.push(getCategoryLabel(currentCategory));
    if (currentCity && currentCity !== 'tutte') titleParts.push(`a ${currentCity}`);
    if (currentKeyword) titleParts.push(`"${currentKeyword}"`);
    return `${titleParts.join(' ')} | IncontriDolci`;
  };

  const generateDescription = () => {
    let description = "Cerca annunci di incontri e appuntamenti";
    if (currentCategory && currentCategory !== 'tutte') description += ` nella categoria "${getCategoryLabel(currentCategory)}"`;
    if (currentCity && currentCity !== 'tutte') description += ` nella città di ${currentCity}`;
    if (currentKeyword) description += ` per la parola chiave "${currentKeyword}"`;
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
                    {(!currentCategory || currentCategory === 'tutte') && (!currentCity || currentCity === 'tutte') && !currentKeyword && (
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