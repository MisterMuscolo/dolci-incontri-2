import { Outlet } from 'react-router-dom';
import { Header } from './Header';

interface LayoutProps {
  session: any;
  isAdmin: boolean;
  isCollaborator: boolean; // Aggiunto isCollaborator
}

const Layout = ({ session, isAdmin, isCollaborator }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header session={session} isAdmin={isAdmin} isCollaborator={isCollaborator} /> {/* Passa isCollaborator a Header */}
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;