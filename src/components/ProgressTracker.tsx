import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { callGemini } from '../services/gemini';
import { ViewHeader } from './ViewHeader';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Sparkles, BrainCircuit, Scale, TrendingUp } from 'lucide-react';

interface ProgressTrackerProps {
  setView: (view: string) => void;
}

interface ProgressEntry {
  id: string;
  date: string;
  weight: number;
  createdAt: any;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({ setView }) => {
  const [progressData, setProgressData] = useState<ProgressEntry[]>([]);
  const [weight, setWeight] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const { getUserId } = useAuth();
  const userId = getUserId();

  useEffect(() => {
    if (!userId) return;
    
    const progressQuery = query(collection(db, `artifacts/${appId}/users/${userId}/progress`));
    const unsubscribe = onSnapshot(progressQuery, (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as ProgressEntry))
        .sort((a, b) => a.date.localeCompare(b.date));
      setProgressData(data);
    });
    
    return () => unsubscribe();
  }, [userId]);

  const addProgressEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/progress`), { 
        userId, 
        date: today, 
        weight: parseFloat(weight), 
        createdAt: serverTimestamp() 
      });
      setWeight('');
    } catch (error) {
      console.error("Error logging progress: ", error);
    }
  };

  const getAiSummary = async () => {
    if (progressData.length < 2) return;
    setIsSummarizing(true);
    setAiSummary('');
    
    const dataString = progressData.map(p => `${p.date}: ${p.weight}kg`).join(', ');
    const prompt = `Act as a positive and motivational fitness coach. The user is a 55kg male in Ghana trying to do a 3-month body recomposition (build muscle, lose fat). His starting weight was around 55kg. Based on this weight progress data, write a short, encouraging summary (2-3 sentences). Point out the trend (gaining, losing, maintaining) and what it means for his goal. Offer one simple, actionable tip for the upcoming week. Data: ${dataString}`;
    
    try {
      const result = await callGemini(prompt);
      setAiSummary(result);
    } catch (error) {
      setAiSummary("Sorry, the AI coach couldn't generate a summary right now. Please try again later.");
    } finally {
      setIsSummarizing(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <ViewHeader title="Track Your Progress" setView={setView} />
      
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center">
          <Scale className="text-purple-400 mr-3" size={24} />
          Log Weekly Weigh-In
        </h3>
        <form onSubmit={addProgressEntry} className="flex items-end gap-6">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Current Weight (kg)
            </label>
            <input 
              type="number" 
              step="0.1" 
              value={weight} 
              onChange={e => setWeight(e.target.value)} 
              placeholder="e.g., 55.5" 
              className="w-full bg-gray-700 border border-gray-600 rounded-xl p-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition-all duration-200 text-white placeholder-gray-400" 
            />
          </div>
          <button 
            type="submit" 
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105"
          >
            Log Weight
          </button>
        </form>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 mb-8">
        <h3 className="text-2xl font-semibold mb-6 flex items-center">
          <Sparkles className="text-yellow-400 mr-3" size={24} />
          Your AI Coach
        </h3>
        <button 
          onClick={getAiSummary} 
          disabled={isSummarizing || progressData.length < 2} 
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold py-4 px-4 rounded-xl flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:transform-none"
        >
          {isSummarizing ? (
            <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3"></div>
          ) : (
            <BrainCircuit size={20} className="mr-3" />
          )}
          {isSummarizing ? "Thinking..." : "Get AI Progress Summary"}
        </button>
        {aiSummary && (
          <div className="mt-6 p-6 bg-gradient-to-r from-purple-900/50 to-purple-800/50 rounded-xl border border-purple-700">
            <p className="text-purple-100 whitespace-pre-wrap leading-relaxed">{aiSummary}</p>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700">
        <h3 className="text-2xl font-semibold mb-6 flex items-center">
          <TrendingUp className="text-green-400 mr-3" size={24} />
          Weight Journey
        </h3>
        {progressData.length > 1 ? (
          <div className="bg-gray-700/30 p-6 rounded-xl">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                <XAxis 
                  dataKey="date" 
                  stroke="#A0AEC0" 
                  tick={{ fontSize: 12 }} 
                />
                <YAxis 
                  stroke="#A0AEC0" 
                  domain={['dataMin - 2', 'dataMax + 2']} 
                  tick={{ fontSize: 12 }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#2D3748', 
                    border: 'none', 
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }} 
                  labelStyle={{ color: '#EF4444' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#EF4444" 
                  strokeWidth={3} 
                  activeDot={{ r: 8, fill: '#EF4444' }}
                  dot={{ r: 6, fill: '#EF4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-16">
            <Scale className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">
              Log your weight at least twice to see your progress chart!
            </p>
            <p className="text-gray-500 text-sm">
              Consistency is key to tracking your transformation journey.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};