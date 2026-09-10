// ============================================================
// FIREBASE SETUP — replace the placeholders below with your own
// project's config. See README.md for the full step-by-step guide.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 1) Paste your Firebase project's config object here.
//    Firebase Console → Project settings → General → "Your apps" → SDK setup and config.
const firebaseConfig = {
  apiKey: "AIzaSyB4gPdA6zKCMHKi6h2T5bm6LACMaCtVO2s",
  authDomain: "saekyung-unit.firebaseapp.com",
  projectId: "saekyung-unit",
  storageBucket: "saekyung-unit.firebasestorage.app",
  messagingSenderId: "522591235756",
  appId: "1:522591235756:web:ee24314a9252e412803909",
};

// 2) List the Google account email(s) that should see the owner
//    controls (approve reviews, flip availability). Everyone else
//    only ever sees the public site.
export const OWNER_EMAILS = [
   "warrensolon1211@gmail.com",
];

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Shared in-memory state other modules read from, so the chatbot
// and the unit cards can answer instantly without re-querying.
export const siteState = {
  user: null,
  isOwner: false,
  units: {
    "unit-a": { name: "Unit A — Poolview Studio", status: "unknown", price: null, updatedAt: null },
    "unit-b": { name: "Unit B — Garden 1BR", status: "unknown", price: null, updatedAt: null },
  },
  reviews: [],
};
