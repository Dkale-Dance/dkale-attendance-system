import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCdF9MnQtwe3OKhqx1L0kd5eWmw7DVVX5w",
  authDomain: "dkale-attendance.firebaseapp.com",
  projectId: "dkale-attendance",
  storageBucket: "dkale-attendance.firebasestorage.app",
  messagingSenderId: "872644984535",
  appId: "1:872644984535:web:b37a5e7ac3edaa9da4ba92",
  measurementId: "G-6GHDXBLH4S",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
