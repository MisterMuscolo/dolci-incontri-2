import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { italianProvinces } from '@/data/provinces';

interface IndexProps {
  session: any;
}

export default function Index({ session }: IndexProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-100">
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl font-bold text-purple-800 mb-6">
          Incontri Birichini Anonimi
        </h1>
        
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* Campo di ricerca */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Cerca annunci</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="donna-cerca-uomo">👩‍❤️‍👨 Donna cerca Uomo</SelectItem>
                    <SelectItem value="uomo-cerca-donna">👨‍❤️‍👩 Uomo cerca Donna</SelectItem>
                    <SelectItem value="coppie">👩‍❤️‍💋‍👨 Coppie</SelectItem>
                    <SelectItem value="uomo-cerca-uomo">👨‍❤️‍👨 Uomo cerca Uomo</SelectItem>
                    <SelectItem value="donna-cerca-donna">👩‍❤️‍👩 Donna cerca Donna</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Città" />
                  </SelectTrigger>
                  <SelectContent>
                    {italianProvinces.map((province) => (
                      <SelectItem key={province.value} value={province.value}>
                        {province.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input type="text" placeholder="Parola chiave..." />
                <Input type="text" placeholder="Zona (es. Centro, Stazione...)" />
              </div>
              <Button className="w-full">Cerca</Button>
            </div>
          </div>

          {/* Pulsanti login/registrazione */}
          <div className="flex justify-center space-x-4 pt-4">
            {!session ? (
              <>
                <Link to="/auth?tab=login">
                  <Button variant="outline">Accedi</Button>
                </Link>
                <Link to="/auth?tab=register">
                  <Button>Registrati</Button>
                </Link>
              </>
            ) : (
              <Link to="/dashboard">
                <Button>La tua Dashboard</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}