// الاتصال بـ Firebase (مشترك بين صفحة الحملة وصفحة الحاج)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";

// إعدادات مشروع رِفادة (مو سرية، الحماية في قواعد Firestore)
const firebaseConfig = {
    apiKey: "AIzaSyASdJXOC9yhJGpkvwx6bVrIbO9XOK7RSGw",
    authDomain: "rifada-5235b.firebaseapp.com",
    projectId: "rifada-5235b",
    storageBucket: "rifada-5235b.firebasestorage.app",
    messagingSenderId: "457160757897",
    appId: "1:457160757897:web:937da2116f609000632c58"
};

const app = initializeApp(firebaseConfig);

// قاعدة البيانات، مع نسخة محفوظة في الجوال: البرنامج يفتح بدون نت، والكتابة تنتظر لين يرجع
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
export const auth = getAuth(app);      // تسجيل الدخول