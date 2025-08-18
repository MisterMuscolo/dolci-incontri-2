import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const ProfileSettings = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">Impostazioni Profilo</h1>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-700">
            Questa è la pagina per modificare le impostazioni del tuo profilo.
            La funzionalità non è ancora stata implementata.
          </p>
          <Link to="/dashboard" className="mt-6 inline-block">
            <Button variant="outline">Torna alla Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;