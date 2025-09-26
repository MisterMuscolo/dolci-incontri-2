"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ... other imports

const App = lazy(() => import('@/App'));

function MyApp({ children }) {
  return (
    <App>
      {children}
    </App>
  );
}

export default MyApp;