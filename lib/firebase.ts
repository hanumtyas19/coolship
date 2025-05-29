// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider, signInWithPopup, deleteUser, signOut, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc,getDoc } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyBC5OPhRXTqZgm3ZWWVx7P4D_Xd45Gj5dg",
  authDomain: "smart-frozen-food-dagsap.firebaseapp.com",
  databaseURL: "https://smart-frozen-food-dagsap-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-frozen-food-dagsap",
  storageBucket: "smart-frozen-food-dagsap.appspot.com",
  messagingSenderId: "141794939862",
  appId: "1:141794939862:web:53d451f4406bc33d2f0a77"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const database = getDatabase(app);
const firestore = getFirestore(app);

export {
  app,
  auth,
  provider,
  database,
  firestore,
  signInWithPopup,
  deleteUser,
  signOut,
  signInWithEmailAndPassword,
  doc,
  getDoc
};
