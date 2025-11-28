// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB4EEnbp67-U-GkImFsx7IR5Au7t3yEaDA",
  authDomain: "eckhart-tolle-7a33f.firebaseapp.com",
  projectId: "eckhart-tolle-7a33f",
  storageBucket: "eckhart-tolle-7a33f.firebasestorage.app",
  messagingSenderId: "836897749674",
  appId: "1:836897749674:web:a0da17ac04651f71506ed3",
  measurementId: "G-EWLWPKWHQZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);