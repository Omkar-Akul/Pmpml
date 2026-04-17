const firebaseConfig = {
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "__FIREBASE_AUTH_DOMAIN__",
  projectId: "__FIREBASE_PROJECT_ID__",
  storageBucket: "__FIREBASE_STORAGE_BUCKET__",
  messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
  appId: "__FIREBASE_APP_ID__",
  measurementId: "__FIREBASE_MEASUREMENT_ID__"
};

// Validate that all placeholders have been replaced with real values.
// In production these are injected by the GitHub Actions deploy workflow.
// For local development manually replace each __PLACEHOLDER__ with your real Firebase values
// (do not commit those changes – see README.md).
const _unreplacedKeys = Object.entries(firebaseConfig)
  .filter(([, v]) => typeof v === 'string' && v.startsWith('__') && v.endsWith('__'))
  .map(([k]) => k);
if (_unreplacedKeys.length > 0) {
  console.error(
    '[firebase-config] Firebase is not configured. ' +
    'The following values are still placeholders: ' + _unreplacedKeys.join(', ') + '. ' +
    'See README.md for local development and deployment setup instructions.'
  );
}

// Initialize Firebase using the compat libraries
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();
