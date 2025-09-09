import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { italianProvinces } from '@/data/provinces';
import { Heart, MapPin, Search, Globe, Palette, Ruler, Eye, ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PWAInstallInstructions } from '@/components/PWAInstallInstructions';
import { Helmet } from 'react-helmet-async';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface IndexProps {
  session: any;
}

export default function Index({ session }: IndexProps) {
  const [category, setCategory] = useState('tutte');
  const [city, setCity] = useState('tutte');
  const [keyword, setKeyword] = useState('');
  const [ethnicity, setEthnicity] = useState('tutte');
  const [nationality, setNationality] = useState('tutte');
  const [breastType, setBreastType] = useState('tutte');
  const [hairColor, setHairColor] = useState('tutte');
  const [bodyType, setBodyType] = useState('tutte');
  const [eyeColor, setEyeColor] = useState('tutte');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isPersonalFiltersOpen, setIsPersonalFiltersOpen] = useState(false);

  useEffect(() => {
    const referrerCode = searchParams.get('ref');
    if (referrerCode) {
      localStorage.setItem('referrer_code', referrerCode);
      console.log('Referrer code stored in localStorage:', referrerCode);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('ref');
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const searchParams = new URLSearchParams();
    if (category && category !== 'tutte') searchParams.append('category', category);
    if (city && city !== 'tutte') searchParams.append('city', city);
    if (keyword) searchParams.append('keyword', keyword);
    if (ethnicity && ethnicity !== 'tutte') searchParams.append('ethnicity', ethnicity);
    if (nationality && nationality !== 'tutte') searchParams.append('nationality', nationality);
    if (breastType && breastType !== 'tutte') searchParams.append('breast_type', breastType);
    if (hairColor && hairColor !== 'tutte') searchParams.append('hair_color', hairColor);
    if (bodyType && bodyType !== 'tutte') searchParams.append('body_type', bodyType);
    if (eyeColor && eyeColor !== 'tutte') searchParams.append('eye_color', eyeColor);
    
    navigate(`/search?${searchParams.toString()}`);
    setIsPersonalFiltersOpen(false);
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

  const hasActivePersonalFilters = 
    (ethnicity && ethnicity !== 'tutte') ||
    (nationality && nationality !== 'tutte') ||
    (breastType && breastType !== 'tutte') ||
    (hairColor && hairColor !== 'tutte') ||
    (bodyType && bodyType !== 'tutte') ||
    (eyeColor && eyeColor !== 'tutte');

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
                  <Select defaultValue="tutte" onValueChange={setCategory}>
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
                  <Select defaultValue="tutte" onValueChange={setCity}>
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
                className="w-full"
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer py-2">
                    <div className="flex flex-col items-start">
                      <h3 className="text-xl font-semibold text-gray-700">
                        Filtri
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-1">
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
                            <Palette className="h-3 w-3 mr-1" /> {getBreastTypeLabel(breastType)}
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
                        {!hasActivePersonalFilters && (
                          <Badge variant="secondary">Tutti i dettagli personali</Badge>
                        )}
                      </div>
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="w-9 p-0"> {/* Aggiunto type="button" */}
                      {isPersonalFiltersOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      <span className="sr-only">Toggle personal filters</span>
                    </Button>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Separator className="my-4" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Select defaultValue="tutte" onValueChange={setEthnicity}>
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
                      <Select defaultValue="tutte" onValueChange={setNationality}>
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
                      <Palette className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Select defaultValue="tutte" onValueChange={setBreastType}>
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
                      <Select defaultValue="tutte" onValueChange={setHairColor}>
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
                      <Select defaultValue="tutte" onValueChange={setBodyType}>
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
                      <Select defaultValue="tutte" onValueChange={setEyeColor}>
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
                </CollapsibleContent>
              </Collapsible>
              
              <Button type="submit" className="w-full bg-rose-500 hover:bg-rose-600 text-white text-lg py-6">
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
            <div className="grid grid-cols-1 sm:grid-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
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