// لوحة الحملة: الحساب، الرمز، المسبحة، والنشر
import { auth, db } from "./firebase.js";
import {
    createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
    signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc, setDoc, writeBatch, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const authBox = document.getElementById("auth-box");
const tabSignup = document.getElementById("tab-signup");
const tabLogin = document.getElementById("tab-login");
const signupForm = document.getElementById("signup-form");
const signupMsg = document.getElementById("signup-msg");
const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-msg");
const dashboard = document.getElementById("dashboard");
const codeEl = document.getElementById("campaign-code");
const form = document.getElementById("campaign-form");
const eventsList = document.getElementById("events");
const template = document.getElementById("event-template");
const publishMsg = document.getElementById("publish-msg");

auth.languageCode = "ar"; // إيميل استعادة كلمة السر يوصل بالعربي

// ١) التبويبات: "حساب جديد" و"تسجيل دخول"
function showTab(name) {
    const isLogin = name === "login";
    loginForm.hidden = !isLogin;
    signupForm.hidden = isLogin;
    tabLogin.setAttribute("aria-selected", isLogin);
    tabSignup.setAttribute("aria-selected", !isLogin);
    showMsg(signupMsg, "");
    showMsg(loginMsg, "");
    history.replaceState(null, "", isLogin ? "#login" : "#signup"); // لو حدّثت الصفحة يبقى نفس التبويب
}

tabSignup.addEventListener("click", function () { showTab("signup"); });
tabLogin.addEventListener("click", function () { showTab("login"); });
showTab(location.hash === "#login" ? "login" : "signup");

// رسالة تحت النموذج: خضراء لو ok، وحمراء لو خطأ
function showMsg(el, text, ok = false) {
    el.textContent = text;
    el.classList.toggle("ok", ok);
}

// أخطاء Firebase بالعربي
function arabicError(code) {
    switch (code) {
        case "auth/email-already-in-use": return "هذا الإيميل مسجّل من قبل، جرّب تسجيل الدخول";
        case "auth/invalid-email": return "الإيميل مكتوب بشكل غلط";
        case "auth/missing-email": return "اكتب إيميلك أول";
        case "auth/weak-password":
        case "auth/password-does-not-meet-requirements": return "كلمة السر ضعيفة، خلّها ٨ حروف أو أكثر";
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found": return "الإيميل أو كلمة السر غير صحيحة";
        case "auth/too-many-requests": return "محاولات كثيرة، انتظر شوي وجرّب مرة ثانية";
        case "auth/network-request-failed": return "تأكد من اتصال النت";
        default: return "صار خطأ، جرّب مرة ثانية";
    }
}

// ٢) حساب جديد
let signupSave = null; // حفظ اسم الحملة، onAuthStateChanged ينتظره

signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    showMsg(signupMsg, "");
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    try {
        signupSave = createUserWithEmailAndPassword(auth, email, password)
            .then(function (cred) {
                return setDoc(doc(db, "campaigns", cred.user.uid), { name: name }, { merge: true });
            });
        await signupSave;
    } catch (error) {
        showMsg(signupMsg, arabicError(error.code));
    }
});

// ٣) تسجيل دخول
loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    showMsg(loginMsg, "");
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        showMsg(loginMsg, arabicError(error.code));
    }
});

// ٤) نسيت كلمة السر: نفس الرسالة سواء الإيميل مسجّل أو لا (عشان ما نكشف مين عنده حساب)
document.getElementById("forgot-btn").addEventListener("click", async function () {
    const email = document.getElementById("login-email").value.trim();
    if (!email) {
        showMsg(loginMsg, "اكتب إيميلك فوق، وبعدها اضغط «نسيت كلمة السر؟»");
        return;
    }
    const sent = "إذا الإيميل مسجّل عندنا، بيوصلك رابط لتغيير كلمة السر";
    try {
        await sendPasswordResetEmail(auth, email);
        showMsg(loginMsg, sent, true);
    } catch (error) {
        if (error.code === "auth/invalid-email" || error.code === "auth/network-request-failed") {
            showMsg(loginMsg, arabicError(error.code));
        } else {
            showMsg(loginMsg, sent, true);
        }
    }
});

// ٥) خروج
document.getElementById("logout-btn").addEventListener("click", function () {
    signOut(auth);
});

// ٦) رمز الحملة: ٦ حروف بدون O و0 و I و1 (عشان ما تتلخبط)
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode() {
    const nums = crypto.getRandomValues(new Uint32Array(6));
    return [...nums].map(function (n) { return CODE_CHARS[n % CODE_CHARS.length]; }).join("");
}

