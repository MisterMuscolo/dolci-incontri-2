import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
// ... (resto degli import)

const Auth = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('login');
  // ... (resto dello stato)

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'login' || tab === 'register') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <Tabs defaultValue={activeTab} value={activeTab} className="w-full">
          {/* ... (resto del codice) */}
        </Tabs>
      </div>
    </div>
  );
};