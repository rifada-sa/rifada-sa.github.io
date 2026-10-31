// بطاقة المخيم: صفحة A4 فيها بطاقتين، تقرأ ?c= وتجيب الحملة
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { drawQr } from "./qr.js";

const campaignId = new URLSearchParams(location.search).get("c");
const msg = document.getElementById("print-msg");
const sheet = document.getElementById("print-sheet");
const printBtn = document.getElementById("print-btn");

printBtn.addEventListener("click", function () {
    window.print();
});

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

        msg.hidden = true;
        sheet.hidden = false;
        printBtn.hidden = false;
    } catch (error) {
        msg.textContent = "تعذّر التحميل، تأكد من النت";
    }
}

load();
