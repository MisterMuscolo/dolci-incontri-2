import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { X, Star, ImageOff, GalleryHorizontal, Crop } from 'lucide-react'; // Import Crop icon
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ImageCropperDialog } from './ImageCropperDialog'; // Import ImageCropperDialog

interface Photo {
  id: string;
  url: string; // Cropped URL
  original_url: string | null; // Original URL
  is_primary: boolean;
}

interface ListingPhotoManagerDialogProps {
  listingId: string;
  listingTitle: string;
  userId: string;
  onPhotosUpdated: () => void;
}

export const ListingPhotoManagerDialog = ({ listingId, listingTitle, userId, onPhotosUpdated }: ListingPhotoManagerDialogProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState<string | null>(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  const [isCropperOpen, setIsCropperOpen] = useState(false); // State for cropper dialog
  const [imageToCrop, setImageToCrop] = useState<string | File | null>(null); // Image source for cropper
  const [currentCroppingPhoto, setCurrentCroppingPhoto] = useState<Photo | null>(null); // Photo being cropped

  const THUMBNAIL_ASPECT_RATIO = 4 / 5; // Define aspect ratio

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('listing_photos')
      .select('id, url, original_url, is_primary') // Select original_url
      .eq('listing_id', listingId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error fetching listing photos:", error);
      showError("Impossibile caricare le foto dell'annuncio.");
    } else {
      setPhotos(data || []);
      if (data && data.length > 0) {
        const primary = data.find(p => p.is_primary);
        setActivePreviewUrl(primary?.url || data[0].url); // Preview uses cropped URL
      } else {
        setActivePreviewUrl(null);
      }
    }
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const handleUpdatePhotoCrop = useCallback(async (originalPhoto: Photo, newCroppedFile: File) => {
    const toastId = showLoading('Aggiornamento ritaglio foto in corso...');
    try {
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
      showSuccess('Ritaglio foto aggiornato con successo!');
      await fetchPhotos(); // Re-fetch to update state and UI
      onPhotosUpdated();

    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante l\'aggiornamento del ritaglio della foto.');
    }
  }, [listingId, userId, fetchPhotos, onPhotosUpdated]);


  const handleDeleteSinglePhoto = async (photoToDelete: Photo) => {
    setIsDeletingSingle(photoToDelete.id);
    const toastId = showLoading('Eliminazione foto in corso...');

    try {
      const filesToDelete: string[] = [];

      // 1. Delete cropped image from Supabase Storage
      const croppedUrlParts = photoToDelete.url.split('/');
      const croppedFilename = croppedUrlParts[croppedUrlParts.length - 1];
      filesToDelete.push(`${userId}/${listingId}/${croppedFilename}`);

      // 2. Delete original image from Supabase Storage (if exists)
      if (photoToDelete.original_url) {
        const originalUrlParts = photoToDelete.original_url.split('/');
        const originalFilename = originalUrlParts[originalUrlParts.length - 1];
        filesToDelete.push(`${userId}/${listingId}/${originalFilename}`);
      }

      const { error: storageError } = await supabase.storage
        .from('listing_photos')
        .remove(filesToDelete);

      if (storageError) {
        throw new Error(`Errore durante l'eliminazione delle foto dallo storage: ${storageError.message}`);
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
      await fetchPhotos();
      onPhotosUpdated();

      if (photoToDelete.is_primary && photos.length > 1) {
        const remainingPhotos = photos.filter(p => p.id !== photoToDelete.id);
        if (remainingPhotos.length > 0) {
          await handleSetAsPrimary(remainingPhotos[0]);
        }
      } else if (activePreviewUrl === photoToDelete.url) {
        const remainingPhotos = photos.filter(p => p.id !== photoToDelete.id);
        setActivePreviewUrl(remainingPhotos[0]?.url || null);
      }

    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante l\'eliminazione della foto.');
    } finally {
      setIsDeletingSingle(null);
    }
  };

  const handleDeleteAllPhotos = async () => {
    setIsDeletingAll(true);
    const toastId = showLoading('Eliminazione di tutte le foto in corso...');

    try {
      // 1. List all photos for the listing in storage
      const { data: storageFiles, error: storageListError } = await supabase.storage
        .from('listing_photos')
        .list(`${userId}/${listingId}/`); // List files in the user's listing folder

      if (storageListError) {
        console.warn(`Could not list photos for listing ${listingId} in storage:`, storageListError.message);
      } else if (storageFiles && storageFiles.length > 0) {
        const filePaths = storageFiles.map(file => `${userId}/${listingId}/${file.name}`);
        const { error: storageDeleteError } = await supabase.storage
          .from('listing_photos')
          .remove(filePaths);

        if (storageDeleteError) {
          console.warn(`Could not delete photos for listing ${listingId} from storage:`, storageDeleteError.message);
        }
      }

      // 2. Delete all photo entries from the database for this listing
      const { error: dbDeleteError } = await supabase
        .from('listing_photos')
        .delete()
        .eq('listing_id', listingId);

      if (dbDeleteError) {
        throw new Error(`Errore durante l'eliminazione delle foto dal database: ${dbDeleteError.message}`);
      }

      // 3. Update listing's premium status if it was premium and had photos
      const { data: listingData, error: fetchListingError } = await supabase
        .from('listings')
        .select('is_premium')
        .eq('id', listingId)
        .single();

      if (fetchListingError) {
        console.warn(`Could not fetch listing premium status: ${fetchListingError.message}`);
      } else if (listingData?.is_premium) {
        const { error: updateListingError } = await supabase
          .from('listings')
          .update({ 
            is_premium: false,
            promotion_mode: null,
            promotion_start_at: null,
            promotion_end_at: null,
          })
          .eq('id', listingId);

        if (updateListingError) {
          console.warn(`Could not update listing premium status after photo deletion: ${updateListingError.message}`);
        }
      }

      dismissToast(toastId);
      showSuccess('Tutte le foto dell\'annuncio sono state eliminate con successo!');
      setPhotos([]);
      setActivePreviewUrl(null);
      onPhotosUpdated();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante l\'eliminazione delle foto.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleSetAsPrimary = async (photoToSetPrimary: Photo) => {
    if (photoToSetPrimary.is_primary) return;
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
      await fetchPhotos();
      onPhotosUpdated();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante l\'impostazione della foto principale.');
    }
  };

  const handleEditPhotoCrop = (photo: Photo) => {
    setImageToCrop(photo.original_url ?? photo.url); // Use original_url for re-cropping
    setCurrentCroppingPhoto(photo);
    setIsCropperOpen(true);
  };

  const handleCropperSave = (croppedFile: File) => {
    if (currentCroppingPhoto) {
      handleUpdatePhotoCrop(currentCroppingPhoto, croppedFile);
    }
    setIsCropperOpen(false);
    setImageToCrop(null);
    setCurrentCroppingPhoto(null);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <GalleryHorizontal className="h-4 w-4 md:mr-2" />
          <span className="hidden md:inline">Gestisci Foto</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GalleryHorizontal className="h-6 w-6 text-rose-500" /> Gestisci Foto Annuncio
          </DialogTitle>
          <DialogDescription>
            Gestisci le foto per l'annuncio: "{listingTitle}".
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="space-y-4 py-4">
            <div className="w-full aspect-video bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-square bg-gray-200 rounded-md animate-pulse"></div>
              <div className="aspect-square bg-gray-200 rounded-md animate-pulse"></div>
              <div className="aspect-square bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            Nessuna foto per questo annuncio.
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {activePreviewUrl && (
              <AspectRatio ratio={16 / 10} className="bg-gray-100 rounded-lg overflow-hidden">
                <img src={activePreviewUrl} alt="Anteprima foto principale" className="w-full h-full object-cover" />
              </AspectRatio>
            )}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 overflow-y-auto max-h-48">
              {photos.map((photo) => (
                <div 
                  key={photo.id} 
                  className={cn(
                    "relative group aspect-square",
                    activePreviewUrl === photo.url && "ring-2 ring-rose-500 ring-offset-2 ring-offset-gray-50"
                  )}
                >
                  <img
                    src={photo.url} // Display cropped URL for thumbnails
                    alt="Miniatura foto"
                    className={cn(
                      "w-full h-full object-cover transition-all cursor-pointer",
                      photo.is_primary && "border-2 border-yellow-400"
                    )}
                    onClick={() => setActivePreviewUrl(photo.url)}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-1">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={() => handleDeleteSinglePhoto(photo)}
                      disabled={isDeletingSingle === photo.id}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={() => handleSetAsPrimary(photo)}
                      disabled={photo.is_primary}
                    >
                      <Star className={cn("h-4 w-4", photo.is_primary && "text-yellow-400 fill-current")} />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
                      onClick={() => handleEditPhotoCrop(photo)} // New button for editing crop
                    >
                      <Crop className="h-4 w-4" />
                    </Button>
                  </div>
                  {photo.is_primary && (
                    <div className="absolute top-1 right-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      Primaria
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={photos.length === 0 || isDeletingAll}>
                    <ImageOff className="h-4 w-4 mr-2" /> Elimina Tutte le Foto
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Questa azione eliminerà definitivamente TUTTE le foto dell'annuncio "{listingTitle}" dallo storage e dal database. L'annuncio rimarrà attivo ma senza immagini. Se l'annuncio era Premium, tornerà ad essere un annuncio base.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAllPhotos}
                      className="bg-destructive hover:bg-destructive/90"
                      disabled={isDeletingAll}
                    >
                      {isDeletingAll ? 'Eliminazione...' : 'Sì, elimina tutte'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        )}
      </DialogContent>
      {imageToCrop && (
        <ImageCropperDialog
          imageSrc={imageToCrop}
          aspectRatio={THUMBNAIL_ASPECT_RATIO}
          isOpen={isCropperOpen}
          onClose={() => {
            setIsCropperOpen(false);
            setImageToCrop(null);
            setCurrentCroppingPhoto(null);
          }}
          onCropComplete={handleCropperSave}
        />
      )}
    </Dialog>
  );
};