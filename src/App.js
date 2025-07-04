import React, { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChevronLeft, Dumbbell, Utensils, TrendingUp, CheckCircle, Target, Info, Plus, Trash2, Flame, Beef, Sparkles, BrainCircuit, AlertTriangle } from 'lucide-react';

// --- Firebase Configuration ---
// NOTE: These variables are placeholders and will be provided by the environment.
// In a local setup, you would replace these with your actual Firebase config.
const firebaseConfig = {
  apiKey: "AIzaSyCjtUN3BvFoLryvO8Lj5lQlYP2kTqKdySU",
  authDomain: "my-fitness-tracker-a8760.firebaseapp.com",
  projectId: "my-fitness-tracker-a8760",
  storageBucket: "my-fitness-tracker-a8760.firebasestorage.app",
  messagingSenderId: "585707730478",
  appId: "1:585707730478:web:e15e6743760be2a3d891bf",
  measurementId: "G-F1BKLF7MMP"
};

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);


// --- Helper to get User ID ---
const getUserId = () => auth.currentUser?.uid || 'anonymous_user';

// --- Gemini API Helper ---
const callGemini = async (prompt, schema = null) => {
  // In a real application, you should secure your API key.
  // This key is left blank as it will be provided by the execution environment.
  const apiKey = "";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {}
  };

  if (schema) {
    payload.generationConfig.responseMimeType = "application/json";
    payload.generationConfig.responseSchema = schema;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();

    if (result.candidates && result.candidates.length > 0 && result.candidates[0].content && result.candidates[0].content.parts && result.candidates[0].content.parts.length > 0) {
      const text = result.candidates[0].content.parts[0].text;
      return text;
    } else {
      console.error("Unexpected API response structure:", result);
      throw new Error("Failed to get a valid response from the AI.");
    }
  } catch (error) {
    console.error("Gemini API call error:", error);
    throw error;
  }
};

// --- Main App Component ---
/*
To run this app locally:
1.  Create a new React project: `npx create-react-app my-fitness-app`
2.  Install dependencies: `npm install firebase recharts lucide-react`
3.  Replace the contents of `src/App.js` with this code.
4.  Set up a Firebase project (https://firebase.google.com/) and enable Firestore and Anonymous Authentication.
5.  Get your Firebase configuration object and replace the placeholder `firebaseConfig` with it.
6.  Start the app: `npm start`
*/
export default function App() {
  const [view, setView] = useState('dashboard');
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            setUserId(user.uid);
          } else {
            // The `__initial_auth_token` is provided in the specific environment this app is designed for.
            // For local development, it will fall back to anonymous sign-in.
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
              await signInWithCustomToken(auth, __initial_auth_token);
            } else {
              await signInAnonymously(auth);
            }
          }
          setIsAuthReady(true);
        });
      } catch (error) {
        console.error("Authentication Error:", error);
        setIsAuthReady(true); // Still allow app to load, though Firestore might fail
      }
    };
    initAuth();
  }, []);

  const renderView = () => {
    if (!isAuthReady) {
      return <div className="flex justify-center items-center h-screen bg-gray-900 text-white">Loading Your Dashboard...</div>;
    }
    switch (view) {
      case 'workout': return <WorkoutTracker setView={setView} />;
      case 'diet': return <DietTracker setView={setView} />;
      case 'progress': return <ProgressTracker setView={setView} />;
      default: return <Dashboard setView={setView} userId={userId} />;
    }
  };

  return (
      <div className="bg-gray-900 text-white min-h-screen font-sans">
        <div className="container mx-auto p-4 max-w-4xl">
          {renderView()}
        </div>
      </div>
  );
}

