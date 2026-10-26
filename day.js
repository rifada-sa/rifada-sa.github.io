// صفحة الحاج: تقرأ برنامج الحملة من الرابط وتتحدّث لحالها
import { db } from "./firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// ١) نقرأ رقم الحملة من الرابط: day.html?c=xxxx
const params = new URLSearchParams(location.search);
const campaignId = params.get("c");

const nameEl = document.getElementById("live-campaign");
const titleEl = document.getElementById("live-title");
const dateEl = document.getElementById("live-date");
const listEl = document.getElementById("live-events");

// لو فيه رقم حملة: نخفي المثال ونوري البرنامج الحقيقي
if (campaignId) {
    document.getElementById("demo").hidden = true;
    document.getElementById("live").hidden = false;

    // ٢) onSnapshot: يجيب البرنامج، ويرجع يشتغل كل ما الحملة عدّلت
    onSnapshot(doc(db, "campaigns", campaignId), function (snap) {
        if (!snap.exists()) {
            titleEl.textContent = "ما لقينا برنامج لهالحملة";
            listEl.innerHTML = "";
            return;
        }

        const data = snap.data();
        nameEl.textContent = data.name;
        titleEl.textContent = data.dayName;
        dateEl.textContent = data.date ? formatDate(data.date) : "";

        // ٣) نرسم الحبّات من جديد
        listEl.innerHTML = "";
        data.events.forEach(function (ev) {
            const li = document.createElement("li");
            const strong = document.createElement("strong");
            strong.textContent = formatTime(ev.time);
            li.append(strong, " " + ev.title);
            listEl.appendChild(li);
        });
    }, function (error) {
        titleEl.textContent = "تعذّر تحميل البرنامج، تأكد من النت";
    });
}

// "06:00" ← "٦:٠٠ ص"
function formatTime(time) {
    const [h, m] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString("ar-SA", { hour: "numeric", minute: "2-digit" });
}

// "2027-05-14" ← "الجمعة، ١٤ مايو"
function formatDate(date) {
    return new Date(date + "T00:00").toLocaleDateString("ar-SA-u-ca-gregory", {
        weekday: "long", day: "numeric", month: "long"
    });
}