// لوحة الحملة: الحساب، الرمز، المسبحة، والنشر
import { auth, db } from "./firebase.js";
import {
    createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
    signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc, setDoc, writeBatch, deleteField, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { DAYS, getDay, dateOfDay, formatDate } from "./days.js";

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
const startInput = document.getElementById("start-date");
const dayTabs = document.getElementById("day-tabs");
const dayLine = document.getElementById("day-line");
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
        days = emptyDays();
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
    let data = saved.exists() ? saved.data() : {};
    data = await migrateOldDay(user.uid, data);

    if (data.name) document.getElementById("campaign-name").value = data.name;
    if (data.startDate) startInput.value = data.startDate;

    // ننقل حبّات كل يوم من Firestore للمتغير days
    days = emptyDays();
    if (data.days) {
        DAYS.forEach(function (day) {
            const stored = data.days[day.num];
            if (stored && stored.events) days[day.num] = stored.events;
        });
        showLink(user.uid); // نشرت قبل
    }
    // نفتح على أول يوم فيه فعاليات، ولو ما فيه شي نفتح على ٨
    const firstDay = DAYS.find(function (day) { return days[day.num].length > 0; });
    showDay(firstDay ? firstDay.num : "8");

    codeEl.textContent = "……";
    try {
        codeEl.textContent = await ensureCode(user.uid, data);
    } catch (error) {
        codeEl.textContent = "تعذّر، حدّث الصفحة";
    }
});

// ٨) الأيام: حبّات كل يوم محفوظة هنا لين ننشر
let days = emptyDays();   // { "8": [...], "9": [...], ... }
let currentDay = "8";     // اليوم اللي معروض الحين

function emptyDays() {
    const result = {};
    DAYS.forEach(function (day) { result[day.num] = []; });
    return result;
}

// نسوي زر لكل يوم: الرقم كبير وتحته الاسم الصغير
DAYS.forEach(function (day) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day-tab";
    btn.setAttribute("role", "tab");
    btn.dataset.day = day.num; // نحفظ رقم اليوم في الزر نفسه
    const number = document.createElement("strong");
    number.textContent = day.ar;
    const name = document.createElement("small");
    name.textContent = day.short;
    btn.append(number, name);
    dayTabs.appendChild(btn);
});

// مستمع واحد للأزرار كلها
dayTabs.addEventListener("click", function (e) {
    const btn = e.target.closest(".day-tab");
    if (btn) selectDay(btn.dataset.day);
});

// نقرأ الحبّات اللي في الشاشة (حتى الناقصة، عشان ما يضيع شي وأنت تكتب)
function collectEvents() {
    return [...eventsList.querySelectorAll(".event")].map(function (li) {
        return {
            time: li.querySelector('input[type="time"]').value,
            title: li.querySelector('input[type="text"]').value.trim()
        };
    });
}

// لما تضغط يوم: نحفظ اليوم الحالي أول، بعدين نعرض الثاني
function selectDay(num) {
    days[currentDay] = collectEvents();
    showDay(num);
}

// نعرض حبّات يوم (بدون ما نحفظ اللي في الشاشة)
function showDay(num) {
    currentDay = num;
    dayTabs.querySelectorAll(".day-tab").forEach(function (btn) {
        btn.setAttribute("aria-selected", btn.dataset.day === num);
    });
    eventsList.innerHTML = "";
    days[num].forEach(function (ev) {
        addEvent(ev.time, ev.title);
    });
    if (eventsList.children.length === 0) addEvent();
    updateDayLine();
}

// "يوم التروية · الجمعة، ١٤ مايو"، أو "يوم التروية · ٨ ذو الحجة" لو ما فيه تاريخ
function updateDayLine() {
    const day = getDay(currentDay);
    const when = startInput.value
        ? formatDate(dateOfDay(startInput.value, currentDay))
        : day.ar + " ذو الحجة";
    dayLine.textContent = day.name + " · " + when;
}

startInput.addEventListener("input", updateDayLine);

