import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { auth } from '../config/firebase';

declare global {
  var __initial_auth_token: string | undefined;
}

export const useAuth = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            console.log('User authenticated:', user.uid);
            setUserId(user.uid);
          } else {
            console.log('No user found, signing in anonymously...');
            if (typeof globalThis.__initial_auth_token !== 'undefined' && globalThis.__initial_auth_token) {
              console.log('Using custom token...');
              await signInWithCustomToken(auth, globalThis.__initial_auth_token);
            } else {
              console.log('Signing in anonymously...');
              const result = await signInAnonymously(auth);
              console.log('Anonymous sign-in successful:', result.user.uid);
            }
          }
          setIsAuthReady(true);
        });
        return () => unsubscribe();
      } catch (error) {
        console.error("Authentication Error:", error);
        setIsAuthReady(true);
      }
    };
    initAuth();
  }, []);

  const getUserId = () => {
    const currentUserId = auth.currentUser?.uid || 'anonymous_user';
    console.log('Getting user ID:', currentUserId);
    return currentUserId;
  };

  return { userId, isAuthReady, getUserId };
};