// --- Dashboard Component ---
const Dashboard = ({ setView, userId }) => {
  const [todayLog, setTodayLog] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!userId) return;

    const dietQuery = query(collection(db, `artifacts/${appId}/users/${userId}/dietLogs`), where("date", "==", today));
    const unsubDiet = onSnapshot(dietQuery, (snapshot) => {
      if (!snapshot.empty) {
        setTodayLog({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setTodayLog(null);
      }
    });

    const workoutQuery = query(collection(db, `artifacts/${appId}/users/${userId}/workoutLogs`), where("date", "==", today));
    const unsubWorkout = onSnapshot(workoutQuery, (snapshot) => {
      if (!snapshot.empty) {
        setTodayWorkout({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setTodayWorkout(null);
      }
    });

    return () => {
      unsubDiet();
      unsubWorkout();
    };
  }, [userId, today]);

  const calorieTarget = 2300;
  const proteinTarget = 100;
  const caloriesConsumed = todayLog?.totalCalories || 0;
  const proteinConsumed = todayLog?.totalProtein || 0;

  return (
      <div className="animate-fade-in">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-red-400">My 3-Month Transformation</h1>
          <p className="text-gray-400 mt-2">Your personal dashboard for accountability and results.</p>
          <p className="text-xs text-gray-500 mt-2">User ID: {userId}</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 flex items-center"><Utensils className="mr-3 text-red-400"/>Today's Nutrition</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-medium text-gray-300">Calories</span>
                  <span className="font-bold text-lg">{caloriesConsumed} / {calorieTarget} kcal</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4"><div className="bg-red-500 h-4 rounded-full" style={{ width: `${Math.min(100, (caloriesConsumed / calorieTarget) * 100)}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="font-medium text-gray-300">Protein</span>
                  <span className="font-bold text-lg">{proteinConsumed} / {proteinTarget} g</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-4"><div className="bg-sky-500 h-4 rounded-full" style={{ width: `${Math.min(100, (proteinConsumed / proteinTarget) * 100)}%` }}></div></div>
              </div>
            </div>
          </div>
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col justify-between">
            <h2 className="text-2xl font-semibold mb-4 flex items-center"><Dumbbell className="mr-3 text-red-400"/>Today's Workout</h2>
            {todayWorkout ? (<div className="text-center my-auto"><CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2"/><p className="text-xl font-bold">Workout Complete!</p><p className="text-gray-400">Awesome job. Rest and recover.</p></div>) : (<div className="text-center my-auto"><Target className="w-16 h-16 text-red-500 mx-auto mb-2"/><p className="text-xl font-bold">Ready to Train</p><p className="text-gray-400">Time to build muscle. Let's go!</p></div>)}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button onClick={() => setView('workout')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center text-lg"><Dumbbell className="mr-2"/>Log Workout</button>
          <button onClick={() => setView('diet')} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center text-lg"><Utensils className="mr-2"/>Log Meal</button>
          <button onClick={() => setView('progress')} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center text-lg"><TrendingUp className="mr-2"/>Track Progress</button>
        </div>
      </div>
  );
};

const ViewHeader = ({ title, setView }) => (
    <header className="flex items-center mb-6">
      <button onClick={() => setView('dashboard')} className="p-2 rounded-full bg-gray-800 hover:bg-gray-700 mr-4"><ChevronLeft size={24} /></button>
      <h1 className="text-3xl font-bold text-red-400">{title}</h1>
    </header>
);

const WorkoutTracker = ({ setView }) => {
  const [generatedWorkout, setGeneratedWorkout] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [workoutLog, setWorkoutLog] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userId = getUserId();
  const today = new Date().toISOString().split('T')[0];

  const generateAiWorkout = async () => {
    setIsGenerating(true);
    setGenerationError('');
    setGeneratedWorkout(null);

    const prompt = `You are an expert fitness coach. Create a workout plan for a 55kg male in Ghana whose goal is body recomposition (building muscle while managing fat). The user works out at home and only has access to dumbbells. The main focus should be on the upper body: specifically chest, shoulders, arms (biceps and triceps), and abs. The workout should include a mix of dumbbell and bodyweight exercises that can be done on the floor or standing. Do NOT include any exercises that require a bench. Provide 5-6 exercises in total. Respond with ONLY a JSON object. The root of the object should be a key named "workout", which is an array of exercise objects. Each exercise object MUST have these exact keys: "name" (string), "sets" (number), "reps" (string, e.g., "8-12" or "30-60s"), "group" (string, e.g., "Chest", "Shoulders", "Arms", "Abs"), "instructions" (string, clear and concise), and "gifUrl" (a direct, publicly accessible, and working HTTPS URL to an animated GIF showing the exercise).`;

    const workoutSchema = {
      type: "OBJECT",
      properties: {
        workout: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              sets: { type: "NUMBER" },
              reps: { type: "STRING" },
              group: { type: "STRING" },
              instructions: { type: "STRING" },
              gifUrl: { type: "STRING" }
            },
            required: ["name", "sets", "reps", "group", "instructions", "gifUrl"]
          }
        }
      },
      required: ["workout"]
    };

    try {
      const result = await callGemini(prompt, workoutSchema);
      const parsedResult = JSON.parse(result);
      if (parsedResult.workout && parsedResult.workout.length > 0) {
        setGeneratedWorkout(parsedResult.workout);
      } else {
        throw new Error("AI returned an empty or invalid workout plan.");
      }
    } catch (error) {
      console.error("AI Workout Generation Error:", error);
      setGenerationError("The AI coach couldn't create a workout right now. Please try again in a moment.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSetChange = (exerciseName, setIndex, field, value) => {
    const newLog = { ...workoutLog };
    if (!newLog[exerciseName]) {
      const exerciseDetails = generatedWorkout.find(e => e.name === exerciseName);
      newLog[exerciseName] = Array(exerciseDetails.sets).fill({ weight: '', reps: '' });
    }
    const newSets = [...newLog[exerciseName]];
    newSets[setIndex] = { ...newSets[setIndex], [field]: value };
    newLog[exerciseName] = newSets;
    setWorkoutLog(newLog);
  };

  const finishWorkout = async () => {
    if (Object.keys(workoutLog).length === 0) {
      // Using a custom modal/alert in a real app is better than window.alert
      alert("Please log at least one exercise.");
      return;
    }
    setIsSubmitting(true);
    try {
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/workoutLogs`, `${userId}_${today}`);
      await setDoc(docRef, { userId, date: today, createdAt: serverTimestamp(), exercises: workoutLog, workoutPlan: generatedWorkout }, { merge: true });
      setView('dashboard');
    } catch (error) {
      console.error("Error saving workout: ", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <div className="animate-fade-in">
        <ViewHeader title="Log Today's Workout" setView={setView} />

        {!generatedWorkout && !isGenerating && !generationError && (
            <div className="text-center p-8 bg-gray-800 rounded-xl">
              <h2 className="text-2xl font-bold mb-4">Ready for a new challenge?</h2>
              <p className="text-gray-400 mb-6">Let our AI coach design a personalized workout focusing on chest, arms, shoulders and abs you can do at home.</p>
              <button onClick={generateAiWorkout} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center text-lg mx-auto">
                <Sparkles className="mr-2"/> Generate AI Workout
              </button>
            </div>
        )}

        {isGenerating && <div className="text-center p-8"><p className="text-lg">Your AI coach is building your workout...</p></div>}

        {generationError && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-xl text-center">
              <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-red-400" />
              <p className="font-bold">Generation Failed</p>
              <p>{generationError}</p>
            </div>
        )}

        {generatedWorkout && (
            <>
              <div className="bg-gray-800 p-4 rounded-xl mb-6 flex items-center text-sm"><Info className="text-sky-400 mr-3 flex-shrink-0" /><p>Focus on good form. Once you can hit the top of the rep range (e.g., 12 reps) for all sets, increase the weight slightly in your next session. That's progressive overload!</p></div>
              <div className="space-y-6">
                {generatedWorkout.map(exercise => (
                    <div key={exercise.name} className="bg-gray-800 p-5 rounded-xl shadow-md">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="md:w-1/3">
                          <h3 className="text-xl font-bold text-red-400">{exercise.name}</h3>
                          <p className="text-gray-400 text-sm mb-2">{exercise.sets} sets x {exercise.reps} reps</p>
                          <img src={exercise.gifUrl} alt={`${exercise.name} form`} className="rounded-lg w-full aspect-video object-cover bg-gray-700" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/300x200/1F2937/FFFFFF?text=Exercise+Visual'; }} />
                          <p className="text-xs text-gray-400 mt-2">{exercise.instructions}</p>
                        </div>
                        <div className="md:w-2/3 space-y-2">
                          {Array.from({ length: exercise.sets }).map((_, i) => (
                              <div key={i} className="flex items-center gap-4">
                                <span className="font-bold text-gray-300 w-12">Set {i + 1}</span>
                                <input type="number" placeholder="kg" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-center focus:ring-2 focus:ring-red-500 focus:outline-none" onChange={(e) => handleSetChange(exercise.name, i, 'weight', e.target.value)} value={workoutLog[exercise.name]?.[i]?.weight || ''} />
                                <span className="font-bold text-gray-300">x</span>
                                <input type="number" placeholder="reps" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-center focus:ring-2 focus:ring-red-500 focus:outline-none" onChange={(e) => handleSetChange(exercise.name, i, 'reps', e.target.value)} value={workoutLog[exercise.name]?.[i]?.reps || ''} />
                              </div>
                          ))}
                        </div>
                      </div>
                    </div>
                ))}
              </div>
              <button onClick={finishWorkout} disabled={isSubmitting} className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-4 rounded-xl shadow-lg transition-transform transform hover:scale-105 flex items-center justify-center text-lg disabled:bg-gray-500">
                {isSubmitting ? "Saving..." : <><CheckCircle className="mr-2"/>Finish & Save Workout</>}
              </button>
            </>
        )}
      </div>
  );
};

const DietTracker = ({ setView }) => {
  const [meals, setMeals] = useState([]);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [aiMealDescription, setAiMealDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
      // Handle error silently or with a small toast notification in a real app
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addMeal = async (e) => {
    e.preventDefault();
    if (!mealName || !calories || !protein) return;
    const newMeal = { name: mealName, calories: parseInt(calories), protein: parseInt(protein), id: Date.now() };
    const updatedMeals = [...meals, newMeal];
    const totalCalories = updatedMeals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = updatedMeals.reduce((sum, meal) => sum + meal.protein, 0);

    try {
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/dietLogs`, `${userId}_${today}`);
      await setDoc(docRef, { userId, date: today, meals: updatedMeals, totalCalories, totalProtein, updatedAt: serverTimestamp() }, { merge: true });
      setMeals(updatedMeals);
      setMealName(''); setCalories(''); setProtein(''); setAiMealDescription('');
    } catch (error) {
      console.error("Error adding meal: ", error);
    }
  };

  const deleteMeal = async (mealId) => {
    const updatedMeals = meals.filter(meal => meal.id !== mealId);
    const totalCalories = updatedMeals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = updatedMeals.reduce((sum, meal) => sum + meal.protein, 0);
    try {
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/dietLogs`, `${userId}_${today}`);
      await setDoc(docRef, { userId, date: today, meals: updatedMeals, totalCalories, totalProtein, updatedAt: serverTimestamp() }, { merge: true });
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
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-xl text-center"><h3 className="text-sm text-gray-400">Calories</h3><p className="text-2xl font-bold text-red-400">{totalCalories} / {calorieTarget}</p><div className="w-full bg-gray-700 rounded-full h-2.5 mt-2"><div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (totalCalories / calorieTarget) * 100)}%` }}></div></div></div>
          <div className="bg-gray-800 p-4 rounded-xl text-center"><h3 className="text-sm text-gray-400">Protein</h3><p className="text-2xl font-bold text-sky-400">{totalProtein} / {proteinTarget}</p><div className="w-full bg-gray-700 rounded-full h-2.5 mt-2"><div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (totalProtein / proteinTarget) * 100)}%` }}></div></div></div>
        </div>

        <div className="bg-gray-800 p-5 rounded-xl mb-6">
          <h3 className="text-xl font-semibold mb-2 flex items-center"><Sparkles className="text-yellow-400 mr-2" /> AI-Powered Meal Entry</h3>
          <p className="text-sm text-gray-400 mb-4">Describe your meal, and let AI estimate the nutrition facts for you.</p>
          <div className="flex items-center gap-4">
            <input type="text" value={aiMealDescription} onChange={e => setAiMealDescription(e.target.value)} placeholder="e.g., Banku with tilapia and pepper sauce" className="flex-grow bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-yellow-500 focus:outline-none" />
            <button onClick={handleAiAnalyze} disabled={isAnalyzing} className="bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-bold py-2 px-4 rounded-md flex items-center justify-center disabled:bg-gray-500">
              {isAnalyzing ? "Analyzing..." : <><BrainCircuit size={20} className="mr-2"/>Analyze</>}
            </button>
          </div>
        </div>

        <div className="bg-gray-800 p-5 rounded-xl mb-6">
          <h3 className="text-xl font-semibold mb-4">Add Meal Details</h3>
          <form onSubmit={addMeal} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div className="sm:col-span-2 md:col-span-1"><label className="block text-sm font-medium text-gray-400 mb-1">Meal/Food</label><input type="text" value={mealName} onChange={e => setMealName(e.target.value)} placeholder="Confirm meal name" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-red-500 focus:outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-400 mb-1">Calories (kcal)</label><input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="e.g., 500" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-red-500 focus:outline-none" /></div>
            <div><label className="block text-sm font-medium text-gray-400 mb-1">Protein (g)</label><input type="number" value={protein} onChange={e => setProtein(e.target.value)} placeholder="e.g., 40" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-red-500 focus:outline-none" /></div>
            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center"><Plus className="mr-2" size={20}/>Add Meal</button>
          </form>
        </div>

        <div className="space-y-3"><h3 className="text-xl font-semibold mb-2">Today's Log</h3>{meals.length > 0 ? meals.map(meal => (<div key={meal.id} className="bg-gray-800 p-3 rounded-lg flex justify-between items-center"><p className="font-semibold">{meal.name}</p><div className="flex items-center gap-4"><span className="text-sm text-red-400 flex items-center"><Flame size={14} className="mr-1"/>{meal.calories} kcal</span><span className="text-sm text-sky-400 flex items-center"><Beef size={14} className="mr-1"/>{meal.protein} g</span><button onClick={() => deleteMeal(meal.id)} className="text-gray-500 hover:text-white"><Trash2 size={16}/></button></div></div>)) : <p className="text-gray-500 text-center py-4">No meals logged yet for today.</p>}</div>
      </div>
  );
};

const ProgressTracker = ({ setView }) => {
  const [progressData, setProgressData] = useState([]);
  const [weight, setWeight] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const userId = getUserId();

  useEffect(() => {
    if (!userId) return;
    const progressQuery = query(collection(db, `artifacts/${appId}/users/${userId}/progress`));
    const unsubscribe = onSnapshot(progressQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({...doc.data(), id: doc.id })).sort((a, b) => a.date.localeCompare(b.date));
      setProgressData(data);
    });
    return () => unsubscribe();
  }, [userId]);

  const addProgressEntry = async (e) => {
    e.preventDefault();
    if (!weight) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      await addDoc(collection(db, `artifacts/${appId}/users/${userId}/progress`), { userId, date: today, weight: parseFloat(weight), createdAt: serverTimestamp() });
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
        <div className="bg-gray-800 p-5 rounded-xl mb-6">
          <h3 className="text-xl font-semibold mb-4">Log Weekly Weigh-In</h3>
          <form onSubmit={addProgressEntry} className="flex items-end gap-4">
            <div className="flex-grow"><label className="block text-sm font-medium text-gray-400 mb-1">Current Weight (kg)</label><input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g., 55.5" className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 focus:ring-2 focus:ring-red-500 focus:outline-none" /></div>
            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-md h-11">Log Weight</button>
          </form>
        </div>

        <div className="bg-gray-800 p-5 rounded-xl mb-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center"><Sparkles className="text-yellow-400 mr-2" /> Your AI Coach</h3>
          <button onClick={getAiSummary} disabled={isSummarizing || progressData.length < 2} className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md flex items-center justify-center disabled:bg-gray-500 disabled:cursor-not-allowed">
            {isSummarizing ? "Thinking..." : <><BrainCircuit size={20} className="mr-2"/>Get AI Progress Summary</>}
          </button>
          {aiSummary && (
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <p className="text-white whitespace-pre-wrap">{aiSummary}</p>
              </div>
          )}
        </div>

        <div className="bg-gray-800 p-5 rounded-xl">
          <h3 className="text-xl font-semibold mb-4">Weight Journey</h3>
          {progressData.length > 1 ? (<div style={{ width: '100%', height: 300 }}><ResponsiveContainer><LineChart data={progressData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" stroke="#4A5568" /><XAxis dataKey="date" stroke="#A0AEC0" tick={{ fontSize: 12 }} /><YAxis stroke="#A0AEC0" domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 12 }} /><Tooltip contentStyle={{ backgroundColor: '#2D3748', border: 'none', borderRadius: '10px' }} labelStyle={{ color: '#E53E3E' }}/><Legend /><Line type="monotone" dataKey="weight" stroke="#E53E3E" strokeWidth={2} activeDot={{ r: 8 }} /></LineChart></ResponsiveContainer></div>) : (<p className="text-gray-500 text-center py-10">Log your weight at least twice to see a chart and get AI feedback.</p>)}
        </div>
      </div>
  );
};
