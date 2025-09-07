import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { showError, showSuccess, showLoading, dismissToast } from '@/utils/toast';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { ChevronLeft, MessageSquare, Send, User, Shield, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useDynamicBackLink } from '@/hooks/useDynamicBackLink';

interface TicketMessage {
  id: string;
  sender_id: string | null; // Può essere null
  sender_email: string | null; // Nuova colonna
  message_content: string;
  created_at: string;
  profiles: { email: string; role: string }[] | null; // Corretto: ora è un array di oggetti
}

interface TicketDetailsData {
  id: string;
  subject: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  created_at: string;
  updated_at: string;
  last_replied_by: 'user' | 'admin' | 'supporto';
  listing_id: string | null;
  listings: { title: string }[] | null; // Corretto: ora è un array di oggetti
  ticket_messages: TicketMessage[];
  user_id: string | null; // Può essere null
  reporter_email: string | null; // Nuova colonna
}

const TicketDetails = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<TicketDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null); // Nuovo stato per il ruolo dell'utente
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getBackLinkText, handleGoBack } = useDynamicBackLink();

  const fetchTicketDetails = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      showError("Utente non autenticato. Effettua il login per visualizzare i dettagli del ticket.");
      navigate('/auth');
      return;
    }
    setCurrentUserId(user.id);

    // Fetch user role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching user profile:", profileError);
      showError("Impossibile recuperare il ruolo dell'utente.");
      setCurrentUserRole(null);
    } else {
      setCurrentUserRole(profile.role);
    }

    const { data, error } = await supabase
      .from('tickets')
      .select(`
        id,
        user_id,
        reporter_email,
        subject,
        status,
        created_at,
        updated_at,
        last_replied_by,
        listing_id,
        listings ( title ),
        ticket_messages (
          id,
          sender_id,
          sender_email,
          message_content,
          created_at,
          profiles ( email, role )
        )
      `)
      .eq('id', ticketId)
      .single();

    if (error || !data) {
      console.error("Error fetching ticket details:", error);
      showError("Impossibile caricare i dettagli del ticket.");
      navigate('/my-tickets');
    } else {
      const sortedMessages = (data.ticket_messages || []).sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      setTicket({ ...data, ticket_messages: sortedMessages } as TicketDetailsData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.ticket_messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ticketId) {
      showError('Il messaggio non può essere vuoto.');
      return;
    }

    setIsSending(true);
    const toastId = showLoading('Invio messaggio...');

    try {
      const { error } = await supabase.functions.invoke('add-ticket-message', {
        body: {
          ticketId: ticketId,
          messageContent: newMessage.trim(),
        },
      });

      dismissToast(toastId);

      if (error) {
        let errorMessage = 'Errore durante l\'invio del messaggio.';
        // @ts-ignore
        if (error.context && typeof error.context.body === 'string') {
          try {
            // @ts-ignore
            const errorBody = JSON.parse(error.context.body);
            if (errorBody.error) {
              errorMessage = errorBody.error;
            }
          } catch (e) {
            console.error("Could not parse error response from edge function:", e);
          }
        }
        throw new Error(errorMessage);
      }

      showSuccess('Messaggio inviato!');
      setNewMessage('');
      fetchTicketDetails();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Si è verificato un errore imprevisto.');
    } finally {
      setIsSending(false);
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

  const handleResolveTicket = async () => {
    if (!ticketId || !ticket) return;
    setIsSending(true);
    const toastId = showLoading('Risoluzione ticket in corso...');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Utente non autenticato.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Impossibile recuperare il ruolo dell\'utente corrente.');
      }

      const senderRole = profile.role as 'admin' | 'supporto';

      const { error } = await supabase
        .from('tickets')
        .update({ status: 'resolved', updated_at: new Date().toISOString(), last_replied_by: senderRole })
        .eq('id', ticketId);

      dismissToast(toastId);

      if (error) {
        throw new Error(error.message);
      }

      showSuccess('Ticket risolto con successo!');
      
      const { error: notifyError } = await supabase.functions.invoke('notify-user-ticket-status', {
        body: {
          ticketId: ticket.id,
          newStatus: 'resolved',
          userId: ticket.user_id, // Use ticket.user_id (can be null)
          ticketSubject: ticket.subject,
        },
      });

      if (notifyError) {
        console.error("Error notifying user about ticket status:", notifyError);
        showError("Errore durante la notifica all'utente.");
      } else {
        showSuccess("Notifica inviata all'utente.");
      }

      fetchTicketDetails();
    } catch (error: any) {
      dismissToast(toastId);
      showError(error.message || 'Errore durante la risoluzione del ticket.');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-50 p-4 sm:p-6 md:p-8 min-h-screen">
        <div className="max-w-3xl mx-auto space-y-8">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!ticket) {
    return <div className="text-center py-20">Ticket non trovato.</div>;
  }

  const isTicketClosed = ticket.status === 'resolved' || ticket.status === 'closed';
  const canResolveTicket = currentUserRole === 'admin' || currentUserRole === 'supporto'; // Controllo del ruolo

  const getSenderDisplay = (message: TicketMessage) => {
    // Determine if the sender is the current user
    const isCurrentUserSender = message.sender_id === currentUserId;

    // Determine if the sender is an Admin or Supporto
    const isSenderAdmin = message.profiles?.[0]?.role === 'admin';
    const isSenderSupporto = message.profiles?.[0]?.role === 'supporto';

    // Display for Admin
    if (isSenderAdmin) {
      return (
        <>
          <Shield className="h-4 w-4 text-purple-400" /> Admin
        </>
      );
    }
    // Display for Supporto
    else if (isSenderSupporto) {
      return (
        <>
          <Shield className="h-4 w-4 text-purple-400" /> Supporto
        </>
      );
    }
    // Display for the current user (who is not admin/supporto)
    else if (isCurrentUserSender) {
      // Use the email from the message's profile if available, otherwise fallback to reporter_email from the ticket
      const displayEmail = message.profiles?.[0]?.email || ticket?.reporter_email || 'Email non disponibile';
      return (
        <>
          <User className="h-4 w-4" /> Utente ({displayEmail})
        </>
      );
    }
    // Display for other users (e.g., if an admin is viewing a ticket from another user)
    // Or for initial messages from unauthenticated users (sender_id is null, sender_email is present)
    else if (message.sender_email) {
      return (
        <>
          <User className="h-4 w-4" /> Utente ({message.sender_email})
        </>
      );
    }
    // Fallback for unknown sender
    else {
      return (
        <>
          <User className="h-4 w-4" /> Utente Sconosciuto
        </>
      );
    }
  };

  return (
    <div className="bg-gray-50 p-4 sm:p-6 md:p-8 min-h-screen">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleGoBack} className="text-gray-600 hover:text-gray-800">
            <ChevronLeft className="h-5 w-5 mr-2" />
            {getBackLinkText()}
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">Ticket #{ticket.id.substring(0, 8)}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <MessageSquare className="h-6 w-6 text-rose-500" />
              {ticket.subject}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              Stato: <Badge variant={getStatusBadgeVariant(ticket.status)} className="capitalize">{getStatusLabel(ticket.status)}</Badge>
              {ticket.listing_id && (
                <Link to={`/listing/${ticket.listing_id}`} className="text-blue-500 hover:underline flex items-center gap-1">
                  <LinkIcon className="h-4 w-4" /> Annuncio: {ticket.listings?.[0]?.title || 'N/D'}
                </Link>
              )}
            </CardDescription>
            <p className="text-sm text-gray-500 mt-2">
              Creato il: {format(new Date(ticket.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}
              {ticket.user_id === null && ticket.reporter_email && (
                <span className="ml-2">(da: {ticket.reporter_email})</span>
              )}
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto p-2 border rounded-md bg-gray-100">
              {ticket.ticket_messages.length === 0 ? (
                <p className="text-center text-gray-600">Nessun messaggio in questo ticket.</p>
              ) : (
                ticket.ticket_messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender_id === currentUserId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] p-3 rounded-lg shadow-sm ${
                        message.sender_id === currentUserId
                          ? 'bg-rose-500 text-white rounded-br-none'
                          : 'bg-white text-gray-800 rounded-bl-none'
                      }`}
                    >
                      <p className="font-semibold text-sm mb-1 flex items-center gap-1">
                        {getSenderDisplay(message)}
                      </p>
                      <p className="text-sm">{message.message_content}</p>
                      <p className="text-xs mt-1 opacity-80">
                        {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', { locale: it })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {!isTicketClosed && (
              <div className="mt-4 flex flex-col gap-2">
                <Textarea
                  placeholder="Scrivi un messaggio..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="min-h-[80px]"
                  disabled={isSending}
                />
                <div className="flex justify-between items-center gap-2">
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSending || !newMessage.trim()}
                    className="bg-rose-500 hover:bg-rose-600 flex-grow"
                  >
                    <Send className="h-4 w-4 mr-2" /> {isSending ? 'Invio...' : 'Invia Messaggio'}
                  </Button>
                  {canResolveTicket && ticket.status !== 'closed' && ( // Condizione aggiunta qui
                    <Button
                      variant="outline"
                      onClick={handleResolveTicket}
                      disabled={isSending}
                      className="border-gray-400 text-gray-600 hover:bg-gray-100"
                    >
                      Risolvi Ticket
                    </Button>
                  )}
                </div>
              </div>
            )}
            {isTicketClosed && (
              <p className="text-center text-gray-600 mt-4">Questo ticket è stato {getStatusLabel(ticket.status).toLowerCase()}. Non è possibile inviare ulteriori messaggi.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TicketDetails;