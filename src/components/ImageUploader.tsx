import { useState, useEffect, useRef, useCallback } from 'react';
import { UploadCloud, X, Star, Plus, Crop } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Link } from 'react-router-dom';
import { ImageCropperDialog } from './ImageCropperDialog';

interface ExistingPhoto {
  id: string;
  url: string;
  is_primary: boolean;
}

interface ImageUploaderProps {
  listingId?: string;
  userId?: string;
  initialPhotos?: ExistingPhoto[];
  isPremiumOrPending?: boolean;
  onFilesChange: (files: File[]) => void;
  onPrimaryIndexChange: (index: number | null) => void;
  onExistingPhotosUpdated: (updatedPhotos: ExistingPhoto[]) => void;
  hideMainPreview?: boolean;
}

export const ImageUploader = ({
  listingId,
  userId,
  initialPhotos = [],
  isPremiumOrPending = false,
  onFilesChange,
  onPrimaryIndexChange,
  onExistingPhotosUpdated,
  hideMainPreview = false,
}: ImageUploaderProps) => {
  const [newlySelectedFiles, setNewlySelectedFiles] = useState<File[]>([]);
  const [newlySelectedPreviews, setNewlySelectedPreviews] = useState<string[]>([]);
  const [newlySelectedPrimaryIndex, setNewlySelectedPrimaryIndex] = useState<number | null>(null);
  const [existingPhotosState, setExistingPhotosState] = useState<ExistingPhoto[]>(initialPhotos);
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | File | null>(null);
  const [currentCroppingIndex, setCurrentCroppingIndex] = useState<number | null>(null);
  const [currentCroppingExistingPhoto, setCurrentCroppingExistingPhoto] = useState<ExistingPhoto | null>(null);

  const MAX_PHOTOS = 5;
  const FREE_PHOTOS_LIMIT = 1;
  const THUMBNAIL_ASPECT_RATIO = 4 / 5;

  useEffect(() => {
    setExistingPhotosState(initialPhotos);
    const primary = initialPhotos.find(p => p.is_primary);
    setActivePreviewUrl(primary?.url ?? initialPhotos[0]?.url ?? null);
  }, [initialPhotos]);

  useEffect(() => {
    onFilesChange(newlySelectedFiles);
  }, [newlySelectedFiles, onFilesChange]);

  useEffect(() => {
    onPrimaryIndexChange(newlySelectedPrimaryIndex);
  }, [newlySelectedPrimaryIndex, onPrimaryIndexChange]);

  // Define handleUpdateExistingPhoto
  const handleUpdateExistingPhoto = useCallback(async (originalPhoto: ExistingPhoto, newCroppedFile: File) => {
    if (!listingId || !userId) {
      showError('Impossibile aggiornare la foto: ID annuncio o ID utente non disponibili.');
      return;
    }

    const toastId = showLoading('Aggiornamento foto in corso...');
    try {
      const oldUrlParts = originalPhoto.url.split('/');
      const oldFilename = oldUrlParts[oldUrlParts.length - 1];
      const oldStoragePath = `${userId}/${listingId}/${oldFilename}`;

      const { error: removeError } = await supabase.storage
        .from('listing_photos')
        .remove([oldStoragePath]);

      if (removeError) {
        console.warn(`Errore durante l'eliminazione della vecchia foto dallo storage: ${removeError.message}`);
      }

      const slugifiedFileName = originalPhoto.id;
      const newFileName = `${slugifiedFileName}.jpeg`;
      const newFilePath = `${userId}/${listingId}/${newFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('listing_photos')
        .upload(newFilePath, newCroppedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Errore nel caricamento della nuova foto: ${uploadError.message}`);
      }

      const { data: { publicUrl: newPublicUrl } } = supabase.storage.from('listing_photos').getPublicUrl(newFilePath);

      const { error: dbUpdateError } = await supabase
        .from('listing_photos')
        .update({ url: newPublicUrl })
        .eq('id', originalPhoto.id);

      if (dbUpdateError) {
        throw new Error(`Errore durante l'aggiornamento del URL della foto nel database: ${dbUpdateError.message}`);
      }

      dismissToast(toastId);
      showSuccess('Foto aggiornata con successo!');

      // Use functional update for setExistingPhotosState to ensure latest state
      setExistingPhotosState(prev => prev.map(p =>
        p.id === originalPhoto.id ? { ...p, url: newPublicUrl } : p
      ));
      // Call onExistingPhotosUpdated with the updated state
      onExistingPhotosUpdated(existingPhotosState.map(p => // This will be stale if not using functional update
        p.id === originalPhoto.id ? { ...p, url: newPublicUrl } : p
      ));
      setActivePreviewUrl(newPublicUrl);

    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante l\'aggiornamento della foto.');
    }
  }, [listingId, userId, onExistingPhotosUpdated, existingPhotosState]); // existingPhotosState is a dependency here

  // Create a ref for handleUpdateExistingPhoto
  const handleUpdateExistingPhotoRef = useRef(handleUpdateExistingPhoto);
  useEffect(() => {
    handleUpdateExistingPhotoRef.current = handleUpdateExistingPhoto;
  }, [handleUpdateExistingPhoto]); // This useEffect ensures the ref is always up-to-date

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const filesToAdd = Array.from(event.target.files);
      const totalCurrentPhotos = existingPhotosState.length + newlySelectedFiles.length;
      const maxAllowed = isPremiumOrPending ? MAX_PHOTOS : FREE_PHOTOS_LIMIT;
      const availableSlots = maxAllowed - totalCurrentPhotos;

      if (availableSlots <= 0) {
        showError(`Hai raggiunto il limite massimo di ${maxAllowed} foto.`);
        return;
      }

      const newFiles = filesToAdd.slice(0, availableSlots);
      
      if (newFiles.length > 0) {
        const fileToProcess = newFiles[0];
        setImageToCrop(fileToProcess);
        setCurrentCroppingIndex(newlySelectedFiles.length);
        setCurrentCroppingExistingPhoto(null);
        setIsCropperOpen(true);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Define handleCropperSave as a regular function (NOT useCallback)
  const handleCropperSave = (croppedFile: File) => {
    if (currentCroppingExistingPhoto) {
      // Use the ref to call handleUpdateExistingPhoto
      // The ref ensures we always call the latest version of handleUpdateExistingPhoto
      if (handleUpdateExistingPhotoRef.current) {
        handleUpdateExistingPhotoRef.current(currentCroppingExistingPhoto, croppedFile);
      } else {
        console.error("handleUpdateExistingPhotoRef.current is not defined when trying to update existing photo.");
        showError("Errore interno: impossibile aggiornare la foto esistente.");
      }
    } else if (currentCroppingIndex !== null) {
      setNewlySelectedFiles(prev => {
        const updated = [...prev];
        updated[currentCroppingIndex] = croppedFile;
        return updated;
      });
      setNewlySelectedPreviews(prev => {
        const updated = [...prev];
        updated[currentCroppingIndex] = URL.createObjectURL(croppedFile);
        return updated;
      });

      // This condition relies on `newlySelectedFiles.length` and `existingPhotosState.length`
      // These are in the dependencies of this useCallback, so they are fresh.
      if (newlySelectedPrimaryIndex === null && existingPhotosState.length === 0 && (newlySelectedFiles.length + 1) > 0) {
        setNewlySelectedPrimaryIndex(currentCroppingIndex);
        setActivePreviewUrl(URL.createObjectURL(croppedFile));
      }
    }
    setIsCropperOpen(false);
    setImageToCrop(null);
    setCurrentCroppingIndex(null);
    setCurrentCroppingExistingPhoto(null);
  }; // No useCallback here

  const removeNewlySelectedFile = (index: number) => {
    const updatedFiles = newlySelectedFiles.filter((_, i) => i !== index);
    const updatedPreviews = newlySelectedPreviews.filter((_, i) => i !== index);
    setNewlySelectedFiles(updatedFiles);
    setNewlySelectedPreviews(updatedPreviews);

    if (newlySelectedPrimaryIndex === index) {
      setNewlySelectedPrimaryIndex(updatedFiles.length > 0 ? 0 : null);
    } else if (newlySelectedPrimaryIndex !== null && newlySelectedPrimaryIndex > index) {
      setNewlySelectedPrimaryIndex(newlySelectedPrimaryIndex - 1);
    }
  };

  const setNewlySelectedAsPrimary = (previewUrl: string) => {
    const index = newlySelectedPreviews.indexOf(previewUrl);
    if (index === -1) {
      console.warn("Attempted to set primary for a non-existent new photo URL:", previewUrl);
      setNewlySelectedPrimaryIndex(null);
      setActivePreviewUrl(null);
      return;
    }
    setNewlySelectedPrimaryIndex(index);
    setActivePreviewUrl(previewUrl ?? null);
  };

  const handleDeleteExistingPhoto = async (photoToDelete: ExistingPhoto) => {
    if (!listingId || !userId) {
      showError('Impossibile eliminare la foto: ID annuncio o ID utente non disponibili.');
      return;
    }

    const toastId = showLoading('Eliminazione foto in corso...');
    try {
      const urlParts = photoToDelete.url.split('/');
      const filename = urlParts[urlParts.length - 1];
      const storagePath = `${userId}/${listingId}/${filename}`;

      const { error: storageError } = await supabase.storage
        .from('listing_photos')
        .remove([storagePath]);

      if (storageError) {
        throw new Error(`Errore durante l'eliminazione della foto dallo storage: ${storageError.message}`);
      }

      const { error: dbError } = await supabase
        .from('listing_photos')
        .delete()
        .eq('id', photoToDelete.id);

      if (dbError) {
        throw new Error(`Errore durante l'eliminazione della foto dal database: ${dbError.message}`);
      }

      dismissToast(toastId);
      showSuccess('Foto eliminata con successo!');
      const updatedExistingPhotos = existingPhotosState.filter(p => p.id !== photoToDelete.id);
      setExistingPhotosState(updatedExistingPhotos);
      onExistingPhotosUpdated(updatedExistingPhotos);

      if (photoToDelete.is_primary) {
        if (updatedExistingPhotos.length > 0) {
          await handleSetExistingAsPrimary(updatedExistingPhotos[0]);
        } else if (newlySelectedFiles.length > 0) {
          setNewlySelectedPrimaryIndex(0);
          const previews = newlySelectedPreviews ?? [];
          setActivePreviewUrl(previews.length > 0 ? (previews[0] ?? null) : null);
        } else {
          setActivePreviewUrl(null);
        }
      } else if (activePreviewUrl === photoToDelete.url) {
        const previews = newlySelectedPreviews ?? [];
        setActivePreviewUrl(
          updatedExistingPhotos[0]?.url ?? 
          (previews.length > 0 ? (previews[0] ?? null) : null) ?? 
          null
        );
      }

    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante l\'eliminazione della foto.');
    }
  };

  const handleSetExistingAsPrimary = async (photoToSetPrimary: ExistingPhoto) => {
    if (photoToSetPrimary.is_primary) return;
    if (!listingId) {
      showError('Impossibile impostare la foto principale: ID annuncio non disponibile.');
      return;
    }

    const toastId = showLoading('Impostazione foto principale...');
    try {
      const { error: resetExistingError } = await supabase
        .from('listing_photos')
        .update({ is_primary: false })
        .eq('listing_id', listingId);

      if (resetExistingError) {
        console.warn("Failed to reset old primary existing photo:", resetExistingError.message);
      }

      const { error: updateError } = await supabase
        .from('listing_photos')
        .update({ is_primary: true })
        .eq('id', photoToSetPrimary.id);

      if (updateError) {
        throw new Error(`Errore durante l'impostazione della foto principale: ${updateError.message}`);
      }

      dismissToast(toastId);
      showSuccess('Foto principale aggiornata!');
      const updatedExistingPhotos = existingPhotosState.map(p => ({
        ...p,
        is_primary: p.id === photoToSetPrimary.id,
      }));
      setExistingPhotosState(updatedExistingPhotos);
      onExistingPhotosUpdated(updatedExistingPhotos);
      setNewlySelectedPrimaryIndex(null);
      setActivePreviewUrl(photoToSetPrimary.url ?? null);
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante l\'impostazione della foto principale.');
    }
  };

  const handleEditExistingPhoto = (photo: ExistingPhoto) => {
    setImageToCrop(photo.url);
    setCurrentCroppingExistingPhoto(photo);
    setCurrentCroppingIndex(null);
    setIsCropperOpen(true);
  };

  const currentPhotoCount = existingPhotosState.length + newlySelectedFiles.length;
  const maxAllowedPhotos = isPremiumOrPending ? MAX_PHOTOS : FREE_PHOTOS_LIMIT;
  const canAddMorePhotos = currentPhotoCount < maxAllowedPhotos;
  const emptySlotsCount = Math.max(0, maxAllowedPhotos - currentPhotoCount);

  const mainPreview = activePreviewUrl ?? existingPhotosState.find(p => p.is_primary)?.url ?? existingPhotosState[0]?.url ?? (newlySelectedPreviews.length > 0 ? newlySelectedPreviews[0] : null) ?? null;

  return (
    <div className="space-y-4">
      {!hideMainPreview && mainPreview && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">Anteprima foto principale:</p>
          <AspectRatio ratio={16 / 10} className="bg-gray-100 rounded-lg overflow-hidden">
            <img src={mainPreview} alt="Foto principale" className="w-full h-full object-cover" />
          </AspectRatio>
        </div>
      )}

      <p className="text-sm text-gray-500 mb-2">Gestisci le tue foto:</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {existingPhotosState.map((photo, index) => (
          <div 
            key={photo.id} 
            className={cn(
              "relative group aspect-square",
              photo.is_primary && "ring-4 ring-offset-2 ring-rose-500"
            )}
          >
            <img
              src={photo.url}
              alt={`Foto esistente ${index + 1}`}
              className="w-full h-full object-cover transition-all"
              onClick={() => setActivePreviewUrl(photo.url ?? null)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={() => handleDeleteExistingPhoto(photo)}
                disabled={!listingId}
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={() => handleSetExistingAsPrimary(photo)}
                disabled={photo.is_primary || !listingId}
              >
                <Star className={cn("h-4 w-4", photo.is_primary && "text-yellow-400 fill-current")} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={() => handleEditExistingPhoto(photo)}
                disabled={!listingId}
              >
                <Crop className="h-4 w-4" />
              </Button>
            </div>
            {photo.is_primary && (
              <div className="absolute top-1 right-1 bg-rose-500 text-white text-xs px-2 py-1 rounded-full">
                Principale
              </div>
            )}
          </div>
        ))}

        {newlySelectedPreviews.map((preview, index) => (
          <div 
            key={`new-${index}`} 
            className={cn(
              "relative group aspect-square",
              (newlySelectedPrimaryIndex === index && existingPhotosState.length === 0) && "ring-4 ring-offset-2 ring-rose-500"
            )}
          >
            <img
              src={preview}
              alt={`Nuova foto ${index + 1}`}
              className="w-full h-full object-cover transition-all"
              onClick={() => setActivePreviewUrl(preview ?? null)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={() => removeNewlySelectedFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              {existingPhotosState.length === 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  onClick={() => setNewlySelectedAsPrimary(preview)}
                  disabled={newlySelectedPrimaryIndex === index}
                >
                  <Star className={cn("h-4 w-4", newlySelectedPrimaryIndex === index && "text-yellow-400 fill-current")} />
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={() => {
                  setImageToCrop(newlySelectedFiles[index]);
                  setCurrentCroppingIndex(index);
                  setCurrentCroppingExistingPhoto(null);
                  setIsCropperOpen(true);
                }}
              >
                <Crop className="h-4 w-4" />
              </Button>
            </div>
            {(newlySelectedPrimaryIndex === index && existingPhotosState.length === 0) && (
              <div className="absolute top-1 right-1 bg-rose-500 text-white text-xs px-2 py-1 rounded-full">
                Principale
              </div>
            )}
          </div>
        ))}

        {Array.from({ length: emptySlotsCount }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className={cn(
              "relative group aspect-square border-2 border-dashed rounded-md flex items-center justify-center",
              canAddMorePhotos ? "border-gray-300 hover:border-rose-400 cursor-pointer" : "border-gray-200 bg-gray-100 cursor-not-allowed opacity-50"
            )}
            onClick={() => canAddMorePhotos && fileInputRef.current?.click()}
          >
            <Plus className={cn("h-12 w-12", canAddMorePhotos ? "text-gray-400" : "text-gray-300")} />
            {!canAddMorePhotos && (
              <div className="absolute inset-0 flex items-center justify-center text-center text-xs text-gray-500 p-2">
                {isPremiumOrPending ? "Limite raggiunto" : "Passa a Premium per più foto"}
              </div>
            )}
          </div>
        ))}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={!canAddMorePhotos}
      />
      {!isPremiumOrPending && currentPhotoCount === FREE_PHOTOS_LIMIT && (
        <p className="text-sm text-gray-500 mt-2">
          Passa a <Link to={`/promote-listing/${listingId}`} className="text-rose-500 hover:underline font-semibold">Premium</Link> per caricare fino a {MAX_PHOTOS} foto.
        </p>
      )}

      {imageToCrop && (
        <ImageCropperDialog
          imageSrc={imageToCrop}
          aspectRatio={THUMBNAIL_ASPECT_RATIO}
          isOpen={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false);
            setImageToCrop(null);
            setCurrentCroppingIndex(null);
            setCurrentCroppingExistingPhoto(null);
          }}
          onCropComplete={handleCropperSave}
        />
      )}
    </div>
  );
};