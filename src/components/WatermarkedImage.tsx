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
    <div className="flex items-center justify-center gap-0.5"> {/* Ridotto il gap */}
      <Heart className="h-4 w-4" /> {/* Ridotto del 50% (da h-8 w-8) */}
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
          "text-white text-center font-bold text-xs sm:text-sm md:text-base lg:text-lg opacity-50", // Ridotto del 50% circa
          "whitespace-nowrap overflow-hidden", // Evita che il testo vada a capo
          watermarkClassName
        )}
        style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.7)', // Ombra più piccola per maggiore leggibilità
        }}
      >
        {watermarkText}
      </div>
    </div>
  );
};