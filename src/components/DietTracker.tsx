import React, { useState, useEffect, useCallback } from 'react';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { callGemini } from '../services/gemini';
import { ViewHeader } from './ViewHeader';
import { ProgressBar } from './ProgressBar';
import { Plus, Trash2, Flame, Target, Sparkles, BrainCircuit } from 'lucide-react';

interface DietTrackerProps {
  setView: (view: string) => void;
}

interface Meal {
  id: number;
  name: string;
  calories: number;
  protein: number;
}

export const DietTracker: React.FC<DietTrackerProps> = ({ setView }) => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [aiMealDescription, setAiMealDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { getUserId } = useAuth();
  const userId = getUserId();
  const today = new Date().toISOString().split('T')[0];
  const calorieTarget = 2300;
  const proteinTarget = 100;

  const fetchTodaysLog = useCallback(async () => {
    if (!userId) return;
    const docRef = doc(db, `artifacts/${appId}/users/${userId}/dietLogs`, `${userId}_${today}`);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setMeals(docSnap.data().meals || []);
    } else {
      setMeals([]);
    }
  }, [userId, today]);

  useEffect(() => {
    fetchTodaysLog();
  }, [fetchTodaysLog]);

  const handleAiAnalyze = async () => {
    if (!aiMealDescription) return;
    setIsAnalyzing(true);
    setMealName(aiMealDescription);
    
    const prompt = `You are a nutrition expert for Ghanaian food. Analyze the following meal description and provide a reasonable estimate for its calories and protein. The user is a 55kg male trying to build muscle. Meal: "${aiMealDescription}". Respond with only a JSON object with "calories" (number) and "protein" (number) keys.`;

    const nutritionSchema = {
      type: "OBJECT",
      properties: {
        calories: { type: "NUMBER" },
        protein: { type: "NUMBER" }
      },
      required: ["calories", "protein"]
    };

    try {
      const result = await callGemini(prompt, nutritionSchema);
      const parsedResult = JSON.parse(result);
      setCalories(parsedResult.calories.toString());
      setProtein(parsedResult.protein.toString());
    } catch (error) {
      console.error('AI analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealName || !calories || !protein) return;
    
    const newMeal: Meal = { 
      name: mealName, 
      calories: parseInt(calories), 
      protein: parseInt(protein), 
      id: Date.now() 
    };
    const updatedMeals = [...meals, newMeal];
    const totalCalories = updatedMeals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = updatedMeals.reduce((sum, meal) => sum + meal.protein, 0);

    try {
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/dietLogs`, `${userId}_${today}`);
      await setDoc(docRef, { 
        userId, 
        date: today, 
        meals: updatedMeals, 
        totalCalories, 
        totalProtein, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      setMeals(updatedMeals);
      setMealName(''); 
      setCalories(''); 
      setProtein(''); 
      setAiMealDescription('');
    } catch (error) {
      console.error("Error adding meal: ", error);
    }
  };

  const deleteMeal = async (mealId: number) => {
    const updatedMeals = meals.filter(meal => meal.id !== mealId);
    const totalCalories = updatedMeals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = updatedMeals.reduce((sum, meal) => sum + meal.protein, 0);
    
    try {
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/dietLogs`, `${userId}_${today}`);
      await setDoc(docRef, { 
        userId, 
        date: today, 
        meals: updatedMeals, 
        totalCalories, 
        totalProtein, 
        updatedAt: serverTimestamp() 
      }, { merge: true });
      setMeals(updatedMeals);
    } catch (error) {
      console.error("Error deleting meal: ", error);
    }
  };

  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);

  return (
    <div className="animate-fade-in">
      <ViewHeader title="Log Your Meals" setView={setView} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 text-center">
          <h3 className="text-lg text-gray-400 mb-2 flex items-center justify-center">
            <Flame className="mr-2 text-orange-400" size={20} />
            Calories
          </h3>
          <p className="text-3xl font-bold text-red-400 mb-4">{totalCalories} / {calorieTarget}</p>
          <ProgressBar 
            current={totalCalories} 
            target={calorieTarget} 
            color="bg-gradient-to-r from-red-500 to-red-600"
            size="lg"
          />
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 text-center">
          <h3 className="text-lg text-gray-400 mb-2 flex items-center justify-center">
            <Target className="mr-2 text-sky-400" size={20} />
            Protein
          </h3>
          <p className="text-3xl font-bold text-sky-400 mb-4">{totalProtein} / {proteinTarget}</p>
          <ProgressBar 
            current={totalProtein} 
            target={proteinTarget} 
            color="bg-gradient-to-r from-sky-500 to-sky-600"
            size="lg"
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 mb-8">
        <h3 className="text-2xl font-semibold mb-2 flex items-center">
          <Sparkles className="text-yellow-400 mr-3" size={24} />
          AI-Powered Meal Entry
        </h3>
        <p className="text-gray-400 mb-6">
          Describe your meal, and let AI estimate the nutrition facts for you.
        </p>
        <div className="flex items-center gap-4">
          <input 
            type="text" 
            value={aiMealDescription} 
            onChange={e => setAiMealDescription(e.target.value)} 
            placeholder="e.g., Banku with tilapia and pepper sauce" 
            className="flex-grow bg-gray-700 border border-gray-600 rounded-xl p-4 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none transition-all duration-200 text-white placeholder-gray-400" 
          />
          <button 
            onClick={handleAiAnalyze} 
            disabled={isAnalyzing || !aiMealDescription} 
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-gray-900 font-bold py-4 px-6 rounded-xl flex items-center justify-center disabled:bg-gray-500 transition-all duration-200 transform hover:scale-105"
          >
            {isAnalyzing ? (
              <div className="animate-spin w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full mr-2"></div>
            ) : (
              <BrainCircuit size={20} className="mr-2" />
            )}
            {isAnalyzing ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 mb-8">
        <h3 className="text-2xl font-semibold mb-6 text-white">Add Meal Details</h3>
        <form onSubmit={addMeal} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-400 mb-2">Meal/Food</label>
            <input 
              type="text" 
              value={mealName} 
              onChange={e => setMealName(e.target.value)} 
              placeholder="Confirm meal name" 
              className="w-full bg-gray-700 border border-gray-600 rounded-xl p-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-all duration-200 text-white placeholder-gray-400" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Calories (kcal)</label>
            <input 
              type="number" 
              value={calories} 
              onChange={e => setCalories(e.target.value)} 
              placeholder="e.g., 500" 
              className="w-full bg-gray-700 border border-gray-600 rounded-xl p-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-all duration-200 text-white placeholder-gray-400" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Protein (g)</label>
            <input 
              type="number" 
              value={protein} 
              onChange={e => setProtein(e.target.value)} 
              placeholder="e.g., 40" 
              className="w-full bg-gray-700 border border-gray-600 rounded-xl p-4 focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-all duration-200 text-white placeholder-gray-400" 
            />
          </div>
          <button 
            type="submit" 
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="mr-2" size={20} />
            Add Meal
          </button>
        </form>
      </div>

      <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700">
        <h3 className="text-2xl font-semibold mb-6 text-white">Today's Log</h3>
        {meals.length > 0 ? (
          <div className="space-y-4">
            {meals.map(meal => (
              <div 
                key={meal.id} 
                className="bg-gray-700/50 p-6 rounded-xl flex justify-between items-center border border-gray-600 hover:border-gray-500 transition-all duration-200"
              >
                <div>
                  <p className="font-semibold text-white text-lg">{meal.name}</p>
                  <div className="flex items-center gap-6 mt-2">
                    <span className="text-sm text-red-400 flex items-center">
                      <Flame size={16} className="mr-1" />
                      {meal.calories} kcal
                    </span>
                    <span className="text-sm text-sky-400 flex items-center">
                      <Target size={16} className="mr-1" />
                      {meal.protein} g
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => deleteMeal(meal.id)} 
                  className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-2 rounded-lg hover:bg-red-900/20"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-12 text-lg">
            No meals logged yet for today.
          </p>
        )}
      </div>
    </div>
  );
};