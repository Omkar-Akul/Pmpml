const firebaseConfig = {
  apiKey: "AIzaSyCpLf_8ww-gJ9HtO0yCqulOpZY5twAYuLI",
  authDomain: "pmpml-bus-finder.firebaseapp.com",
  projectId: "pmpml-bus-finder",
  storageBucket: "pmpml-bus-finder.firebasestorage.app",
  messagingSenderId: "16595450914",
  appId: "1:16595450914:web:6f971f2687531431509e7b",
  measurementId: "G-WN7VE2L15G"
};

// Initialize Firebase using the compat libraries
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const googleProvider = new firebase.auth.GoogleAuthProvider();