// لو ما عندها رمز نولّد واحد. لو مأخوذ، القواعد ترفض فنجرّب غيره
async function ensureCode(uid, data) {
    if (data.code) return data.code;
    for (let i = 0; i < 5; i++) {
        const code = randomCode();
        const batch = writeBatch(db); // الكتابتين مع بعض: تنجح كلها أو تفشل كلها
        batch.set(doc(db, "codes", code), { campaignId: uid });
        batch.set(doc(db, "campaigns", uid), { code: code }, { merge: true });
        try {
            await batch.commit();
            return code;
        } catch (error) {
            if (error.code !== "permission-denied") throw error; // خطأ ثاني (مثل النت): نوقف
        }
    }
    throw new Error("ما لقينا رمز فاضي");
}

// ٧) كل ما تغيّر حال الدخول: نوري اللوحة أو صندوق الدخول
onAuthStateChanged(auth, async function (user) {
    if (!user) {
        authBox.hidden = false;
        dashboard.hidden = true;
        form.reset();
        showMsg(publishMsg, "");
        codeEl.textContent = "";
        return;
    }
    authBox.hidden = true;
    dashboard.hidden = false;
    signupForm.reset();
    loginForm.reset();
    showMsg(signupMsg, "");
    showMsg(loginMsg, "");

    // لو الحساب توه انشأ: ننتظر لين ينحفظ الاسم
    if (signupSave) await signupSave.catch(function () {});

    // نجيب البرنامج المحفوظ (لو فيه)
    const saved = await getDoc(doc(db, "campaigns", user.uid));
    const data = saved.exists() ? saved.data() : {};
    eventsList.innerHTML = "";
    if (data.name) document.getElementById("campaign-name").value = data.name;
    if (data.dayName) document.getElementById("day-name").value = data.dayName;
    if (data.date) document.getElementById("day-date").value = data.date;
    (data.events || []).forEach(function (ev) {
        addEvent(ev.time, ev.title);
    });
    if (data.events) showLink(user.uid); // نشرت قبل
    if (eventsList.children.length === 0) addEvent();

    codeEl.textContent = "……";
    try {
        codeEl.textContent = await ensureCode(user.uid, data);
    } catch (error) {
        codeEl.textContent = "تعذّر، حدّث الصفحة";
    }
});

// ٨) إضافة حبّة للمسبحة
function addEvent(time = "", title = "") {
    const li = template.content.firstElementChild.cloneNode(true);
    li.querySelector('input[type="time"]').value = time;
    li.querySelector('input[type="text"]').value = title;
    eventsList.appendChild(li);
}

document.getElementById("add-event").addEventListener("click", function () {
    addEvent();
});

// ٩) حذف حبّة (مستمع واحد للقائمة كلها)
eventsList.addEventListener("click", function (e) {
    if (e.target.closest(".remove")) {
        e.target.closest(".event").remove();
    }
});

// ١٠) النشر
form.addEventListener("submit", async function (e) {
    e.preventDefault();
    showMsg(publishMsg, "جاري النشر…");

    // نجمع الحبّات، نتجاهل الفاضية، ونرتبها حسب الوقت
    const events = [...eventsList.querySelectorAll(".event")]
        .map(function (li) {
            return {
                time: li.querySelector('input[type="time"]').value,
                title: li.querySelector('input[type="text"]').value.trim()
            };
        })
        .filter(function (ev) { return ev.time && ev.title; })
        .sort(function (a, b) { return a.time.localeCompare(b.time); });

    try {
        // merge: نحدّث هالحقول بس، ونخلي الرمز (code) مثل ما هو
        await setDoc(doc(db, "campaigns", auth.currentUser.uid), {
            name: document.getElementById("campaign-name").value.trim(),
            dayName: document.getElementById("day-name").value,
            date: document.getElementById("day-date").value,
            events: events,
            updatedAt: serverTimestamp()
        }, { merge: true });
        showLink(auth.currentUser.uid);
    } catch (error) {
        showMsg(publishMsg, "ما قدرنا ننشر، جرّب مرة ثانية");
    }
});

// ١١) الرابط الثابت للحجاج
function showLink(uid) {
    const url = new URL("day.html?c=" + uid, location.href).href;
    showMsg(publishMsg, "✓ وصل البرنامج لحجّاجك. رابط حملتك الثابت: ", true);
    const a = document.createElement("a");
    a.href = url;
    a.textContent = url;
    publishMsg.appendChild(a);
}
