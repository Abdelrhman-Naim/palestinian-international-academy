import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  setLogLevel 
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with forced long-polling and multi-tab persistent cache
// This resolves QUIC protocol errors (QUIC_TOO_MANY_RTOS), WebChannel stream disconnections,
// and Edge/Chrome Tracking Prevention transport errors.
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Suppress transient WebChannel internal connection warning spam in console
setLogLevel('error');

// Filter out benign Firestore offline timeout notice on slow networks
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = function (...args) {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Could not reach Cloud Firestore backend') ||
       args[0].includes("Backend didn't respond within 10 seconds"))
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export const auth = getAuth(app);
export const storage = getStorage(app);
