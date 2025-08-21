import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';
import { usePullToRefresh, PULL_THRESHOLD } from '@/hooks/usePullToRefresh'; // Importa l'hook e la soglia
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  session: any;
  isAdmin: boolean;
  isSupporto: boolean;
}

const Layout = ({ session, isAdmin, isSupporto }: LayoutProps) => {
  const { isPulling, pullDistance } = usePullToRefresh();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Indicatore Pull-to-refresh */}
      <div
        className={cn(
          "fixed top-0 left-0 w-full flex justify-center items-center z-[9999] transition-all duration-100 ease-out",
          isPulling ? "opacity-100" : "opacity-0"
        )}
        style={{
          height: `${pullDistance}px`,
          backgroundColor: `rgba(255, 255, 255, ${Math.min(1, pullDistance / PULL_THRESHOLD)})`, // Sfondo che sfuma in base allo scorrimento
          pointerEvents: 'none', // Assicura che non blocchi le interazioni
        }}
      >
        {pullDistance > 0 && ( // Mostra lo spinner appena inizia lo scorrimento
          <Loader2 
            className={cn(
              "h-6 w-6 text-rose-500 transition-opacity duration-100",
              pullDistance >= PULL_THRESHOLD ? "animate-spin opacity-100" : "opacity-50"
            )} 
            style={{ transform: `scale(${Math.min(1, pullDistance / (PULL_THRESHOLD / 2))})` }} // Scala lo spinner più aggressivamente
          />
        )}
      </div>

      <Header session={session} isAdmin={isAdmin} isSupporto={isSupporto} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;