import React, { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { callGemini } from '../services/gemini';
import { ViewHeader } from './ViewHeader';
import { CheckCircle, Info, Sparkles, AlertTriangle, Target, Zap, RotateCcw, Save } from 'lucide-react';

interface WorkoutTrackerProps {
  setView: (view: string) => void;
}

interface Exercise {
  name: string;
  sets: number;
  reps: string;
  group: string;
  instructions: string;
}

const MuscleGroupBadge: React.FC<{ group: string }> = ({ group }) => {
  const getGroupColor = (group: string) => {
    switch (group.toLowerCase()) {
      case 'chest': return 'bg-gradient-to-r from-red-500 to-red-600 text-white';
      case 'shoulders': return 'bg-gradient-to-r from-orange-500 to-orange-600 text-white';
      case 'arms': 
      case 'biceps':
      case 'triceps': return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white';
      case 'abs': 
      case 'core': return 'bg-gradient-to-r from-green-500 to-green-600 text-white';
      case 'back': return 'bg-gradient-to-r from-purple-500 to-purple-600 text-white';
      default: return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white';
    }
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getGroupColor(group)} shadow-lg`}>
      <Target size={12} className="mr-1" />
      {group}
    </span>
  );
};

const ExerciseCard: React.FC<{
  exercise: Exercise;
  index: number;
  workoutLog: Record<string, Array<{weight: string, reps: string}>>;
  onSetChange: (exerciseName: string, setIndex: number, field: string, value: string) => void;
}> = ({ exercise, index, workoutLog, onSetChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-red-600/20 to-red-700/20 p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mr-4 font-bold text-white text-lg shadow-lg">
              {index + 1}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">{exercise.name}</h3>
              <div className="flex items-center gap-4">
                <MuscleGroupBadge group={exercise.group} />
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="flex items-center">
                    <RotateCcw size={16} className="mr-1 text-red-400" />
                    {exercise.sets} sets
                  </span>
                  <span className="flex items-center">
                    <Zap size={16} className="mr-1 text-yellow-400" />
                    {exercise.reps} reps
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Instructions */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-600">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full text-left"
              >
                <h4 className="text-lg font-semibold text-white flex items-center">
                  <Info className="mr-2 text-sky-400" size={20} />
                  Exercise Instructions
                </h4>
                <div className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-gray-300 leading-relaxed">{exercise.instructions}</p>
                  <div className="mt-4 p-4 bg-sky-900/30 rounded-xl border border-sky-700/50">
                    <p className="text-sky-200 text-sm">
                      <strong>Pro Tip:</strong> Control the movement on both the lifting and lowering phases for maximum muscle activation.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Set Logging */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xl font-semibold text-white">Log Your Sets</h4>
              <div className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                Track your progress
              </div>
            </div>
            
            <div className="space-y-3">
              {Array.from({ length: exercise.sets }).map((_, i) => (
                <div key={i} className="bg-gray-700/50 rounded-xl p-4 border border-gray-600 hover:border-gray-500 transition-all duration-200">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-bold rounded-full">
                        {i + 1}
                      </span>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Weight (kg)</label>
                        <input 
                          type="number" 
                          placeholder="0" 
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-center focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-all duration-200 text-white font-semibold" 
                          onChange={(e) => onSetChange(exercise.name, i, 'weight', e.target.value)} 
                          value={workoutLog[exercise.name]?.[i]?.weight || ''} 
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">Reps</label>
                        <input 
                          type="number" 
                          placeholder="0" 
                          className="w-full bg-gray-800 border border-gray-600 rounded-lg p-3 text-center focus:ring-2 focus:ring-red-500 focus:border-red-500 focus:outline-none transition-all duration-200 text-white font-semibold" 
                          onChange={(e) => onSetChange(exercise.name, i, 'reps', e.target.value)} 
                          value={workoutLog[exercise.name]?.[i]?.reps || ''} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Set Summary */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl p-4 border border-gray-600">
              <div className="text-center">
                <p className="text-sm text-gray-400 mb-1">Total Volume</p>
                <p className="text-lg font-bold text-white">
                  {workoutLog[exercise.name]?.reduce((total, set) => {
                    const weight = parseFloat(set.weight) || 0;
                    const reps = parseFloat(set.reps) || 0;
                    return total + (weight * reps);
                  }, 0) || 0} kg
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WorkoutTracker: React.FC<WorkoutTrackerProps> = ({ setView }) => {
  const [generatedWorkout, setGeneratedWorkout] = useState<Exercise[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState('');
  const [workoutLog, setWorkoutLog] = useState<Record<string, Array<{weight: string, reps: string}>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const { getUserId } = useAuth();
  const userId = getUserId();
  const today = new Date().toISOString().split('T')[0];

  const generateAiWorkout = async () => {
    setIsGenerating(true);
    setGenerationError('');
    setGeneratedWorkout(null);

    const prompt = `You are an expert fitness coach. Create a workout plan for a 55kg male in Ghana whose goal is body recomposition (building muscle while managing fat). The user works out at home and only has access to dumbbells. The main focus should be on the upper body: specifically chest, shoulders, arms (biceps and triceps), and abs. The workout should include a mix of dumbbell and bodyweight exercises that can be done on the floor or standing. Do NOT include any exercises that require a bench. Provide 5-6 exercises in total. Respond with ONLY a JSON object. The root of the object should be a key named "workout", which is an array of exercise objects. Each exercise object MUST have these exact keys: "name" (string), "sets" (number), "reps" (string, e.g., "8-12" or "30-60s"), "group" (string, e.g., "Chest", "Shoulders", "Arms", "Abs"), and "instructions" (string, clear and concise).`;

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
              instructions: { type: "STRING" }
            },
            required: ["name", "sets", "reps", "group", "instructions"]
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

  const handleSetChange = (exerciseName: string, setIndex: number, field: string, value: string) => {
    const newLog = { ...workoutLog };
    if (!newLog[exerciseName]) {
      const exerciseDetails = generatedWorkout?.find(e => e.name === exerciseName);
      newLog[exerciseName] = Array(exerciseDetails?.sets || 0).fill({ weight: '', reps: '' });
    }
    const newSets = [...newLog[exerciseName]];
    newSets[setIndex] = { ...newSets[setIndex], [field]: value };
    newLog[exerciseName] = newSets;
    setWorkoutLog(newLog);
  };

  const finishWorkout = async () => {
    // Check if any exercises have been logged
    const hasLoggedData = Object.values(workoutLog).some(sets => 
      sets.some(set => set.weight.trim() !== '' || set.reps.trim() !== '')
    );

    if (!hasLoggedData) {
      setSaveError("Please log at least one set before saving your workout.");
      setTimeout(() => setSaveError(''), 5000);
      return;
    }

    setIsSubmitting(true);
    setSaveError('');
    setSaveSuccess(false);

    try {
      console.log('Saving workout to Firebase...');
      console.log('User ID:', userId);
      console.log('Date:', today);
      console.log('Workout Log:', workoutLog);

      const docPath = `artifacts/${appId}/users/${userId}/workoutLogs`;
      const docId = `${userId}_${today}`;
      
      console.log('Document path:', docPath);
      console.log('Document ID:', docId);

      const docRef = doc(db, docPath, docId);
      
      const workoutData = {
        userId, 
        date: today, 
        createdAt: serverTimestamp(), 
        exercises: workoutLog, 
        workoutPlan: generatedWorkout,
        totalExercises: generatedWorkout?.length || 0,
        completedAt: new Date().toISOString()
      };

      console.log('Saving data:', workoutData);

      await setDoc(docRef, workoutData, { merge: true });
      
      console.log('Workout saved successfully!');
      setSaveSuccess(true);
      
      // Wait a moment to show success message, then navigate
      setTimeout(() => {
        setView('dashboard');
      }, 1500);

    } catch (error) {
      console.error("Error saving workout: ", error);
      setSaveError(`Failed to save workout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      <ViewHeader title="Log Today's Workout" setView={setView} />

      {/* Error/Success Messages */}
      {saveError && (
        <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-xl">
          <p className="font-semibold">Error:</p>
          <p>{saveError}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="bg-green-900/50 border border-green-700 text-green-300 p-4 rounded-xl flex items-center">
          <CheckCircle className="mr-3" size={20} />
          <p className="font-semibold">Workout saved successfully! Redirecting to dashboard...</p>
        </div>
      )}

      {!generatedWorkout && !isGenerating && !generationError && (
        <div className="text-center p-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10"></div>
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
              <Sparkles className="text-white" size={32} />
            </div>
            <h2 className="text-4xl font-bold mb-4 text-white">Ready for a new challenge?</h2>
            <p className="text-gray-400 mb-8 text-lg max-w-lg mx-auto leading-relaxed">
              Let our AI coach design a personalized workout focusing on chest, arms, shoulders and abs you can do at home with dumbbells.
            </p>
            <button 
              onClick={generateAiWorkout} 
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-4 px-8 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-lg mx-auto group"
            >
              <Sparkles className="mr-3 group-hover:rotate-12 transition-transform duration-300" size={20} />
              Generate AI Workout
            </button>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="text-center p-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700">
          <div className="animate-spin w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-white mb-2">Your AI coach is building your workout...</h2>
          <p className="text-gray-400">Analyzing your goals and creating the perfect routine</p>
        </div>
      )}

      {generationError && (
        <div className="bg-gradient-to-r from-red-900/50 to-red-800/50 border border-red-700 text-red-300 p-8 rounded-3xl text-center shadow-2xl">
          <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-red-400" />
          <h3 className="font-bold text-xl mb-2">Generation Failed</h3>
          <p className="text-lg">{generationError}</p>
          <button 
            onClick={generateAiWorkout}
            className="mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      )}

      {generatedWorkout && (
        <>
          {/* Workout Overview */}
          <div className="bg-gradient-to-r from-sky-900/50 to-sky-800/50 border border-sky-700 p-8 rounded-3xl shadow-2xl">
            <div className="flex items-center mb-6">
              <Info className="text-sky-400 mr-4 flex-shrink-0" size={28} />
              <div>
                <h3 className="text-xl font-bold text-sky-100 mb-2">Workout Guidelines</h3>
                <p className="text-sky-200 leading-relaxed">
                  Focus on controlled movements and proper form. Progressive overload is key - when you can complete all sets at the top of the rep range with good form, increase the weight by 2.5-5kg for your next session.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {['Chest', 'Shoulders', 'Arms', 'Abs'].map(group => (
                <div key={group} className="text-center p-3 bg-sky-800/30 rounded-xl border border-sky-600/50">
                  <MuscleGroupBadge group={group} />
                </div>
              ))}
            </div>
          </div>
          
          {/* Exercise Cards */}
          <div className="space-y-8">
            {generatedWorkout.map((exercise, index) => (
              <ExerciseCard
                key={exercise.name}
                exercise={exercise}
                index={index}
                workoutLog={workoutLog}
                onSetChange={handleSetChange}
              />
            ))}
          </div>
          
          {/* Finish Workout Button */}
          <div className="sticky bottom-6 z-10">
            <button 
              onClick={finishWorkout} 
              disabled={isSubmitting} 
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold py-6 px-6 rounded-3xl shadow-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center text-xl disabled:bg-gray-500 disabled:transform-none disabled:cursor-not-allowed group"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3"></div>
                  Saving Your Progress...
                </>
              ) : (
                <>
                  <Save className="mr-3 group-hover:scale-110 transition-transform duration-300" size={28} />
                  Complete & Save Workout
                </>
              )}
            </button>
          </div>
        </>
      )}
    </div>
  );
};