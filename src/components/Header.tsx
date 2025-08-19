import { Link, useNavigate } from 'react-router-dom';
import { Heart, LogOut, User, PlusCircle, Shield, LogIn, LayoutGrid, Wallet, Settings } from 'lucide-react'; // Aggiunto LogIn icona e altre icone per il menu
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

interface HeaderProps {
  session: any;
  isAdmin: boolean;
}

export const Header = ({ session, isAdmin }: HeaderProps) => {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  console.log("Header: isAdmin prop received:", isAdmin);

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 text-2xl font-bold text-rose-600">
          <Heart className="h-8 w-8" />
          <span>Dolci Incontri</span>
        </Link>
        <nav>
          {session ? (
            <div className="flex items-center gap-4">
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
                    <LayoutGrid className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/my-listings')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>I miei Annunci</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/credit-history')}>
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Crediti</span>
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