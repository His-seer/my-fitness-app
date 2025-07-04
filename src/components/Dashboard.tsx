import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { Utensils, Dumbbell, TrendingUp, CheckCircle, Target, Flame, Activity } from 'lucide-react';
import { ProgressBar } from './ProgressBar';

interface DashboardProps {
  setView: (view: string) => void;
  userId: string | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ setView, userId }) => {
  const [todayLog, setTodayLog] = useState<any>(null);
  const [todayWorkout, setTodayWorkout] = useState<any>(null);
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!userId) return;

    const dietQuery = query(
      collection(db, `artifacts/${appId}/users/${userId}/dietLogs`), 
      where("date", "==", today)
    );
    const unsubDiet = onSnapshot(dietQuery, (snapshot) => {
      if (!snapshot.empty) {
        setTodayLog({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setTodayLog(null);
      }
    });

    const workoutQuery = query(
      collection(db, `artifacts/${appId}/users/${userId}/workoutLogs`), 
      where("date", "==", today)
    );
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
    <div className="animate-fade-in space-y-8">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent mb-4">
          My 3-Month Transformation
        </h1>
        <p className="text-gray-400 text-lg mb-2">Your personal dashboard for accountability and results</p>
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Activity size={14} />
          <span>User ID: {userId}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Utensils className="mr-3 text-red-400" size={28} />
            Today's Nutrition
          </h2>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-medium text-gray-300 flex items-center">
                  <Flame className="mr-2 text-orange-400" size={16} />
                  Calories
                </span>
                <span className="font-bold text-xl text-red-400">
                  {caloriesConsumed} / {calorieTarget} kcal
                </span>
              </div>
              <ProgressBar 
                current={caloriesConsumed} 
                target={calorieTarget} 
                color="bg-gradient-to-r from-red-500 to-red-600"
                size="lg"
              />
            </div>
            <div>
              <div className="flex justify-between items-baseline mb-3">
                <span className="font-medium text-gray-300 flex items-center">
                  <Target className="mr-2 text-sky-400" size={16} />
                  Protein
                </span>
                <span className="font-bold text-xl text-sky-400">
                  {proteinConsumed} / {proteinTarget} g
                </span>
              </div>
              <ProgressBar 
                current={proteinConsumed} 
                target={proteinTarget} 
                color="bg-gradient-to-r from-sky-500 to-sky-600"
                size="lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-2xl shadow-2xl border border-gray-700 flex flex-col justify-center">
          <h2 className="text-2xl font-semibold mb-6 flex items-center">
            <Dumbbell className="mr-3 text-red-400" size={28} />
            Today's Workout
          </h2>
          {todayWorkout ? (
            <div className="text-center">
              <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4 animate-pulse" />
              <p className="text-2xl font-bold mb-2 text-green-400">Workout Complete!</p>
              <p className="text-gray-400 text-lg">Awesome job. Rest and recover.</p>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <Target className="text-white" size={32} />
              </div>
              <p className="text-2xl font-bold mb-2 text-red-400">Ready to Train</p>
              <p className="text-gray-400 text-lg">Time to build muscle. Let's go!</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { 
            title: 'Log Workout', 
            icon: Dumbbell, 
            view: 'workout', 
            gradient: 'from-red-600 to-red-700',
            hoverGradient: 'from-red-700 to-red-800'
          },
          { 
            title: 'Log Meal', 
            icon: Utensils, 
            view: 'diet', 
            gradient: 'from-sky-600 to-sky-700',
            hoverGradient: 'from-sky-700 to-sky-800'
          },
          { 
            title: 'Track Progress', 
            icon: TrendingUp, 
            view: 'progress', 
            gradient: 'from-purple-600 to-purple-700',
            hoverGradient: 'from-purple-700 to-purple-800'
          }
        ].map((action) => (
          <button
            key={action.view}
            onClick={() => setView(action.view)}
            className={`bg-gradient-to-r ${action.gradient} hover:${action.hoverGradient} text-white font-bold py-6 px-6 rounded-2xl shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center text-lg group`}
          >
            <action.icon className="mr-3 group-hover:rotate-12 transition-transform duration-300" size={24} />
            {action.title}
          </button>
        ))}
      </div>
    </div>
  );
};