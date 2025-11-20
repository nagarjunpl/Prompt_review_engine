// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Firebase configuration
// IMPORTANT: Replace these with your actual Firebase project credentials
// Get them from: Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "YAIzaSyBcuU2YKUhsTvpXLP_62XC97DT7rlVV_0I",
  authDomain: "prompt-review-fed62.firebaseapp.com",
  projectId: "prompt-review-fed62",
  storageBucket: "prompt-review-fed62.firebasestorage.app",
  messagingSenderId: "251217416897",
  appId: "1:251217416897:web:9eb13314b43092c8cdba40",
  measurementId: "G-4F83F1BV1L"
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
