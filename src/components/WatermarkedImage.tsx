import React from 'react';
import { cn } from '@/lib/utils';
import { Heart } from 'lucide-react'; // Importa l'icona Heart

interface WatermarkedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  watermarkText?: React.ReactNode; // Cambiato il tipo per accettare JSX
  className?: string;
  imageClassName?: string; // Classi specifiche per l'elemento img
  watermarkClassName?: string; // Classi specifiche per la filigrana
}

export const WatermarkedImage = ({
  src,
  alt,
  watermarkText = ( // Il valore predefinito ora include l'icona Heart
    <div className="flex items-center justify-center gap-1"> {/* Ridotto il gap */}
      <Heart className="h-6 w-6" /> {/* Ridotto del 25% (da h-8 w-8) */}
      <span>IncontriDolci</span>
    </div>
  ),
  className,
  imageClassName,
  watermarkClassName,
  ...props
}: WatermarkedImageProps) => {
  return (
    <div className={cn("relative w-full h-full overflow-hidden", className)}>
      <img
        src={src}
        alt={alt}
        className={cn("w-full h-full object-cover", imageClassName)}
        {...props}
      />
      <div
        className={cn(
          "absolute inset-0 flex items-center justify-center pointer-events-none",
          "text-white text-center font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl opacity-50", // Ridotto del 25% circa
          "whitespace-nowrap overflow-hidden", // Evita che il testo vada a capo
          watermarkClassName
        )}
        style={{
          textShadow: '2px 2px 4px rgba(0,0,0,0.7)', // Ombra per maggiore leggibilità
          background: 'linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0) 100%)', // Leggero gradiente per effetto
          backgroundSize: '200% 100%',
          animation: 'watermark-flow 10s linear infinite', // Animazione per un effetto dinamico
        }}
      >
        {watermarkText}
      </div>
      {/* Aggiungi keyframes per l'animazione nel CSS globale se non già presenti */}
      <style jsx>{`
        @keyframes watermark-flow {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
      `}</style>
    </div>
  );
};