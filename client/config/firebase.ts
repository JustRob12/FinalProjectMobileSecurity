import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDrrzYmb7jgRpzfEWT9edYAy5kDWWiZu6Q",
  authDomain: "oauth-4df77.firebaseapp.com",
  projectId: "oauth-4df77",
  storageBucket: "oauth-4df77.firebasestorage.app",
  messagingSenderId: "917950144788",
  appId: "1:917950144788:web:5db363233fcbcaf4656201",
  measurementId: "G-EHGM3TPBD1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Configure Google provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.setCustomParameters({
  'prompt': 'select_account'
});

export { auth, googleProvider };
export default app; 