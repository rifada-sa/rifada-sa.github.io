// صفحة الحاج: تقرأ برنامج الحملة من الرابط، وتعرض يومه وبكرة، وتتحدّث لحالها
import { db } from "./firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { DAYS, getDay, parseLocalDate, dateOfDay, formatDate } from "./days.js";

const DAY_MS = 24 * 60 * 60 * 1000; // يوم كامل بالملّي ثانية

// ١) نقرأ رقم الحملة من الرابط: day.html?c=xxxx
const params = new URLSearchParams(location.search);
const campaignId = params.get("c");

const nameEl = document.getElementById("live-campaign");
const daysEl = document.getElementById("live-days");

// آخر بيانات وصلت: undefined = لسا ما وصل شي، null = ما لقينا الحملة
let campaign;

// لو فيه رقم حملة: نخفي المثال ونوري البرنامج الحقيقي
if (campaignId) {
    document.getElementById("demo").hidden = true;
    document.getElementById("live").hidden = false;

    // ٢) onSnapshot: يجيب البرنامج، ويرجع يشتغل كل ما الحملة عدّلت
    onSnapshot(doc(db, "campaigns", campaignId), function (snap) {
        campaign = snap.exists() ? snap.data() : null;
        render();
    }, function (error) {
        showMessage("تعذّر تحميل البرنامج، تأكد من النت");
    });

    // لو الصفحة مفتوحة وعدّى منتصف الليل: نعيد الرسم كل دقيقة عشان يتغير "اليوم"
    setInterval(render, 60 * 1000);
}

// ٣) نرسم البطاقات حسب تاريخ اليوم
function render() {
    if (campaign === undefined) return; // لسا ننتظر Firestore
    if (campaign === null) {
        nameEl.textContent = "";
        showMessage("ما لقينا برنامج لهالحملة");
        return;
    }

    nameEl.textContent = campaign.name || "";
    daysEl.innerHTML = "";

    // الحملة ما كتبت تاريخ التروية: ما نعرف وش اليوم، فنعرض كل الأيام اللي فيها فعاليات
    if (!campaign.startDate) {
        const withEvents = DAYS.filter(function (day) { return eventsOf(day.num).length > 0; });
        if (withEvents.length === 0) {
            showMessage("الحملة لسا ما نشرت برنامجها");
            return;
        }
        withEvents.forEach(function (day) {
            daysEl.appendChild(dayCard("", day.num));
        });
        return;
    }

    // نقارن منتصف ليل اليوم بمنتصف ليل التروية، الاثنين بتوقيت الجوال
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = parseLocalDate(campaign.startDate);
    // Math.round: لو فيه توقيت صيفي، الفرق ممكن يطلع ٠٫٩٦ يوم بدل ١
    const num = 8 + Math.round((today - start) / DAY_MS);

    if (num < 8) {
        // قبل الحج: نعرض يوم التروية، وفوقه كم باقي
        const card = dayCard("أول أيامك: ", "8");
        const countdown = document.createElement("p");
        countdown.className = "countdown";
        countdown.textContent = countdownText(8 - num);
        card.prepend(countdown);
        daysEl.appendChild(card);
    } else if (num <= 13) {
        daysEl.appendChild(dayCard("اليوم: ", String(num)));
        if (num < 13) daysEl.appendChild(dayCard("بكرة: ", String(num + 1)));
    } else {
        showMessage("تقبّل الله حجّك 🤍");
    }
}

// بطاقة يوم واحد: العنوان، التاريخ، والحبّات
function dayCard(label, num) {
    const day = getDay(num);
    const section = document.createElement("section");

    const h2 = document.createElement("h2");
    h2.textContent = label + day.name;

    const date = document.createElement("p");
    date.textContent = campaign.startDate
        ? formatDate(dateOfDay(campaign.startDate, num))
        : day.ar + " ذو الحجة";

    section.append(h2, date);

    const events = eventsOf(num);
    if (events.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-day";
        empty.textContent = "الحملة لسا ما نشرت برنامج هاليوم";
        section.appendChild(empty);
    } else {
        const list = document.createElement("ul");
        list.className = "timeline";
        events.forEach(function (ev) {
            const li = document.createElement("li");
            const strong = document.createElement("strong");
            strong.textContent = formatTime(ev.time);
            li.append(strong, " " + ev.title);
            list.appendChild(li);
        });
        section.appendChild(list);
    }
    return section;
}

// فعاليات يوم، أو قائمة فاضية لو ما فيه
function eventsOf(num) {
    const day = campaign.days && campaign.days[num];
    return (day && day.events) || [];
}

// بطاقة فيها رسالة بس
function showMessage(text) {
    daysEl.innerHTML = "";
    const section = document.createElement("section");
    const h2 = document.createElement("h2");
    h2.textContent = text;
    section.appendChild(h2);
    daysEl.appendChild(section);
}

// ١ ← "بكرة يوم التروية"، ٢ ← "باقي يومين…"، ٥ ← "باقي ٥ أيام…"، ٢٠ ← "باقي ٢٠ يوم…"
function countdownText(n) {
    if (n === 1) return "بكرة يوم التروية";
    if (n === 2) return "باقي يومين على يوم التروية";
    const word = n <= 10 ? "أيام" : "يوم";
    return "باقي " + n.toLocaleString("ar-SA") + " " + word + " على يوم التروية";
}

// "06:00" ← "٦:٠٠ ص"
function formatTime(time) {
    const [h, m] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString("ar-SA", { hour: "numeric", minute: "2-digit" });
}
