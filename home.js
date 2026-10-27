// الصفحة الرئيسية: الحاج يكتب رمز حملته ويروح ليومه
import { db } from "./firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const codeForm = document.getElementById("code-form");
const codeInput = document.getElementById("code-input");
const codeMsg = document.getElementById("code-msg");

codeForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    codeMsg.textContent = "";
    const code = codeInput.value.trim().toUpperCase();

    // نتأكد من شكل الرمز قبل ما نسأل Firebase
    if (!/^[A-Z2-9]{6}$/.test(code)) {
        codeMsg.textContent = "الرمز ٦ حروف وأرقام، تأكد منه";
        return;
    }

    try {
        const snap = await getDoc(doc(db, "codes", code));
        if (snap.exists()) {
            location.href = "day.html?c=" + encodeURIComponent(snap.data().campaignId);
        } else {
            codeMsg.textContent = "ما لقينا حملة بهالرمز، تأكد منه";
        }
    } catch (error) {
        codeMsg.textContent = "تعذّر البحث، تأكد من اتصال النت";
    }
});
