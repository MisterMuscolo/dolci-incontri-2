import { useLocation, useNavigate } from 'react-router-dom';
import { useCallback } from 'react';

const routeNames: { [key: string]: string } = {
  '/': 'Homepage',
  '/dashboard': 'Dashboard',
  '/my-listings': 'I miei Annunci',
  '/profile-settings': 'Impostazioni Profilo',
  '/credit-history': 'Cronologia Crediti',
  '/my-tickets': 'I miei Ticket',
  '/my-coupons': 'I miei Coupon',
  '/admin': 'Pannello Controllo',
  '/search': 'Risultati Ricerca',
  '/new-listing': 'Crea Annuncio',
  '/buy-credits': 'Acquista Crediti',
  '/termini': 'Termini e Condizioni',
  '/privacy': 'Privacy Policy',
  '/new-ticket': 'Nuovo Ticket',
  '/registration-success': 'Registrazione Completata',
  '/change-password': 'Cambia Password',
  '/banned': 'Accesso Negato',
  // Prefissi per rotte dinamiche
  '/listing/': 'Dettagli Annuncio',
  '/edit-listing/': 'Modifica Annuncio',
  '/promote-listing/': 'Promuovi Annuncio',
  '/my-tickets/': 'Dettagli Ticket',
  '/admin/users/': 'Annunci Utente',
};

export const useDynamicBackLink = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getPreviousPath = useCallback(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const currentPath = '/' + pathSegments.join('/'); // Reconstruct current path without trailing slash

    if (currentPath === '/') {
      return '/'; // Already at root, back to root
    }

    // Specific child-parent mappings
    if (currentPath.startsWith('/listing/')) return '/search';
    if (currentPath.startsWith('/edit-listing/')) return '/my-listings';
    if (currentPath.startsWith('/promote-listing/')) return '/my-listings';
    if (currentPath.startsWith('/my-tickets/') && pathSegments.length > 1) return '/my-tickets';
    if (currentPath.startsWith('/admin/users/') && pathSegments.length > 3 && pathSegments[3] === 'listings') return '/admin';
    if (currentPath === '/change-password') return '/profile-settings';
    if (currentPath === '/new-ticket') return '/my-tickets';
    if (currentPath === '/registration-success') return '/auth'; // Logical parent for registration success

    // For top-level routes that don't have a specific logical parent other than the homepage,
    // we return null so getBackLinkText can show "Indietro".
    const topLevelRoutes = ['/search', '/dashboard', '/admin', '/buy-credits', '/profile-settings', '/my-listings', '/my-coupons', '/termini', '/privacy', '/auth', '/banned'];
    if (topLevelRoutes.includes(currentPath)) {
      return null;
    }

    // Default: go up one level in the path
    if (pathSegments.length > 0) {
      return '/' + pathSegments.slice(0, pathSegments.length - 1).join('/');
    }
    
    return '/'; // Fallback to homepage
  }, [location.pathname]);

  const backPath = getPreviousPath(); // Calcola il percorso di destinazione

  const getBackLinkText = useCallback(() => {
    if (backPath === null) {
      return 'Indietro'; // Usa 'Indietro' generico se non c'è un genitore logico specifico
    }
    // Gestisce rotte dinamiche con prefissi
    for (const prefix in routeNames) {
      if (backPath.startsWith(prefix) && prefix.endsWith('/')) {
        return `Torna a ${routeNames[prefix]}`;
      }
    }

    // Gestisce corrispondenze esatte
    if (routeNames[backPath]) {
      return `Torna a ${routeNames[backPath]}`;
    }

    // Fallback per percorsi sconosciuti o complessi
    return 'Indietro';
  }, [backPath]);

  const handleNavigateBack = useCallback(() => {
    navigate(-1); // Naviga semplicemente indietro nella cronologia del browser
  }, [navigate]);

  return { getBackLinkText, handleNavigateBack, backPath };
};