import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer'; // Importa il componente Footer
// Rimosso: import { PWAInstallInstructions } from './PWAInstallInstructions'; // Importa il componente PWAInstallInstructions

interface LayoutProps {
  session: any;
  isAdmin: boolean;
  isSupporto: boolean; // Rinomina da isCollaborator a isSupporto
}

const Layout = ({ session, isAdmin, isSupporto }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header session={session} isAdmin={isAdmin} isSupporto={isSupporto} /> {/* Passa isSupporto a Header */}
      <main className="flex-grow">
        <Outlet />
      </main>
      {/* Rimosso: <PWAInstallInstructions /> */}
      <Footer />
    </div>
  );
};

export default Layout;