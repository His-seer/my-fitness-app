import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCjtUN3BvFoLryvO8Lj5lQlYP2kTqKdySU",
  authDomain: "my-fitness-tracker-a8760.firebaseapp.com",
  projectId: "my-fitness-tracker-a8760",
  storageBucket: "my-fitness-tracker-a8760.firebasestorage.app",
  messagingSenderId: "585707730478",
  appId: "1:585707730478:web:e15e6743760be2a3d891bf",
  measurementId: "G-F1BKLF7MMP"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Export the app ID for use in Firestore paths
export const appId = firebaseConfig.appId;

// Enable offline persistence
import { enableNetwork, disableNetwork } from 'firebase/firestore';

// Log Firebase connection status
console.log('Firebase initialized with project:', firebaseConfig.projectId);
console.log('App ID:', appId);