import { Link, useNavigate } from 'react-router-dom';
import { Heart, LogOut, User, PlusCircle, Shield, LogIn, LayoutGrid, Wallet, Settings, Ticket, Bell } from 'lucide-react'; // Aggiunto Bell icona
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAdminNotifications } from '@/hooks/useAdminNotifications'; // Importa il nuovo hook
import { Badge } from '@/components/ui/badge'; // Importa Badge
import { formatDistanceToNow } from 'date-fns'; // Per formattare il tempo
import { it } from 'date-fns/locale'; // Per la lingua italiana

interface HeaderProps {
  session: any;
  isAdmin: boolean;
}

export const Header = ({ session, isAdmin }: HeaderProps) => {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useAdminNotifications(isAdmin);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleNotificationClick = (notificationId: string, type: string, entityId: string) => {
    markAsRead(notificationId);
    if (type === 'new_report') {
      navigate(`/admin`); // Reports are managed in admin dashboard
    } else if (type === 'ticket_reply') {
      navigate(`/my-tickets/${entityId}`); // Navigate to ticket details
    }
  };

  console.log("Header: isAdmin prop received:", isAdmin);

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-rose-600">
          <Heart className="h-8 w-8" />
          <span>Incontri Dolci</span>
        </Link>
        <nav>
          {session ? (
            <div className="flex items-center gap-4">
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Bell className="h-6 w-6" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full bg-red-500 text-white text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-80" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal flex justify-between items-center">
                      <span>Notifiche ({unreadCount})</span>
                      {unreadCount > 0 && (
                        <Button variant="link" size="sm" onClick={markAllAsRead} className="h-auto p-0 text-xs">
                          Segna tutte come lette
                        </Button>
                      )}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {loading ? (
                      <DropdownMenuItem disabled>Caricamento notifiche...</DropdownMenuItem>
                    ) : notifications.length === 0 ? (
                      <DropdownMenuItem disabled>Nessuna nuova notifica.</DropdownMenuItem>
                    ) : (
                      notifications.map((notification) => (
                        <DropdownMenuItem
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification.id, notification.type, notification.entity_id)}
                          className="flex flex-col items-start space-y-1 py-2 cursor-pointer"
                          style={{ backgroundColor: notification.is_read ? 'transparent' : 'rgba(255, 192, 203, 0.1)' }} // Light pink for unread
                        >
                          <p className="text-sm font-medium leading-none">{notification.message}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: it })}
                          </p>
                        </DropdownMenuItem>
                      ))
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Link to="/new-listing">
                <Button className="bg-rose-500 hover:bg-rose-600 hidden sm:flex items-center gap-2">
                  <PlusCircle className="h-5 w-5" />
                  <span>Crea annuncio</span>
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <User className="h-6 w-6" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">My Account</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Pannello Controllo</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <User className="mr-2 h-4 w-4" /> {/* Icona Utente per Dashboard */}
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-listings')}>
                    <LayoutGrid className="mr-2 h-4 w-4" /> {/* Icona 4 quadrati per I miei Annunci */}
                    <span>I miei Annunci</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/credit-history')}>
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Crediti</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-tickets')}> {/* Nuovo link per I Miei Ticket */}
                    <Ticket className="mr-2 h-4 w-4" />
                    <span>I Miei Ticket</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile-settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Impostazioni</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <Button 
              onClick={() => navigate('/auth?tab=login')} 
              className="bg-rose-500 hover:bg-rose-600 text-white flex items-center gap-2"
            >
              <LogIn className="h-5 w-5" />
              <span>Accedi / Registrati</span>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
};