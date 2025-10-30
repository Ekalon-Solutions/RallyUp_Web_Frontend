// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDQEG8YSOrsVuxUBSfIGHfEHoP4-jJI3TE",
  authDomain: "rallyup-28019.firebaseapp.com",
  projectId: "rallyup-28019",
  storageBucket: "rallyup-28019.firebasestorage.app",
  messagingSenderId: "575936971534",
  appId: "1:575936971534:web:2f2c987d135929aa6a0d5f",
  measurementId: "G-SRLNL9FQ0G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);