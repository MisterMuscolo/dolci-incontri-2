import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  session: any;
  isAdmin: boolean; // Aggiunto isAdmin
}

const Layout = ({ session, isAdmin }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header session={session} isAdmin={isAdmin} /> {/* Passa isAdmin a Header */}
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;