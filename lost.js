// صفحة الحاج الضايع: اللي يلقى حاج تايه يمسح QR الحملة، ويعرف حملته ومخيمه ويتصل بالمشرف
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { PHONE_PATTERN, addEnglish, campLine, callButton } from "./camp.js";

const box = document.getElementById("lost-box");
const campaignId = new URLSearchParams(location.search).get("c");

// سطر عربي وتحته الإنجليزي أصغر
function line(tag, arabic, english) {
    const el = document.createElement(tag);
    el.textContent = arabic;
    addEnglish(el, english);
    return el;
}

// صف أزرار الاتصال
function callRow(buttons) {
    const row = document.createElement("div");
    row.className = "call-row";
    row.append(...buttons);
    return row;
}

// زر 911 (لما ما عندنا رقم من الحملة)
function emergencyRow() {
    return callRow([callButton("🚨 الطوارئ", "911", "call-btn emergency", "Emergency")]);
}

// رسالة، وتحتها زر 911
function showHelp(arabic, english) {
    box.replaceChildren(line("h1", arabic, english), emergencyRow());
}

// بيانات الحملة
function showCampaign(data) {
    const info = data.info || {};
    box.replaceChildren(line("p", "هذا الحاج من حملة", "This pilgrim is with"));

    const name = document.createElement("h1");
    name.textContent = data.name || "";
    box.appendChild(name);

    if (info.minaCamp) box.appendChild(campLine("مخيم منى", info.minaCamp, "Mina camp"));
    if (info.arafatCamp) box.appendChild(campLine("مخيم عرفات", info.arafatCamp, "Arafat camp"));

    // الرابط tel: يجي من البيانات، فما نسوي الزر إلا لرقم صحيح
    const buttons = [];
    if (PHONE_PATTERN.test(info.supervisorPhone)) {
        buttons.push(callButton("📞 اتصل بالمشرف", info.supervisorPhone, "call-btn", "Call the supervisor"));
    }
    if (PHONE_PATTERN.test(info.emergencyPhone)) {
        buttons.push(callButton("🚨 الطوارئ", info.emergencyPhone, "call-btn emergency", "Emergency"));
    }

    if (buttons.length > 0) {
        box.appendChild(callRow(buttons));
    } else {
        box.appendChild(line("p", "تواصل مع أقرب مركز إرشاد", "Contact the nearest guidance center"));
        box.appendChild(emergencyRow());
    }
}

// getDoc مرة وحدة: بدون نت يقرأ النسخة المحفوظة في الجوال لو فيه
async function load() {
    if (!campaignId) {
        showHelp("ما لقينا الحملة", "Campaign not found");
        return;
    }
    try {
        const snap = await getDoc(doc(db, "campaigns", campaignId));
        if (snap.exists()) showCampaign(snap.data());
        else showHelp("ما لقينا الحملة", "Campaign not found");
    } catch (error) {
        // بدون نت وما فيه نسخة محفوظة: ما نقدر نقول إن الحملة غير موجودة
        showHelp("تعذّر التحميل، تأكد من النت", "Could not load. Check your connection");
    }
}

load();
