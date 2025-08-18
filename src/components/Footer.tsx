import { Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-gray-100 border-t">
      <div className="container mx-auto px-4 py-6 text-center text-gray-600">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Heart className="h-5 w-5 text-rose-500" />
          <p className="font-semibold">Dolci Incontri</p>
        </div>
        <p className="text-sm">
          © {new Date().getFullYear()} Dolci Incontri. Tutti i diritti riservati.
        </p>
      </div>
    </footer>
  );
};