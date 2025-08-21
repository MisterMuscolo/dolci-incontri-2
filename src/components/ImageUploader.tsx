import { useState, useEffect, useRef } from 'react';
import { UploadCloud, X, Star, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client'; // Import supabase
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Link } from 'react-router-dom'; // Import Link

interface ExistingPhoto {
  id: string;
  url: string;
  is_primary: boolean;
}

interface ImageUploaderProps {
  listingId?: string; // Reso opzionale
  userId?: string; // Reso opzionale
  initialPhotos?: ExistingPhoto[]; // Reso opzionale
  isPremiumOrPending?: boolean; // Reso opzionale
  onFilesChange: (files: File[]) => void; // For new files to be uploaded
  onPrimaryIndexChange: (index: number | null) => void; // For new files primary index
  onExistingPhotosUpdated: (updatedPhotos: ExistingPhoto[]) => void; // Callback for parent to update existing photos state
  hideMainPreview?: boolean; // Nuova proprietà
}

export const ImageUploader = ({
  listingId,
  userId,
  initialPhotos = [], // Valore predefinito
  isPremiumOrPending = false, // Valore predefinito
  onFilesChange,
  onPrimaryIndexChange,
  onExistingPhotosUpdated,
  hideMainPreview = false, // Valore predefinito
}: ImageUploaderProps) => {
  const [newlySelectedFiles, setNewlySelectedFiles] = useState<File[]>([]);
  const [newlySelectedPreviews, setNewlySelectedPreviews] = useState<string[]>([]);
  const [newlySelectedPrimaryIndex, setNewlySelectedPrimaryIndex] = useState<number | null>(null);
  const [existingPhotosState, setExistingPhotosState] = useState<ExistingPhoto[]>(initialPhotos);
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null); // For the main preview
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_PHOTOS = 5;
  const FREE_PHOTOS_LIMIT = 1;

  useEffect(() => {
    setExistingPhotosState(initialPhotos);
    // Set initial active preview to primary existing photo or first existing photo
    const primary = initialPhotos.find(p => p.is_primary);
    setActivePreviewUrl(primary?.url ?? initialPhotos[0]?.url ?? null);
  }, [initialPhotos]);

  useEffect(() => {
    onFilesChange(newlySelectedFiles);
  }, [newlySelectedFiles, onFilesChange]);

  useEffect(() => {
    onPrimaryIndexChange(newlySelectedPrimaryIndex);
  }, [newlySelectedPrimaryIndex, onPrimaryIndexChange]);

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
      const newPreviews = newFiles
        .map(file => {
          try {
            return URL.createObjectURL(file);
          } catch (e) {
            console.error("Error creating object URL for file:", file.name, e);
            return undefined; // Return undefined if there's an issue
          }
        })
        .filter((p): p is string => typeof p === 'string'); // Filter out any undefined results

      setNewlySelectedFiles(prev => [...prev, ...newFiles]);
      setNewlySelectedPreviews(prev => [...prev, ...newPreviews]);

      if (newlySelectedPrimaryIndex === null && existingPhotosState.length === 0 && (newlySelectedFiles.length + newFiles.length) > 0) {
        // Set first new photo as primary if no existing and no other new, and there's at least one valid new preview
        if (newPreviews.length > 0) {
          setNewlySelectedPrimaryIndex(newlySelectedFiles.length); // Index of the first new file added in this batch
          setActivePreviewUrl(newPreviews[0] ?? null); // Set the active preview immediately
        }
      }
      // Clear the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
      // 1. Delete from Supabase Storage
      // The path in storage is listingId/filename. Need to extract filename from URL.
      const urlParts = photoToDelete.url.split('/');
      const filename = urlParts[urlParts.length - 1];
      const storagePath = `${listingId}/${filename}`;

      const { error: storageError } = await supabase.storage
        .from('listing_photos')
        .remove([storagePath]);

      if (storageError) {
        throw new Error(`Errore durante l'eliminazione della foto dallo storage: ${storageError.message}`);
      }

      // 2. Delete from database
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
      onExistingPhotosUpdated(updatedExistingPhotos); // Notify parent

      // Adjust primary if deleted photo was primary
      if (photoToDelete.is_primary) {
        if (updatedExistingPhotos.length > 0) {
          // Set first remaining existing photo as primary
          await handleSetExistingAsPrimary(updatedExistingPhotos[0]);
        } else if (newlySelectedFiles.length > 0) {
          // Set first newly selected photo as primary
          setNewlySelectedPrimaryIndex(0);
          const previews = newlySelectedPreviews ?? []; // Defensive check
          setActivePreviewUrl(previews.length > 0 ? (previews[0] ?? null) : null);
        } else {
          setActivePreviewUrl(null);
        }
      } else if (activePreviewUrl === photoToDelete.url) {
        // If deleted photo was just the active preview, reset preview
        const previews = newlySelectedPreviews ?? []; // Defensive check
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
    if (photoToSetPrimary.is_primary) return; // Already primary
    if (!listingId) {
      showError('Impossibile impostare la foto principale: ID annuncio non disponibile.');
      return;
    }

    const toastId = showLoading('Impostazione foto principale...');
    try {
      // Reset all existing photos to not primary
      const { error: resetExistingError } = await supabase
        .from('listing_photos')
        .update({ is_primary: false })
        .eq('listing_id', listingId); // Reset all for this listing

      if (resetExistingError) {
        console.warn("Failed to reset old primary existing photo:", resetExistingError.message);
      }

      // Set the selected existing photo as primary
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
      onExistingPhotosUpdated(updatedExistingPhotos); // Notify parent
      setNewlySelectedPrimaryIndex(null); // Clear primary for new files
      setActivePreviewUrl(photoToSetPrimary.url ?? null); // Update main preview
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante l\'impostazione della foto principale.');
    }
  };

  const currentPhotoCount = existingPhotosState.length + newlySelectedFiles.length;
  const maxAllowedPhotos = isPremiumOrPending ? MAX_PHOTOS : FREE_PHOTOS_LIMIT;
  const canAddMorePhotos = currentPhotoCount < maxAllowedPhotos;
  const emptySlotsCount = Math.max(0, maxAllowedPhotos - currentPhotoCount);

  // Determine the main preview URL
  const mainPreview = activePreviewUrl ?? existingPhotosState.find(p => p.is_primary)?.url ?? existingPhotosState[0]?.url ?? (newlySelectedPreviews.length > 0 ? newlySelectedPreviews[0] : null) ?? null;

  return (
    <div className="space-y-4">
      {/* Conditionally render main preview based on hideMainPreview prop */}
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
              "relative group aspect-square", // Rimosso rounded-md
              photo.is_primary && "ring-4 ring-offset-2 ring-rose-500"
            )}
          >
            <img
              src={photo.url}
              alt={`Foto esistente ${index + 1}`}
              className="w-full h-full object-cover transition-all" // Rimosso rounded-md
              onClick={() => setActivePreviewUrl(photo.url ?? null)}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={() => handleDeleteExistingPhoto(photo)}
                disabled={!listingId} // Disabilita se non c'è listingId
              >
                <X className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={() => handleSetExistingAsPrimary(photo)}
                disabled={photo.is_primary || !listingId} // Disabilita se già primaria o non c'è listingId
              >
                <Star className={cn("h-4 w-4", photo.is_primary && "text-yellow-400 fill-current")} />
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
              "relative group aspect-square", // Rimosso rounded-md
              (newlySelectedPrimaryIndex === index && existingPhotosState.length === 0) && "ring-4 ring-offset-2 ring-rose-500"
            )}
          >
            <img
              src={preview}
              alt={`Nuova foto ${index + 1}`}
              className="w-full h-full object-cover transition-all" // Rimosso rounded-md
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
              {existingPhotosState.length === 0 && ( // Only allow setting primary for new if no existing photos
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100"
                  onClick={() => setNewlySelectedAsPrimary(preview)} // Pass the preview URL
                  disabled={newlySelectedPrimaryIndex === index}
                >
                  <Star className={cn("h-4 w-4", newlySelectedPrimaryIndex === index && "text-yellow-400 fill-current")} />
                </Button>
              )}
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
    </div>
  );
};