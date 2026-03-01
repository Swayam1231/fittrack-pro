import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCrW8SU8YTi-70Yw9DkSesFpEgvAV1xwyY",
  authDomain: "fittrack-pro-67b30.firebaseapp.com",
  projectId: "fittrack-pro-67b30",
  storageBucket: "fittrack-pro-67b30.firebasestorage.app",
  messagingSenderId: "66298899668",
  appId: "1:66298899668:web:0a42c374077f0fe9529f41",
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