// ٩) تحويل الشكل القديم (يوم واحد) للجديد (أيام)، مرة وحدة بس
const OLD_DAY_NAMES = [
    "يوم التروية · ٨ ذو الحجة",
    "يوم عرفة · ٩ ذو الحجة",
    "يوم النحر · ١٠ ذو الحجة",
    "أول أيام التشريق · ١١ ذو الحجة",
    "ثاني أيام التشريق · ١٢ ذو الحجة",
    "ثالث أيام التشريق · ١٣ ذو الحجة"
];

async function migrateOldDay(uid, data) {
    if (!data.events || data.days) return data; // جديد أصلاً، أو ما نشرت شي

    // "يوم عرفة · ٩ ذو الحجة" ← مكانه في القائمة 1 ← اليوم "9" (لو ما لقيناه نعتبره ٨)
    const index = OLD_DAY_NAMES.indexOf(data.dayName);
    const num = String(8 + Math.max(index, 0));

    const newDays = {};
    DAYS.forEach(function (day) { newDays[day.num] = { events: [] }; });
    newDays[num] = { events: data.events };

    const result = { name: data.name, code: data.code, days: newDays };
    if (num === "8" && data.date) result.startDate = data.date;

    try {
        await setDoc(doc(db, "campaigns", uid), {
            ...result,               // الحقول الجديدة
            dayName: deleteField(),  // ونحذف القديمة
            date: deleteField(),
            events: deleteField()
        }, { merge: true });
    } catch (error) {
        // لو فشل (مثلاً النت): نكمل بالشكل الجديد في الشاشة، ونعيد المحاولة الدخول الجاي
    }
    return result;
}

// ١٠) إضافة حبّة للمسبحة
function addEvent(time = "", title = "") {
    const li = template.content.firstElementChild.cloneNode(true);
    li.querySelector('input[type="time"]').value = time;
    li.querySelector('input[type="text"]').value = title;
    eventsList.appendChild(li);
}

document.getElementById("add-event").addEventListener("click", function () {
    addEvent();
});

// ١١) حذف حبّة (مستمع واحد للقائمة كلها)
eventsList.addEventListener("click", function (e) {
    if (e.target.closest(".remove")) {
        e.target.closest(".event").remove();
    }
});

// ١٢) النشر: كل الأيام مرة وحدة
form.addEventListener("submit", async function (e) {
    e.preventDefault();
    showMsg(publishMsg, "جاري النشر…");
    days[currentDay] = collectEvents(); // اليوم المعروض ممكن فيه تعديلات ما انحفظت

    // لكل يوم: نتجاهل الحبّات الناقصة، ونرتب الباقي حسب الوقت
    const daysToSave = {};
    DAYS.forEach(function (day) {
        const events = days[day.num]
            .filter(function (ev) { return ev.time && ev.title; })
            .sort(function (a, b) { return a.time.localeCompare(b.time); });
        daysToSave[day.num] = { events: events };
    });

    try {
        // merge: نحدّث هالحقول بس، ونخلي الرمز (code) مثل ما هو
        await setDoc(doc(db, "campaigns", auth.currentUser.uid), {
            name: document.getElementById("campaign-name").value.trim(),
            startDate: startInput.value,
            days: daysToSave,
            updatedAt: serverTimestamp()
        }, { merge: true });

        // نخلي اللي في الذاكرة مثل اللي انحفظ (مرتب وبدون ناقص)، ونعيد عرض اليوم الحالي
        DAYS.forEach(function (day) { days[day.num] = daysToSave[day.num].events; });
        showDay(currentDay);
        showLink(auth.currentUser.uid);
    } catch (error) {
        showMsg(publishMsg, "ما قدرنا ننشر، جرّب مرة ثانية");
    }
});

// ١٣) الرابط الثابت للحجاج
function showLink(uid) {
    const url = new URL("day.html?c=" + uid, location.href).href;
    showMsg(publishMsg, "✓ وصل البرنامج لحجّاجك. رابط حملتك الثابت: ", true);
    const a = document.createElement("a");
    a.href = url;
    a.textContent = url;
    publishMsg.appendChild(a);
}
