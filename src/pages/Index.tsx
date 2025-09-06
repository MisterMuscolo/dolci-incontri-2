import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { italianProvinces } from '@/data/provinces';
import { Heart, MapPin, Search } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { PWAInstallInstructions } from '@/components/PWAInstallInstructions';
import { Helmet } from 'react-helmet-async';

interface IndexProps {
  session: any;
}

export default function Index({ session }: IndexProps) {
  const [category, setCategory] = useState('tutte');
  const [city, setCity] = useState('tutte');
  const [keyword, setKeyword] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // Ottieni i parametri di ricerca

  useEffect(() => {
    const referrerCode = searchParams.get('ref');
    if (referrerCode) {
      // Memorizza il codice referral in localStorage
      localStorage.setItem('referrer_code', referrerCode);
      console.log('Referrer code stored in localStorage:', referrerCode);
      // Rimuovi il parametro 'ref' dall'URL per pulizia, senza ricaricare la pagina
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
    
    navigate(`/search?${searchParams.toString()}`);
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

  return (
    <>
      <Helmet>
        <title>IncontriDolci: Annunci Incontri, Appuntamenti e Relazioni in Italia</title>
        <meta name="description" content="Trova il tuo incontro ideale su IncontriDolci. Annunci per donna cerca uomo, uomo cerca donna, coppie e altro. Incontri autentici e appuntamenti seri in tutte le città italiane." />
        <meta name="keywords" content="incontri, annunci incontri, sito incontri, appuntamenti, relazioni, amore, single, donna cerca uomo, uomo cerca donna, coppie, incontri Milano, incontri Roma, incontri Torino, incontri Napoli, bakeca incontri" />
      </Helmet>
      <div className="bg-gradient-to-br from-rose-100 via-white to-sky-100">
        <div className="container mx-auto px-4 py-16 text-center">
          {/* Rimosso i pulsanti di download */}

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
                    onChange={(e) => setKeyword(e.target.value)} {/* Correzione qui */}
                  />
                </div>
              </div>
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
                // Rimosso il pulsante "Vai alla tua Dashboard"
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