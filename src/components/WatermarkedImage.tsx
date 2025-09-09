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
  // Nuove prop per controllare la dimensione predefinita del testo/icona del watermark
  defaultWatermarkIconSizeClass?: string;
  defaultWatermarkTextSizeClass?: string;
}

export const WatermarkedImage = ({
  src,
  alt,
  watermarkText, // Rimosso il valore predefinito qui, lo definiremo all'interno se non fornito
  className,
  imageClassName,
  watermarkClassName,
  defaultWatermarkIconSizeClass = "h-4 w-4", // Dimensione predefinita per l'icona (es. per l'immagine principale)
  defaultWatermarkTextSizeClass = "text-xs", // Dimensione predefinita per il testo (es. per l'immagine principale)
  ...props
}: WatermarkedImageProps) => {

  // Definisci il watermarkText predefinito qui, usando le nuove prop di dimensione
  const defaultWatermarkContent = (
    <div className="flex items-center justify-center gap-0.5">
      <Heart className={defaultWatermarkIconSizeClass} />
      <span className={defaultWatermarkTextSizeClass}>IncontriDolci</span>
    </div>
  );

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
          "text-white text-center font-bold opacity-50", // Rimosse le classi di dimensione del testo predefinite
          "whitespace-nowrap overflow-hidden", // Evita che il testo vada a capo
          watermarkClassName
        )}
        style={{
          textShadow: '1px 1px 2px rgba(0,0,0,0.7)', // Ombra più piccola per maggiore leggibilità
        }}
      >
        {watermarkText || defaultWatermarkContent} {/* Usa il contenuto fornito o quello predefinito */}
      </div>
    </div>
  );
};