// صفحة الحاج: تقرأ برنامج الحملة من الرابط، وتعرض يومه وبكرة، وتتحدّث لحالها
import { db } from "./firebase.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { DAYS, getDay, parseLocalDate, dateOfDay, formatDate } from "./days.js";

const DAY_MS = 24 * 60 * 60 * 1000; // يوم كامل بالملّي ثانية
const MINUTE_MS = 60 * 1000;
const SVG_NS = "http://www.w3.org/2000/svg"; // عناصر SVG تحتاج هذا "العنوان" عشان تنرسم

// ١) نقرأ رقم الحملة من الرابط: day.html?c=xxxx
const params = new URLSearchParams(location.search);
const campaignId = params.get("c");
// للتجربة بس: day.html?c=xxxx&t=10:30 يخلي الصفحة تتصرف كأن الساعة ١٠:٣٠
const testTime = params.get("t");

const nameEl = document.getElementById("live-campaign");
const daysEl = document.getElementById("live-days");
const todayHero = document.getElementById("today-hero");

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

    // نعيد الرسم كل دقيقة (الشمس والساعة والحبّات تمشي، وبعد منتصف الليل يتغير "اليوم").
    // أول مرة ننتظر لين بداية الدقيقة الجاية، عشان الساعة الكبيرة تتغير بوقتها بالضبط
    setTimeout(function () {
        render();
        setInterval(render, MINUTE_MS);
    }, MINUTE_MS - (Date.now() % MINUTE_MS));
}

// الوقت الحين (أو وقت التجربة لو فيه &t= في الرابط)
function getNow() {
    const now = new Date();
    if (testTime && /^\d{1,2}:\d{2}$/.test(testTime)) {
        const [h, m] = testTime.split(":").map(Number);
        now.setHours(h, m, 0, 0);
    }
    return now;
}

// ٣) نرسم الصفحة حسب تاريخ اليوم
function render() {
    if (campaign === undefined) return; // لسا ننتظر Firestore
    todayHero.hidden = true; // الهيرو الكامل لأيام الحج بس، renderToday تظهره
    nameEl.hidden = false;
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
    const now = getNow();
    const today = new Date(now);
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
        renderToday(String(num), now);
    } else {
        showMessage("تقبّل الله حجّك 🤍");
    }
}

// ٤) يوم من أيام الحج: الهيرو والقوس، رحلتك، المسبحة، وبكرة
function renderToday(num, now) {
    const day = getDay(num);
    const minutes = now.getHours() * 60 + now.getMinutes();

    // نرتب نسخة من الفعاليات بالوقت (احتياط، النشر يرتبها أصلاً)
    const events = [...eventsOf(num)].sort(function (a, b) { return a.time.localeCompare(b.time); });

    // الفعالية الحالية = آخر وحدة بدأ وقتها. (-1 يعني ولا وحدة بدأت)
    let current = -1;
    events.forEach(function (ev, i) {
        if (toMinutes(ev.time) <= minutes) current = i;
    });
    const next = current + 1 < events.length ? current + 1 : -1; // اللي بعدها، لو فيه

    // نصوص الهيرو
    nameEl.hidden = true; // اسم الحملة صار داخل الهيرو
    todayHero.hidden = false;
    document.getElementById("greeting").textContent = greeting(now.getHours()) + " يا ضيف الرحمن";
    document.getElementById("today-title").textContent = day.name;
    document.getElementById("today-sub").textContent =
        day.ar + " ذو الحجة" + (campaign.name ? " · " + campaign.name : "");
    showClock(now);

    let nextText = "";
    if (next !== -1) nextText = "التالي بعد " + durationText(toMinutes(events[next].time) - minutes);
    else if (events.length > 0) nextText = "ما بقى فعاليات اليوم";
    document.getElementById("now-next").textContent = nextText;

    drawArc(events, current, minutes);

    // تحت الهيرو
    daysEl.appendChild(journey(num));
    daysEl.appendChild(masbaha(events, current, next, minutes));
    if (num !== "13") daysEl.appendChild(dayCard("بكرة: ", String(Number(num) + 1)));
}

