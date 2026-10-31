// بطاقة المخيم: صفحة A4 فيها بطاقتين، تقرأ ?c= وتجيب الحملة
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { drawQr } from "./qr.js";
import { PHONE_PATTERN } from "./camp.js";

const campaignId = new URLSearchParams(location.search).get("c");
const msg = document.getElementById("print-msg");
const sheet = document.getElementById("print-sheet");
const printBtn = document.getElementById("print-btn");

printBtn.addEventListener("click", function () {
    window.print();
});

// سطر معلومة: العنوان صغير، والقيمة كبيرة تحته
function infoRow(label, value, dir) {
    const row = document.createElement("div");
    row.className = "print-row";
    const name = document.createElement("span");
    name.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = value;
    if (dir) strong.dir = dir;
    row.append(name, strong);
    return row;
}

// معلومات بطاقة التايه: الموجود بس
function showLostInfo(info) {
    const box = document.getElementById("print-info");
    const supervisorOk = PHONE_PATTERN.test(info.supervisorPhone);
    const emergencyOk = PHONE_PATTERN.test(info.emergencyPhone);

    if (supervisorOk) box.appendChild(infoRow("المشرف · Supervisor", info.supervisorPhone, "ltr"));
    if (emergencyOk) box.appendChild(infoRow("الطوارئ · Emergency", info.emergencyPhone, "ltr"));
    if (!supervisorOk && !emergencyOk) box.appendChild(infoRow("الطوارئ · Emergency", "911", "ltr"));
    if (info.minaCamp) box.appendChild(infoRow("مخيم منى · Mina camp", info.minaCamp));
    if (info.arafatCamp) box.appendChild(infoRow("مخيم عرفات · Arafat camp", info.arafatCamp));
}

async function load() {
    if (!campaignId) {
        msg.textContent = "ما لقينا الحملة، افتح الصفحة من لوحة الحملة";
        return;
    }
    try {
        const snap = await getDoc(doc(db, "campaigns", campaignId));
        if (!snap.exists()) {
            msg.textContent = "ما لقينا الحملة، افتح الصفحة من لوحة الحملة";
            return;
        }
        const data = snap.data();
        document.querySelectorAll(".print-name").forEach(function (el) {
            el.textContent = data.name || "";
        });
        document.getElementById("print-code").textContent = data.code || "";

        const id = encodeURIComponent(campaignId);
        drawQr(document.getElementById("qr-day"), new URL("day.html?c=" + id, location.href).href);
        drawQr(document.getElementById("qr-lost"), new URL("lost.html?c=" + id, location.href).href);
        showLostInfo(data.info || {});

        msg.hidden = true;
        sheet.hidden = false;
        printBtn.hidden = false;
    } catch (error) {
        msg.textContent = "تعذّر التحميل، تأكد من النت";
    }
}

load();
