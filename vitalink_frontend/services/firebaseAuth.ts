import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAL1DJLNUYnrJTVN43xuOs4mawmSniEGBA",
  authDomain: "vitalink-ddef7.firebaseapp.com",
  projectId: "vitalink-ddef7",
  storageBucket: "vitalink-ddef7.firebasestorage.app",
  messagingSenderId: "676589766246",
  appId: "1:676589766246:web:247b8f6b58376209920fa7",
  measurementId: "G-9WXNWXPSW0"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export const loginFirebase = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user.getIdToken(); // <-- este token lo envías al backend
};

export const logoutFirebase = async () => {
  await signOut(auth);
};

export { app, auth };