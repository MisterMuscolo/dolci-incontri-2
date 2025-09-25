"use client";

import React from 'react';
import { Home, Heart } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-red-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <div className="mb-6 flex justify-center items-center gap-2 text-3xl font-bold">
            <Home size={32} />
            <span>IncontriDolci</span>
          </div>
          <div className="mt-4 text-xl text-gray-700">
            Incontri Dolci per te
          </div>
        </div>

        {/* Rest of your existing content */}
      </div>
    </div>
  );
}

export default App;