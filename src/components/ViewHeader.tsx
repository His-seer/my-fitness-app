import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface ViewHeaderProps {
  title: string;
  setView: (view: string) => void;
}

export const ViewHeader: React.FC<ViewHeaderProps> = ({ title, setView }) => (
  <header className="flex items-center mb-8">
    <button 
      onClick={() => setView('dashboard')} 
      className="p-3 rounded-xl bg-gray-800 hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 mr-4 shadow-lg"
    >
      <ChevronLeft size={24} className="text-red-400" />
    </button>
    <h1 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
      {title}
    </h1>
  </header>
);