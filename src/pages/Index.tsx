import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

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
              {/* Qui andrà il form di ricerca */}
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