// الساعة الكبيرة: الأرقام كبيرة، و"ص/م" في span صغير جنبها
function showClock(now) {
    // formatToParts تقسم الوقت لقطع: الساعة، النقطتين، الدقائق، و"ص/م" (dayPeriod)
    const parts = new Intl.DateTimeFormat("ar-SA", { hour: "numeric", minute: "2-digit" }).formatToParts(now);
    const clock = parts
        .filter(function (part) { return part.type !== "dayPeriod"; })
        .map(function (part) { return part.value; })
        .join("")
        .trim();
    const period = parts.find(function (part) { return part.type === "dayPeriod"; });

    const el = document.getElementById("now-time");
    el.textContent = clock;
    if (period) {
        const span = document.createElement("span");
        span.className = "ampm";
        span.textContent = period.value;
        el.append(" ", span);
    }
}

// ٥) القوس: الشمس، الجزء اللي مضى، والحبّات
function drawArc(events, current, minutes) {
    // الشمس في مكان الوقت الحالي
    const sun = arcPoint(minutes);
    ["sun", "sun-glow"].forEach(function (id) {
        const circle = document.getElementById(id);
        circle.setAttribute("cx", sun.x);
        circle.setAttribute("cy", sun.y);
    });

    // pathLength="100" يخلي طول القوس ١٠٠ مهما كان شكله،
    // فـ "40 100" تعني: لوّن أول ٤٠٪ واترك الباقي فاضي
    const passed = document.getElementById("arc-passed");
    passed.setAttribute("stroke-dasharray", sun.t * 100 + " 100");
    // قبل الفجر (t = 0): "0 100" مع الطرف الدائري يرسم نقطة، فنخفي القوس الزعفراني كله
    passed.style.display = sun.t === 0 ? "none" : "";

    // الحبّات: نمسح القديمة ونرسم من جديد
    const beads = document.getElementById("arc-beads");
    beads.innerHTML = "";
    events.forEach(function (ev, i) {
        const p = arcPoint(toMinutes(ev.time));
        if (i < current) {
            // مضت: زعفران مع ✓
            beads.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 8, class: "bead-past" }));
            beads.appendChild(svgEl("path", {
                d: "M" + (p.x - 4) + " " + p.y + " l2.7 2.9 l5.8 -6.2",
                class: "bead-check"
            }));
        } else if (i === current) {
            // الحالية: خضراء ممتلئة، وحولها هالة
            beads.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 14, class: "bead-halo" }));
            beads.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 8, class: "bead-now" }));
        } else {
            // الجاية: إطار بس
            beads.appendChild(svgEl("circle", { cx: p.x, cy: p.y, r: 8, class: "bead-next" }));
        }
    });
}

// وقت (بالدقائق من منتصف الليل) ← نقطة على القوس.
// t: من 0 (الفجر ٤:٠٠، يمين) إلى 1 (الليل ٢٤:٠٠، يسار)
function arcPoint(minutes) {
    const t = Math.min(Math.max((minutes - 240) / 1200, 0), 1); // نحصرها بين 0 و 1
    const angle = Math.PI * t; // نص دائرة = π
    return {
        t: t,
        x: Math.round((175 + 155 * Math.cos(angle)) * 10) / 10, // 175,170 مركز القوس، و155 نصف قطره
        y: Math.round((170 - 155 * Math.sin(angle)) * 10) / 10
    };
}

// ننشئ عنصر SVG ونعطيه خصائصه: svgEl("circle", { r: 8 })
function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const name in attrs) el.setAttribute(name, attrs[name]);
    return el;
}

// ٦) "رحلتك في المشاعر": ٦ أجزاء، اللي مضى والحالي أخضر
function journey(num) {
    const box = document.createElement("div");
    box.className = "journey";

    const top = document.createElement("div");
    top.className = "journey-top";
    const label = document.createElement("span");
    label.textContent = "رحلتك في المشاعر";
    const count = document.createElement("strong");
    count.textContent = "اليوم " + (Number(num) - 7).toLocaleString("ar-SA") + " من ٦";
    top.append(label, count);

    const bar = document.createElement("div");
    bar.className = "journey-bar";
    DAYS.forEach(function (day) {
        const part = document.createElement("span");
        if (Number(day.num) <= Number(num)) part.className = "done";
        bar.appendChild(part);
    });

    box.append(top, bar);
    return box;
}

