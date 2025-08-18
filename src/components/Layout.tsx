import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Footer } from './Footer';

interface LayoutProps {
  session: any;
}

const Layout = ({ session }: LayoutProps) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header session={session} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default Layout;