// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD7loTwMluWGW7RvVIGW8_VgW0AunD9zO8",
  authDomain: "lopes-imports.firebaseapp.com",
  projectId: "lopes-imports",
  storageBucket: "lopes-imports.firebasestorage.app",
  messagingSenderId: "536210468003",
  appId: "1:536210468003:web:282a1b5a44dab60ab72316",
  measurementId: "G-X21HWZEZ0W",
  databaseURL: "https://lopes-imports-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