// ٧) مسبحة يومك: كل فعالية حبّة، وحالتها: مضت / الآن / التالي / بعدين
function masbaha(events, current, next, minutes) {
    const box = document.createElement("div");
    box.className = "masbaha";

    const h2 = document.createElement("h2");
    const icon = document.createElement("span");
    icon.className = "tents-icon";
    h2.append(icon, "مسبحة يومك");
    box.appendChild(h2);

    if (events.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-day";
        empty.textContent = "الحملة لسا ما نشرت برنامج هاليوم";
        box.appendChild(empty);
        return box;
    }

    const list = document.createElement("ol");
    list.className = "masbaha-list";
    events.forEach(function (ev, i) {
        const li = document.createElement("li");
        if (i < current) li.className = "past";
        else if (i === current) li.className = "now";
        else if (i === next) li.className = "next";
        else li.className = "later";

        // الحبّة (الدائرة على الخط)، واللي مضت فيها ✓
        const bead = document.createElement("span");
        bead.className = "bead";
        if (i < current) {
            const check = svgEl("svg", { viewBox: "0 0 24 24", width: 14, height: 14, "aria-hidden": "true" });
            check.appendChild(svgEl("path", { d: "M5 12.5l4.5 4.5L19 7.5" }));
            bead.appendChild(check);
        }

        const body = document.createElement("div");
        body.className = "ev-body";

        const row = document.createElement("div");
        row.className = "ev-row";
        const time = document.createElement("span");
        time.className = "ev-time";
        time.textContent = formatTime(ev.time);
        const title = document.createElement("span");
        title.className = "ev-title";
        title.textContent = ev.title;

        if (i === current) {
            // الآن: شارة فوق، والعنوان كبير تحتها، وشريط مشربية تحت
            const badge = document.createElement("span");
            badge.className = "now-badge";
            badge.textContent = "الآن";
            row.append(badge, time);
            const strip = document.createElement("span");
            strip.className = "mashrabiya";
            body.append(row, title, strip);
        } else if (i === next) {
            // التالي: "التالي · بعد X" فوق، والعنوان تحت
            const label = document.createElement("span");
            label.className = "next-label";
            label.textContent = "التالي · بعد " + durationText(toMinutes(ev.time) - minutes);
            row.append(label, time);
            body.append(row, title);
        } else {
            // مضت أو بعدين: سطر واحد، العنوان والوقت
            row.append(title, time);
            body.appendChild(row);
        }

        li.append(bead, body);
        list.appendChild(li);
    });
    box.appendChild(list);
    return box;
}

// بطاقة يوم واحد بسيطة: العنوان، التاريخ، والحبّات (لـ "بكرة" وقبل الحج)
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
    todayHero.hidden = true;
    daysEl.innerHTML = "";
    const section = document.createElement("section");
    const h2 = document.createElement("h2");
    h2.textContent = text;
    section.appendChild(h2);
    daysEl.appendChild(section);
}

// تحية حسب الساعة
function greeting(hour) {
    if (hour >= 4 && hour < 12) return "صباح الخير";
    if (hour >= 12 && hour < 15) return "ظهرك سعيد";
    return "مساء الخير";
}

// العدد مع المعدود بالعربي: ١ ← one، ٢ ← two، ٣-١٠ ← few، ١١ وفوق ← many
// مثلاً countWord(5, "دقيقة", "دقيقتين", "دقائق", "دقيقة") ← "٥ دقائق"
function countWord(n, one, two, few, many) {
    if (n === 1) return one;
    if (n === 2) return two;
    return n.toLocaleString("ar-SA") + " " + (n <= 10 ? few : many);
}

// ٨٥ دقيقة ← "ساعة و٢٥ دقيقة"
function durationText(total) {
    const h = Math.floor(total / 60);
    const m = total % 60;
    const hours = h > 0 ? countWord(h, "ساعة", "ساعتين", "ساعات", "ساعة") : "";
    const mins = m > 0 ? countWord(m, "دقيقة", "دقيقتين", "دقائق", "دقيقة") : "";
    if (hours && mins) return hours + " و" + mins;
    return hours || mins;
}

// ١ ← "بكرة يوم التروية"، ٢ ← "باقي يومين…"، ٥ ← "باقي ٥ أيام…"، ٢٠ ← "باقي ٢٠ يوم…"
function countdownText(n) {
    if (n === 1) return "بكرة يوم التروية";
    return "باقي " + countWord(n, "يوم", "يومين", "أيام", "يوم") + " على يوم التروية";
}

// "06:30" ← 390 (دقيقة من منتصف الليل)
function toMinutes(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

// "06:00" ← "٦:٠٠ ص"
function formatTime(time) {
    const [h, m] = time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m);
    return d.toLocaleTimeString("ar-SA", { hour: "numeric", minute: "2-digit" });
}
