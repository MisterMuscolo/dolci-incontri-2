import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

const RegistrationSuccess = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-100 via-white to-sky-100 p-4">
      <div className="text-center bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 max-w-md w-full space-y-6">
        <CheckCircle className="mx-auto h-20 w-20 text-green-500" />
        <h1 className="text-3xl font-bold text-gray-800">Registrazione Completata!</h1>
        <p className="text-lg text-gray-600">
          Grazie per esserti registrato. Ti abbiamo inviato un'email per verificare il tuo account.
          Per favore, controlla la tua casella di posta (anche la cartella spam).
        </p>
        <Link to="/auth?tab=login">
          <Button className="w-full bg-rose-500 hover:bg-rose-600">
            Vai alla pagina di accesso
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default RegistrationSuccess;