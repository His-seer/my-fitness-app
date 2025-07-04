import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { WorkoutTracker } from './components/WorkoutTracker';
import { DietTracker } from './components/DietTracker';
import { ProgressTracker } from './components/ProgressTracker';
import { useAuth } from './hooks/useAuth';
import { Activity } from 'lucide-react';

export default function App() {
  const [view, setView] = useState('dashboard');
  const { userId, isAuthReady } = useAuth();

  const renderView = () => {
    if (!isAuthReady) {
      return (
        <div className="flex flex-col justify-center items-center h-screen bg-gray-900 text-white">
          <div className="animate-spin w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mb-8"></div>
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Loading Your Dashboard...</h2>
            <p className="text-gray-400">Setting up your personalized fitness experience</p>
          </div>
        </div>
      );
    }

    switch (view) {
      case 'workout': 
        return <WorkoutTracker setView={setView} />;
      case 'diet': 
        return <DietTracker setView={setView} />;
      case 'progress': 
        return <ProgressTracker setView={setView} />;
      default: 
        return <Dashboard setView={setView} userId={userId} />;
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen font-sans">
      <div className="container mx-auto p-6 max-w-6xl">
        {renderView()}
      </div>
      
      {/* Subtle background pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, #ef4444 0%, transparent 50%), 
                           radial-gradient(circle at 75% 75%, #0ea5e9 0%, transparent 50%)`,
          backgroundSize: '100px 100px'
        }}></div>
      </div>
    </div>
  );
}