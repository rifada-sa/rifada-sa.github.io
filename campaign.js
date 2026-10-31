// لوحة الحملة: الحساب، الرمز، المسبحة، والنشر
import { auth, db } from "./firebase.js";
import {
    createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail,
    signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc, setDoc, writeBatch, deleteField, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { DAYS, getDay, dateOfDay, formatDate } from "./days.js";
import { drawQr } from "./qr.js";

const authBox = document.getElementById("auth-box");
const tabSignup = document.getElementById("tab-signup");
const tabLogin = document.getElementById("tab-login");
const signupForm = document.getElementById("signup-form");
const signupMsg = document.getElementById("signup-msg");
const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-msg");
const dashboard = document.getElementById("dashboard");
const codeEl = document.getElementById("campaign-code");
const previewLink = document.getElementById("preview-link");
const doorCard = document.getElementById("door-card");
const doorCopy = document.getElementById("door-copy");
const alertForm = document.getElementById("alert-form");
const alertText = document.getElementById("alert-text");
const alertError = document.getElementById("alert-error");
const alertDuration = document.getElementById("alert-duration");
const alertStatus = document.getElementById("alert-status");
const alertButtons = document.querySelectorAll(".alert-actions button");
const form = document.getElementById("campaign-form");
const startInput = document.getElementById("start-date");
const supervisorInput = document.getElementById("supervisor-phone");
const supervisorError = document.getElementById("supervisor-error");
const emergencyInput = document.getElementById("emergency-phone");
const emergencyError = document.getElementById("emergency-error");
const minaInput = document.getElementById("mina-camp");
const arafatInput = document.getElementById("arafat-camp");
const dayTabs = document.getElementById("day-tabs");
const dayLine = document.getElementById("day-line");
const eventsList = document.getElementById("events");
const addEventBtn = document.getElementById("add-event");
const eventLimit = document.getElementById("event-limit");
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
    el.classList.remove("failed");
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
        supervisorError.textContent = ""; // form.reset() ما يمسح رسائل الخطأ
        emergencyError.textContent = "";
        codeEl.textContent = "";
        previewLink.hidden = true;
        doorCard.hidden = true;
        alertForm.reset();
        alertError.textContent = "";
        alertUntil = 0;
        showAlertStatus();
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
    if (data.info) {
        supervisorInput.value = data.info.supervisorPhone || "";
        emergencyInput.value = data.info.emergencyPhone || "";
        minaInput.value = data.info.minaCamp || "";
        arafatInput.value = data.info.arafatCamp || "";
    }
    if (data.alert && Date.now() < data.alert.until) { // التنبيه المنتهي نتجاهله
        alertText.value = data.alert.text;
        alertUntil = data.alert.until;
    }
    showAlertStatus();

    // ننقل حبّات كل يوم من Firestore للمتغير days
    days = emptyDays();
    if (data.days) {
        DAYS.forEach(function (day) {
            const stored = data.days[day.num];
            if (stored && stored.events) days[day.num] = stored.events;
        });
        showLink(user.uid, false); // نشرت قبل
    }
    // نفتح على أول يوم فيه فعاليات، ولو ما فيه شي نفتح على ٨
    const firstDay = DAYS.find(function (day) { return days[day.num].length > 0; });
    showDay(firstDay ? firstDay.num : "8");

    codeEl.textContent = "……";
    try {
        codeEl.textContent = await ensureCode(user.uid, data);
        if (!doorCard.hidden) showDoor(user.uid); // الرمز وصل بعد البطاقة
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
            time: li.querySelector(".start-time").value,
            title: li.querySelector('input[type="text"]').value.trim(),
            end: li.querySelector(".end-time").value
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
        addEvent(ev.time, ev.title, ev.end || "");
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

    // نضيف الحقل بس لو موجود: Firestore يرفض الكتابة كلها لو فيها undefined
    const result = { days: newDays };
    if (data.name) result.name = data.name;
    if (data.code) result.code = data.code;
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
function addEvent(time = "", title = "", end = "") {
    const li = template.content.firstElementChild.cloneNode(true);
    li.querySelector(".start-time").value = time;
    li.querySelector(".end-time").value = end;
    li.querySelector('input[type="text"]').value = title;
    eventsList.appendChild(li);
    updateEventLimit();
}

// الحد ٤٠ حبّة لليوم (نفس حد القواعد). نعدّ حبّات الشاشة، فالفحص يمشي لكل يوم لحاله:
// showDay ترسم حبّات اليوم بـ addEvent، فبتبديل اليوم يتحدّث الزر لحاله
const MAX_EVENTS = 40;

function updateEventLimit() {
    const full = eventsList.children.length >= MAX_EVENTS;
    addEventBtn.disabled = full;
    eventLimit.hidden = !full;
}

addEventBtn.addEventListener("click", function () {
    addEvent();
});

// ١١) حذف حبّة (مستمع واحد للقائمة كلها)
eventsList.addEventListener("click", function (e) {
    if (e.target.closest(".remove")) {
        e.target.closest(".event").remove();
        updateEventLimit();
    }
});

// ١٢) النشر: كل الأيام مرة وحدة
form.addEventListener("submit", async function (e) {
    e.preventDefault();

    // نتأكد من أرقام الجوال أول، ولو فيه غلط نوقف النشر (والرابط يبقى مكانه)
    const supervisorPhone = normalizePhone(supervisorInput.value);
    const emergencyPhone = normalizePhone(emergencyInput.value);
    const supervisorOk = checkPhone(supervisorPhone, supervisorError);
    const emergencyOk = checkPhone(emergencyPhone, emergencyError);
    if (!supervisorOk || !emergencyOk) {
        (supervisorOk ? emergencyInput : supervisorInput).focus(); // نروح لأول رقم غلط
        return;
    }

    showMsg(publishMsg, "جاري النشر…");
    days[currentDay] = collectEvents(); // اليوم المعروض ممكن فيه تعديلات ما انحفظت

    // لكل يوم: نتجاهل الحبّات الناقصة، ونرتب الباقي حسب الوقت
    const daysToSave = {};
    DAYS.forEach(function (day) {
        const events = days[day.num]
            .filter(function (ev) { return ev.time && ev.title; })
            .sort(function (a, b) { return a.time.localeCompare(b.time); })
            .map(function (ev) {
                // end اختياري: لو فاضي ما نحفظه أصلاً
                const clean = { time: ev.time, title: ev.title };
                if (ev.end) clean.end = ev.end;
                return clean;
            });
        daysToSave[day.num] = { events: events };
    });

    try {
        // merge: نحدّث هالحقول بس، ونخلي الرمز (code) مثل ما هو
        await setDoc(doc(db, "campaigns", auth.currentUser.uid), {
            name: document.getElementById("campaign-name").value.trim(),
            startDate: startInput.value,
            days: daysToSave,
            info: {
                supervisorPhone: supervisorPhone,
                emergencyPhone: emergencyPhone,
                minaCamp: minaInput.value.trim(),
                arafatCamp: arafatInput.value.trim()
            },
            updatedAt: serverTimestamp()
        }, { merge: true });

        // نكتب في الحقول النسخة النظيفة اللي انحفظت
        supervisorInput.value = supervisorPhone;
        emergencyInput.value = emergencyPhone;
        minaInput.value = minaInput.value.trim();
        arafatInput.value = arafatInput.value.trim();

        // نخلي اللي في الذاكرة مثل اللي انحفظ (مرتب وبدون ناقص)، ونعيد عرض اليوم الحالي
        DAYS.forEach(function (day) { days[day.num] = daysToSave[day.num].events; });
        showDay(currentDay);
        showLink(auth.currentUser.uid, true);
    } catch (error) {
        showMsg(publishMsg, "ما قدرنا ننشر، جرّب مرة ثانية");
        publishMsg.classList.add("failed"); // نفس سطر "جاري النشر…"، فنلوّنه أحمر وقت الخطأ بس
    }
});

// ١٣) الرابط الثابت للحجاج
// justPublished: true بعد النشر، وfalse لما نعرض الرابط عند الدخول بس
function showLink(uid, justPublished) {
    const url = new URL("day.html?c=" + uid, location.href).href;
    const text = justPublished ? "✓ وصل البرنامج لحجّاجك. رابط حملتك الثابت: " : "رابط حملتك الثابت: ";
    showMsg(publishMsg, text, true);
    const a = document.createElement("a");
    a.href = url;
    a.textContent = url;
    publishMsg.appendChild(a);

    // showLink تشتغل بس لو الحملة نشرت، فهنا نظهر "شوف كأنك حاج"
    previewLink.href = url;
    previewLink.hidden = false;
    showDoor(uid);
}

// ١٦) باب الرفادة: الرمز والـ QR وطرق وصول الحجاج، يظهر بعد أول نشر
let doorUrl = "";

function showDoor(uid) {
    doorUrl = new URL("day.html?c=" + uid, location.href).href;
    const name = document.getElementById("campaign-name").value.trim();
    const code = /^[A-Z2-9]{6}$/.test(codeEl.textContent) ? codeEl.textContent : ""; // "……" لين يوصل الرمز

    document.getElementById("door-code").textContent = code;
    drawQr(document.getElementById("door-qr"), doorUrl);
    document.getElementById("door-whatsapp").href =
        "https://wa.me/?text=" + encodeURIComponent(whatsappMessage(name, doorUrl, code));
    document.getElementById("door-print").href = "print.html?c=" + uid;
    doorCard.hidden = false;
}

// رسالة الواتساب. سطر الرمز يطلع بس لو الرمز موجود
function whatsappMessage(name, url, code) {
    let text = "حيّاكم الله يا ضيوف الرحمن 🤍\n"
        + "هذا برنامج أيام الحج من " + name + "، ويتحدّث لحاله أول بأول:\n"
        + url + "\n"
        + "افتحوه الحين وفيه نت، واضغطوا «إضافة إلى الشاشة الرئيسية»، وافتحوه مرة من الأيقونة وفيه نت، عشان يفتح معكم في منى وعرفات حتى لو النت ضعيف.";
    if (code) text += "\nأو اكتبوا الرمز " + code + " في rifada-sa.github.io";
    return text;
}

// انسخ الرابط: النص يتغير ثانيتين
let copyTimer;

doorCopy.addEventListener("click", async function () {
    try {
        await navigator.clipboard.writeText(doorUrl);
        doorCopy.textContent = "انتسخ ✓";
    } catch (error) {
        doorCopy.textContent = "ما انتسخ، جرّب مرة ثانية";
    }
    clearTimeout(copyTimer);
    copyTimer = setTimeout(function () { doorCopy.textContent = "انسخ الرابط"; }, 2000);
});

// ١٤) أرقام الحملة: تنظيف أرقام الجوال والتحقق منها
// نحوّل الأرقام العربية والفارسية/الأردية لإنجليزية، ونشيل المسافات والشرطات
// "٠٥٠ ١٢٣-٤٥٦٧" ← "0501234567"، و"۰۵۰ ۱۲۳-۴۵۶۷" ← "0501234567"
function normalizePhone(text) {
    return text
        .replace(/[٠-٩]/g, function (digit) { return "٠١٢٣٤٥٦٧٨٩".indexOf(digit); })
        .replace(/[۰-۹]/g, function (digit) { return "۰۱۲۳۴۵۶۷۸۹".indexOf(digit); })
        .replace(/[\s-]/g, "");
}

// فاضي = صح (الحقل اختياري). الحملات من كل العالم، فما نقيّد بالسعودية
function isValidPhone(text) {
    return text === "" || /^\+?\d{7,15}$/.test(text);
}

// نكتب رسالة الخطأ تحت الحقل لو الرقم غلط، ونمسحها لو صح
function checkPhone(phone, errorEl) {
    const ok = isValidPhone(phone);
    errorEl.textContent = ok ? "" : "الرقم غلط، اكتبه أرقام بس مثل 0501234567";
    return ok;
}

// ١٥) التنبيه العاجل: سطر يطلع عند الحجاج بالأحمر ويختفي لحاله وقت until
let alertUntil = 0; // متى ينتهي التنبيه الظاهر، بالملّي ثانية (0 = ما فيه)

// نهاية التنبيه: "midnight" = منتصف الليل الجاي بتوقيت الجوال، وغيرها عدد دقائق
function alertEnd(value) {
    if (value === "midnight") {
        const end = new Date();
        end.setHours(24, 0, 0, 0); // الساعة ٢٤ = بداية بكرة
        return end.getTime();
    }
    return Date.now() + Number(value) * 60 * 1000;
}

// سطر الحالة: "التنبيه ظاهر لين ٤:٣٠ م" أو "ما فيه تنبيه"
function showAlertStatus() {
    if (Date.now() < alertUntil) {
        const time = new Date(alertUntil).toLocaleTimeString("ar-SA", { hour: "numeric", minute: "2-digit" });
        alertStatus.textContent = "التنبيه ظاهر لين " + time;
    } else {
        alertStatus.textContent = "ما فيه تنبيه";
    }
}

// لو اللوحة مفتوحة وانتهى الوقت، يتغير السطر لحاله
setInterval(showAlertStatus, 60 * 1000);

// أول ما ينضغط الزر: نعطّل الزرين ونكتب وش قاعد يصير.
// بدون نت Firestore يحفظ الطلب وينتظر، فالزرين يبقون معطّلين لين يرجع النت
function startAlertWork(working, offline) {
    alertButtons.forEach(function (btn) { btn.disabled = true; });
    alertStatus.textContent = navigator.onLine ? working : offline;
}

// بعد ما ينجح أو يفشل: نرجّع الزرين ونحدّث السطر
function endAlertWork() {
    alertButtons.forEach(function (btn) { btn.disabled = false; });
    showAlertStatus();
}

// الإرسال: نكتب alert بس، والبرنامج ما ينلمس (merge)
alertForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const text = alertText.value.trim();
    if (!text) {
        alertError.textContent = "اكتب نص التنبيه أول";
        alertText.focus();
        return;
    }
    alertError.textContent = "";
    const until = alertEnd(alertDuration.value);
    startAlertWork("جاري الإرسال…", "ما فيه نت. التنبيه محفوظ، وبينرسل أول ما يرجع النت وتكون هالصفحة مفتوحة");
    try {
        await setDoc(doc(db, "campaigns", auth.currentUser.uid), {
            alert: { text: text, until: until }
        }, { merge: true });
        alertUntil = until;
    } catch (error) {
        alertError.textContent = "ما قدرنا نرسل التنبيه، جرّب مرة ثانية";
    } finally {
        endAlertWork(); // finally تشتغل في الحالتين: نجح أو فشل
    }
});

// المسح: نحذف alert من المستند
document.getElementById("alert-clear").addEventListener("click", async function () {
    alertError.textContent = "";
    startAlertWork("جاري المسح…", "ما فيه نت. المسح محفوظ، وبينرسل أول ما يرجع النت وتكون هالصفحة مفتوحة");
    try {
        await setDoc(doc(db, "campaigns", auth.currentUser.uid), {
            alert: deleteField()
        }, { merge: true });
        alertText.value = "";
        alertUntil = 0;
    } catch (error) {
        alertError.textContent = "ما قدرنا نمسح التنبيه، جرّب مرة ثانية";
    } finally {
        endAlertWork();
    }
});
