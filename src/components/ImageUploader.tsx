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
  url: string; // This will be the cropped URL
  original_url: string | null; // New: This will be the original URL
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
  const [originalFileToUpload, setOriginalFileToUpload] = useState<File | null>(null); // Store original file for new uploads
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

  const handleUpdateExistingPhoto = useCallback(async (originalPhoto: ExistingPhoto, newCroppedFile: File) => {
    if (!listingId || !userId) {
      showError('Impossibile aggiornare la foto: ID annuncio o ID utente non disponibili.');
      return;
    }

    const toastId = showLoading('Aggiornamento foto in corso...');
    try {
      // For existing photos, we only update the cropped version. The original_url remains the same.
      // 1. Delete old cropped image from Supabase Storage
      const oldCroppedUrlParts = originalPhoto.url.split('/');
      const oldCroppedFilename = oldCroppedUrlParts[oldCroppedUrlParts.length - 1];
      const oldCroppedStoragePath = `${userId}/${listingId}/${oldCroppedFilename}`;

      const { error: removeError } = await supabase.storage
        .from('listing_photos')
        .remove([oldCroppedStoragePath]);

      if (removeError) {
        console.warn(`Errore durante l'eliminazione della vecchia foto ritagliata dallo storage: ${removeError.message}`);
      }

      // 2. Upload new cropped image to Supabase Storage
      const newCroppedFileName = `${crypto.randomUUID()}.jpeg`; // Generate new UUID for cropped file
      const newCroppedFilePath = `${userId}/${listingId}/${newCroppedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('listing_photos')
        .upload(newCroppedFilePath, newCroppedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Errore nel caricamento della nuova foto ritagliata: ${uploadError.message}`);
      }

      const { data: { publicUrl: newCroppedPublicUrl } } = supabase.storage.from('listing_photos').getPublicUrl(newCroppedFilePath);

      // 3. Update 'url' in database (original_url remains unchanged)
      const { error: dbUpdateError } = await supabase
        .from('listing_photos')
        .update({ url: newCroppedPublicUrl })
        .eq('id', originalPhoto.id);

      if (dbUpdateError) {
        throw new Error(`Errore durante l'aggiornamento del URL della foto ritagliata nel database: ${dbUpdateError.message}`);
      }

      dismissToast(toastId);
      showSuccess('Foto aggiornata con successo!');

      const updatedExistingPhotos = existingPhotosState.map(p =>
        p.id === originalPhoto.id ? { ...p, url: newCroppedPublicUrl } : p
      );
      setExistingPhotosState(updatedExistingPhotos);
      onExistingPhotosUpdated(updatedExistingPhotos);
      setActivePreviewUrl(newCroppedPublicUrl);

    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante l\'aggiornamento della foto.');
    }
  }, [listingId, userId, onExistingPhotosUpdated, existingPhotosState]);

  const handleUpdateExistingPhotoRef = useRef(handleUpdateExistingPhoto);
  useEffect(() => {
    handleUpdateExistingPhotoRef.current = handleUpdateExistingPhoto;
  }, [handleUpdateExistingPhoto]);

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

      const newFile = filesToAdd[0]; // Only process one file at a time for cropping
      
      if (newFile) {
        setImageToCrop(newFile);
        setOriginalFileToUpload(newFile); // Store the original file
        setCurrentCroppingIndex(newlySelectedFiles.length);
        setCurrentCroppingExistingPhoto(null);
        setIsCropperOpen(true);
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCropperSave = (croppedFile: File) => {
    if (currentCroppingExistingPhoto) {
      if (handleUpdateExistingPhotoRef.current) {
        handleUpdateExistingPhotoRef.current(currentCroppingExistingPhoto, croppedFile);
      } else {
        console.error("handleUpdateExistingPhotoRef.current is not defined when trying to update existing photo.");
        showError("Errore interno: impossibile aggiornare la foto esistente.");
      }
    } else if (currentCroppingIndex !== null && originalFileToUpload) {
      // For new files, we need to store both original and cropped
      setNewlySelectedFiles(prev => {
        const updated = [...prev];
        // Store an object that contains both original and cropped files
        // This is a temporary structure for the uploader, actual upload logic will be in NewListing/EditListing
        updated[currentCroppingIndex] = { original: originalFileToUpload, cropped: croppedFile } as any; // Cast to any for now
        return updated;
      });
      setNewlySelectedPreviews(prev => {
        const updated = [...prev];
        updated[currentCroppingIndex] = URL.createObjectURL(croppedFile); // Preview uses cropped
        return updated;
      });

      if (newlySelectedPrimaryIndex === null && existingPhotosState.length === 0 && (newlySelectedFiles.length + 1) > 0) {
        setNewlySelectedPrimaryIndex(currentCroppingIndex);
        setActivePreviewUrl(URL.createObjectURL(croppedFile));
      }
    }
    setIsCropperOpen(false);
    setImageToCrop(null);
    setOriginalFileToUpload(null);
    setCurrentCroppingIndex(null);
    setCurrentCroppingExistingPhoto(null);
  };

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
      // 1. Delete cropped image from Supabase Storage
      const croppedUrlParts = photoToDelete.url.split('/');
      const croppedFilename = croppedUrlParts[croppedUrlParts.length - 1];
      const croppedStoragePath = `${userId}/${listingId}/${croppedFilename}`;

      const { error: croppedStorageError } = await supabase.storage
        .from('listing_photos')
        .remove([croppedStoragePath]);

      if (croppedStorageError) {
        console.warn(`Errore durante l'eliminazione della foto ritagliata dallo storage: ${croppedStorageError.message}`);
      }

      // 2. Delete original image from Supabase Storage (if exists)
      if (photoToDelete.original_url) {
        const originalUrlParts = photoToDelete.original_url.split('/');
        const originalFilename = originalUrlParts[originalUrlParts.length - 1];
        const originalStoragePath = `${userId}/${listingId}/${originalFilename}`;

        const { error: originalStorageError } = await supabase.storage
          .from('listing_photos')
          .remove([originalStoragePath]);

        if (originalStorageError) {
          console.warn(`Errore durante l'eliminazione della foto originale dallo storage: ${originalStorageError.message}`);
        }
      }

      // 3. Delete from database
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
    setImageToCrop(photo.url); // Use the cropped URL for editing the crop
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
              src={photo.url} // Display cropped URL for existing photos
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
              src={preview} // Display cropped preview for new photos
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
                  // For new files, imageToCrop should be the original file
                  const fileData = newlySelectedFiles[index] as any;
                  setImageToCrop(fileData.original); 
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
            setOriginalFileToUpload(null);
            setCurrentCroppingIndex(null);
            setCurrentCroppingExistingPhoto(null);
          }}
          onCropComplete={handleCropperSave}
        />
      )}
    </div>
  );
};