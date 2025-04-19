// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCovzz8-6yYQqTB1QpI28-WVakuY46xCPY",
  authDomain: "bezpieczny2-a467f.firebaseapp.com",
  projectId: "bezpieczny2-a467f",
  storageBucket: "bezpieczny2-a467f.firebasestorage.app",
  messagingSenderId: "805434744949",
  appId: "1:805434744949:web:32daa968c247a81e35583c",
  measurementId: "G-60N6481V7Q"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);