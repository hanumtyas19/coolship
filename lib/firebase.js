// lib/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBC5OPhRXTqZgm3ZWWVx7P4D_Xd45Gj5dg",
  authDomain: "smart-frozen-food-dagsap.firebaseapp.com",
  databaseURL: "https://smart-frozen-food-dagsap-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-frozen-food-dagsap",
  storageBucket: "smart-frozen-food-dagsap.appspot.com",
  messagingSenderId: "141794939862",
  appId: "1:141794939862:web:53d451f4406bc33d2f0a77"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database and get a reference to the service
const database = getDatabase(app);

export { database };