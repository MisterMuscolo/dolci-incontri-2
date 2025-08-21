import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

interface Ticket {
  id: string;
  user_id: string;
  listing_id: string | null;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  last_replied_by: 'user' | 'admin';
  profiles: { email: string } | null; // Corretto: singolo oggetto o null
  listings: { title: string } | null; // Corretto: singolo oggetto o null
}

export const TicketManagementTable = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchTickets = async () => {
    setLoading(true);
    console.log("TicketManagementTable: Inizio fetchTickets...");
    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        user_id,
        listing_id,
        subject,
        status,
        created_at,
        updated_at,
        last_replied_by,
        profiles ( email ),
        listings ( title )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("TicketManagementTable: Errore nel recupero dei ticket:", error);
      showError("Impossibile caricare i ticket.");
    } else {
      console.log("TicketManagementTable: Dati ticket ricevuti:", data);
      if (data && data.length === 0) {
        console.log("TicketManagementTable: Nessun ticket trovato nel database per l'admin.");
      }
      setTickets(data as Ticket[]);
    }
    setLoading(false);
    console.log("TicketManagementTable: Fine fetchTickets.");
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: 'in_progress' | 'resolved' | 'closed', userId: string, ticketSubject: string) => {
    setActionLoadingId(ticketId);
    const toastId = showLoading(`Aggiornamento stato ticket...`);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utente non autenticato.');
      }

      const { error } = await supabase
        .from('tickets')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
          last_replied_by: 'admin', // Assume admin is changing status
        })
        .eq('id', ticketId);

      dismissToast(toastId);

      if (error) {
        throw new Error(error.message);
      }

      showSuccess(`Stato ticket aggiornato a "${newStatus}" con successo!`);
      
      // If status is resolved, notify the user
      if (newStatus === 'resolved') {
        const { error: notifyError } = await supabase.functions.invoke('notify-user-ticket-status', {
          body: {
            ticketId: ticketId,
            newStatus: newStatus,
            userId: userId,
            ticketSubject: ticketSubject,
          },
        });

        if (notifyError) {
          console.error("Error notifying user about ticket status:", notifyError);
          showError("Errore durante la notifica all'utente.");
        } else {
          showSuccess("Notifica inviata all'utente.");
        }
      }

      fetchTickets(); // Refresh the list
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante l\'aggiornamento dello stato del ticket.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in_progress':
        return 'secondary';
      case 'resolved':
        return 'default';
      case 'closed':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Aperto';
      case 'in_progress':
        return 'In Corso';
      case 'resolved':
        return 'Risolto';
      case 'closed':
        return 'Chiuso';
      default:
        return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <MessageSquare className="h-5 w-5 text-rose-500" /> Gestione Ticket
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-gray-600">Nessun ticket trovato.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Ticket</TableHead>
                  <TableHead>Oggetto</TableHead>
                  <TableHead>Utente</TableHead>
                  <TableHead>Annuncio</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Ultima Risposta</TableHead>
                  <TableHead>Creato il</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.id.substring(0, 8)}</TableCell>
                    <TableCell>{ticket.subject}</TableCell>
                    <TableCell>{ticket.profiles?.email || 'N/D'}</TableCell>
                    <TableCell>
                      {ticket.listing_id ? (
                        <Link to={`/listing/${ticket.listing_id}`} className="text-blue-500 hover:underline">
                          {ticket.listings?.title || 'Annuncio'}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(ticket.status)} className="capitalize">
                        {getStatusLabel(ticket.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">
                      {ticket.last_replied_by === 'user' ? 'Utente' : 'Admin'}
                    </TableCell>
                    <TableCell>{format(new Date(ticket.created_at), 'dd/MM/yyyy', { locale: it })}</TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Link to={`/my-tickets/${ticket.id}`}> {/* Gli admin usano la stessa pagina di dettaglio */}
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" /> Visualizza
                        </Button>
                      </Link>
                      {(ticket.status === 'open' || ticket.status === 'in_progress') && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="default" size="sm" disabled={actionLoadingId === ticket.id} className="bg-green-600 hover:bg-green-700">
                              <XCircle className="h-4 w-4 mr-1" /> Risolto
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Conferma risoluzione ticket</AlertDialogTitle>
                              <AlertDialogDescription>
                                Sei sicuro di voler contrassegnare questo ticket come "Risolto"?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleUpdateTicketStatus(ticket.id, 'resolved', ticket.user_id, ticket.subject)}
                                disabled={actionLoadingId === ticket.id}
                              >
                                {actionLoadingId === ticket.id ? 'Risoluzione...' : 'Sì, risolvi'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};