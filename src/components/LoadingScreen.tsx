import { Loader2, Heart } from 'lucide-react'; // Using Loader2 for a spinner

export const LoadingScreen = () => {
  console.log("Rendering LoadingScreen...");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-rose-100 via-white to-sky-100 text-gray-700">
      <div className="flex items-center space-x-3 mb-6">
        <Heart className="h-12 w-12 text-rose-500 animate-pulse" />
        <h1 className="text-4xl font-bold text-rose-600">IncontriDolci</h1>
      </div>
      <div className="flex items-center space-x-2 text-lg">
        <Loader2 className="h-6 w-6 animate-spin text-rose-500" />
        <span>Caricamento applicazione...</span>
      </div>
      <p className="mt-4 text-sm text-gray-500">Preparando la tua esperienza...</p>
    </div>
  );
};