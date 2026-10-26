// لوحة الحملة: الدخول، المسبحة، والنشر
import { auth, db } from "./firebase.js";
import { signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import { doc, getDoc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const loginBox = document.getElementById("login-box");
const loginForm = document.getElementById("login-form");
const loginMsg = document.getElementById("login-msg");
const dashboard = document.getElementById("dashboard");
const form = document.getElementById("campaign-form");
const eventsList = document.getElementById("events");
const template = document.getElementById("event-template");
const publishMsg = document.getElementById("publish-msg");

// ١) الدخول
loginForm.addEventListener("submit", async function (e) {
    e.preventDefault(); // لا تحدّث الصفحة
    loginMsg.textContent = "";
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        loginMsg.textContent = "الإيميل أو كلمة السر غير صحيحة";
    }
});

// ٢) كل ما تغيّر حال الدخول: نوري اللوحة أو صفحة الدخول
onAuthStateChanged(auth, async function (user) {
    if (!user) {
        loginBox.hidden = false;
        dashboard.hidden = true;
        return;
    }
    loginBox.hidden = true;
    dashboard.hidden = false;

    // نجيب البرنامج المحفوظ (لو فيه)
    const saved = await getDoc(doc(db, "campaigns", user.uid));
    eventsList.innerHTML = "";
    if (saved.exists()) {
        const data = saved.data();
        document.getElementById("campaign-name").value = data.name;
        document.getElementById("day-name").value = data.dayName;
        document.getElementById("day-date").value = data.date;
        data.events.forEach(function (ev) {
            addEvent(ev.time, ev.title);
        });
        showLink(user.uid);
    }
    if (eventsList.children.length === 0) addEvent();
});

// ٣) إضافة حبّة للمسبحة
function addEvent(time = "", title = "") {
    const li = template.content.firstElementChild.cloneNode(true);
    li.querySelector('input[type="time"]').value = time;
    li.querySelector('input[type="text"]').value = title;
    eventsList.appendChild(li);
}

document.getElementById("add-event").addEventListener("click", function () {
    addEvent();
});

// ٤) حذف حبّة (مستمع واحد للقائمة كلها)
eventsList.addEventListener("click", function (e) {
    if (e.target.closest(".remove")) {
        e.target.closest(".event").remove();
    }
});

// ٥) النشر
form.addEventListener("submit", async function (e) {
    e.preventDefault();
    publishMsg.textContent = "جاري النشر…";

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
        await setDoc(doc(db, "campaigns", auth.currentUser.uid), {
            name: document.getElementById("campaign-name").value.trim(),
            dayName: document.getElementById("day-name").value,
            date: document.getElementById("day-date").value,
            events: events,
            updatedAt: serverTimestamp()
        });
        showLink(auth.currentUser.uid);
    } catch (error) {
        publishMsg.textContent = "ما قدرنا ننشر، جرّب مرة ثانية";
    }
});

// ٦) الرابط الثابت للحجاج
function showLink(uid) {
    const url = new URL("day.html?c=" + uid, location.href).href;
    publishMsg.textContent = "✓ وصل البرنامج لحجّاجك. رابط حملتك الثابت: ";
    const a = document.createElement("a");
    a.href = url;
    a.textContent = url;
    publishMsg.appendChild(a);
}