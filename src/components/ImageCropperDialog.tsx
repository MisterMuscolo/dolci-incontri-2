import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { Area } from 'react-easy-crop'; // Percorso di importazione corretto
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Crop, ZoomIn, ZoomOut } from 'lucide-react';
import { getCroppedImg } from '@/lib/cropImage'; // Funzione helper per il ritaglio
import { showError, showLoading, dismissToast } from '@/utils/toast';

interface ImageCropperDialogProps {
  imageSrc: string | File; // Può essere un URL o un File
  aspectRatio: number; // Es. 4 / 5 per verticale, 16 / 10 per orizzontale
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
}

export const ImageCropperDialog = ({
  imageSrc,
  aspectRatio,
  isOpen,
  onClose,
  onCropComplete,
}: ImageCropperDialogProps) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropAreaChange = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSaveCrop = useCallback(async () => {
    if (!croppedAreaPixels || !imageSrc) {
      showError('Nessuna area di ritaglio selezionata.');
      return;
    }

    setIsProcessing(true);
    const toastId = showLoading('Ritaglio immagine in corso...');

    try {
      const imageURL = typeof imageSrc === 'string' ? imageSrc : URL.createObjectURL(imageSrc);
      const croppedFile = await getCroppedImg(imageURL, croppedAreaPixels);
      onCropComplete(croppedFile);
      onClose();
    } catch (e: any) {
      console.error('Errore durante il ritaglio dell\'immagine:', e);
      showError(e.message || 'Errore durante il ritaglio dell\'immagine.');
    } finally {
      dismissToast(toastId);
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, imageSrc, onCropComplete, onClose]);

  // Reset crop and zoom when dialog opens with a new image
  React.useEffect(() => {
    if (isOpen) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [isOpen, imageSrc]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[500px] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crop className="h-5 w-5 text-rose-500" /> Ritaglia e Posiziona Immagine
          </DialogTitle>
          <DialogDescription>
            Zoomma e trascina l'immagine per adattarla al riquadro.
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex-grow w-full bg-gray-100 rounded-md overflow-hidden">
          {imageSrc && (
            <Cropper
              image={typeof imageSrc === 'string' ? imageSrc : URL.createObjectURL(imageSrc)}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={onCropChange}
              onZoomChange={onZoomChange}
              onCropComplete={onCropAreaChange}
              cropShape="rect" // For rectangular crop
              showGrid={true}
              restrictPosition={false} // Allow dragging outside image bounds for better control
            />
          )}
        </div>

        <div className="flex items-center gap-4 py-4">
          <ZoomOut className="h-5 w-5 text-gray-500" />
          <Slider
            min={1}
            max={3}
            step={0.1}
            value={[zoom]}
            onValueChange={(val) => setZoom(val[0])}
            className="w-full"
            disabled={isProcessing}
          />
          <ZoomIn className="h-5 w-5 text-gray-500" />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Annulla
          </Button>
          <Button onClick={handleSaveCrop} disabled={isProcessing || !croppedAreaPixels} className="bg-rose-500 hover:bg-rose-600">
            {isProcessing ? 'Salvataggio...' : 'Salva Ritaglio'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};