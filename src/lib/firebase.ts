import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBF4jvcCD5a3e5aIftAlBtmIengpD9xwkQ",
  authDomain: "ai-hub-360c8.firebaseapp.com",
  projectId: "ai-hub-360c8",
  storageBucket: "ai-hub-360c8.firebasestorage.app",
  messagingSenderId: "660214845631",
  appId: "1:660214845631:web:f94aa51c2744d5e23ab60a",
  measurementId: "G-70EEWS1Q54"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Persist login across browser sessions — user stays logged in until they explicitly logout
setPersistence(auth, browserLocalPersistence);

export const db = getFirestore(app);
export default app;
