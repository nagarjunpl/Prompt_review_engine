// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project credentials
// Get them from: Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: FIREBASE_APIKEY,
  authDomain: FIREBASE_AUTHDOMAIN,
  projectId: FIREBASE_PROJECTID,
  storageBucket: FIREBASE_STORAGEBUCKET,
  messagingSenderId: FIREBASE_MESSAGINGSENDERID,
  appId: FIREBASE_APIID,
  measurementId: FIREBASE_MEASUREMENTID
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    // App already initialized, get existing instance
    const { getApp } = await import("https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js");
    app = getApp();
  } else {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Add required scopes
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Set custom parameters for better UX
googleProvider.setCustomParameters({
  prompt: 'select_account',
  hd: '' // Allow any domain
});

export default app;

