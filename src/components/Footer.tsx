import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t">
      <div className="container mx-auto px-4 py-8 text-center text-gray-600">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Heart className="h-5 w-5 text-rose-500" />
          <p className="font-semibold">Dolci Incontri</p>
        </div>
        <p className="text-sm mb-4">
          Il portale per chi cerca emozioni autentiche.
        </p>
        
        <div className="flex justify-center gap-4 md:gap-6 mb-4 text-sm">
          <Link to="/termini" className="hover:text-rose-500 hover:underline">Termini e Condizioni</Link>
          <Link to="/privacy" className="hover:text-rose-500 hover:underline">Privacy Policy</Link>
          <Link to="/contatti" className="hover:text-rose-500 hover:underline">Contatti</Link>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Naviga in sicurezza e con rispetto. Non condividere mai informazioni personali sensibili.
        </p>

        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} Dolci Incontri. Tutti i diritti riservati.
        </p>
      </div>
    </footer>
  );
};