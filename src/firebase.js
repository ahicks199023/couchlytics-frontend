// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAnwwyssiHV9FICVikHig2xyThhamdscqk",
  authDomain: "couchlytics-3a2b5.firebaseapp.com",
  projectId: "couchlytics-3a2b5",
  storageBucket: "couchlytics-3a2b5.firebasestorage.app",
  messagingSenderId: "150702987792",
  appId: "1:150702987792:web:f0a87b90716f570f098895",
  measurementId: "G-Z5MH74NZ4B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
