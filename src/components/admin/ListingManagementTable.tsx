import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Trash2, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
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

interface AdminListing {
  id: string;
  title: string;
  category: string;
  city: string;
  user_id: string;
  created_at: string;
  expires_at: string;
}

export const ListingManagementTable = () => {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchListings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('listings')
      .select('id, title, category, city, user_id, created_at, expires_at') // Select specific fields
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching listings:", error);
      showError("Impossibile caricare gli annunci.");
    } else {
      setListings(data as AdminListing[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleDeleteListing = async (listingId: string) => {
    setDeletingId(listingId);
    const toastId = showLoading('Eliminazione annuncio in corso...');

    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) {
        throw new Error(error.message);
      }

      // Also delete associated photos from storage
      const { data: photos, error: photoError } = await supabase.storage
        .from('listing_photos')
        .list(`${listingId}/`); // List files in the listing's folder

      if (photoError) {
        console.warn(`Could not list photos for listing ${listingId}:`, photoError.message);
        // Don't throw, as listing itself is deleted, but log the issue
      } else if (photos && photos.length > 0) {
        const filePaths = photos.map(file => `${listingId}/${file.name}`);
        const { error: deletePhotoError } = await supabase.storage
          .from('listing_photos')
          .remove(filePaths);

        if (deletePhotoError) {
          console.warn(`Could not delete photos for listing ${listingId}:`, deletePhotoError.message);
        }
      }

      dismissToast(toastId);
      showSuccess('Annuncio eliminato con successo!');
      fetchListings(); // Refresh the list
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante l\'eliminazione dell\'annuncio.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800">Gestione Annunci</h2>
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : listings.length === 0 ? (
        <p className="text-gray-600">Nessun annuncio trovato.</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Titolo</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Città</TableHead>
                <TableHead>Creato il</TableHead>
                <TableHead>Scade il</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listings.map((listing) => (
                <TableRow key={listing.id}>
                  <TableCell className="font-medium">{listing.title}</TableCell>
                  <TableCell className="capitalize">{listing.category.replace(/-/g, ' ')}</TableCell>
                  <TableCell>{listing.city}</TableCell>
                  <TableCell>{new Date(listing.created_at).toLocaleDateString('it-IT')}</TableCell>
                  <TableCell>{new Date(listing.expires_at).toLocaleDateString('it-IT')}</TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    <Link to={`/listing/${listing.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" disabled={deletingId === listing.id}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Questa azione eliminerà definitivamente l'annuncio "{listing.title}" e tutte le sue foto.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annulla</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteListing(listing.id)}
                            className="bg-destructive hover:bg-destructive/90"
                            disabled={deletingId === listing.id}
                          >
                            {deletingId === listing.id ? 'Eliminazione...' : 'Sì, elimina'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};