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

    if (pathSegments.length === 0) {
      return '/'; // Già alla root
    }

    // Gestisce pagine "figlie" specifiche e i loro genitori logici
    if (pathSegments[0] === 'change-password') return '/profile-settings';
    if (pathSegments[0] === 'new-ticket') return '/my-tickets';
    if (pathSegments[0] === 'listing' && pathSegments[1]) return '/search'; // Da dettagli annuncio a risultati ricerca
    if (pathSegments[0] === 'edit-listing' && pathSegments[1]) return '/my-listings';
    if (pathSegments[0] === 'promote-listing' && pathSegments[1]) return '/my-listings';
    if (pathSegments[0] === 'my-tickets' && pathSegments[1]) return '/my-tickets'; // Da dettagli ticket a lista ticket
    if (pathSegments[0] === 'admin' && pathSegments[1] === 'users' && pathSegments[2] && pathSegments[3] === 'listings') return '/admin'; // Da annunci utente a dashboard admin

    // Default: risali di un livello nel percorso
    if (pathSegments.length > 1) {
      return '/' + pathSegments.slice(0, pathSegments.length - 1).join('/');
    }
    return '/'; // Fallback alla homepage
  }, [location.pathname]);

  const getBackLinkText = useCallback(() => {
    const previousPath = getPreviousPath();
    
    // Gestisce rotte dinamiche con prefissi
    for (const prefix in routeNames) {
      if (previousPath.startsWith(prefix) && prefix.endsWith('/')) {
        return `Torna a ${routeNames[prefix]}`;
      }
    }

    // Gestisce corrispondenze esatte
    if (routeNames[previousPath]) {
      return `Torna a ${routeNames[previousPath]}`;
    }

    // Fallback per percorsi sconosciuti o complessi
    return 'Indietro';
  }, [getPreviousPath]);

  const handleGoBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  return { getBackLinkText, handleGoBack };
};