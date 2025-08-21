import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { showError } from '@/utils/toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Ticket, PlusCircle, ChevronLeft, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { CreateTicketDialog } from '@/components/CreateTicketDialog'; // Importa il nuovo componente

interface TicketItem {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  last_replied_by: 'user' | 'admin' | 'supporto'; // Aggiornato per includere 'supporto'
  listing_id: string | null;
  listings: { title: string } | null; // Corretto: singolo oggetto o null
  user_id: string | null; // Può essere null
  reporter_email: string | null; // Nuova colonna
}

const MyTickets = () => {
  console.log("MyTickets component is rendering."); // Aggiunto per il debug
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError("Utente non autenticato. Accedi per visualizzare i tuoi ticket.");
        setLoading(false);
        return;
      }

      // Fetch tickets where user_id matches current user OR reporter_email matches current user's email
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          subject,
          status,
          created_at,
          updated_at,
          last_replied_by,
          listing_id,
          listings ( title ),
          user_id,
          reporter_email
        `)
        .or(`user_id.eq.${user.id},reporter_email.eq.${user.email}`) // RLS policy should handle this, but explicit filter helps
        .order('updated_at', { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        showError("Impossibile caricare i tuoi ticket.");
        setError("Impossibile caricare i tuoi ticket.");
      } else {
        setTickets(data as TicketItem[]);
      }
      setLoading(false);
    };

    fetchTickets();
  }, []);

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

  const getLastRepliedByLabel = (lastRepliedBy: 'user' | 'admin' | 'supporto') => {
    console.log("MyTickets: last_replied_by value:", lastRepliedBy); // ADDED LOG
    switch (lastRepliedBy) {
      case 'user':
        return 'Tu';
      case 'admin':
      case 'supporto': // Unifica Admin e Supporto
        return 'Supporto';
      default:
        return 'N/D';
    }
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            Indietro
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">I Miei Ticket</h1>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Ticket className="h-6 w-6 text-rose-500" />
              Le tue richieste di supporto
            </CardTitle>
            <CreateTicketDialog
              triggerButton={
                <Button className="bg-rose-500 hover:bg-rose-600">
                  <PlusCircle className="h-4 w-4 mr-2" /> Nuovo Ticket
                </Button>
              }
              dialogTitle="Apri un nuovo Ticket"
              dialogDescription="Compila il modulo sottostante per inviare una richiesta di supporto o una domanda."
              icon={Ticket}
              initialSubject="Nuovo ticket di supporto" // Passa un soggetto iniziale
              redirectPathOnAuth="/my-tickets"
            />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : error ? (
              <p className="text-red-500 text-center py-8">{error}</p>
            ) : tickets.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Non hai ancora aperto nessun ticket.</p>
                <CreateTicketDialog
                  triggerButton={
                    <Button className="bg-rose-500 hover:bg-rose-600 mt-4">Apri il tuo primo ticket</Button>
                  }
                  dialogTitle="Apri un nuovo Ticket"
                  dialogDescription="Compila il modulo sottostante per inviare una richiesta di supporto o una domanda."
                  icon={Ticket}
                  initialSubject="Nuovo ticket di supporto" // Passa un soggetto iniziale
                  redirectPathOnAuth="/my-tickets"
                />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Oggetto</TableHead>
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
                        <TableCell className="font-medium">{ticket.subject}</TableCell>
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
                          {getLastRepliedByLabel(ticket.last_replied_by)}
                        </TableCell>
                        <TableCell>{format(new Date(ticket.created_at), 'dd/MM/yyyy', { locale: it })}</TableCell>
                        <TableCell className="text-right">
                          <Link to={`/my-tickets/${ticket.id}`}>
                            <Button variant="outline" size="sm">
                              <MessageSquare className="h-4 w-4 mr-1" /> Visualizza
                            </Button>
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MyTickets;