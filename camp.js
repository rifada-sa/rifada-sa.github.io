// أجزاء مشتركة بين بطاقة "مخيمي" في day.js وصفحة الحاج الضايع lost.js
export const PHONE_PATTERN = /^\+?\d{7,15}$/; // نفس شرط لوحة الحملة

// يضيف الإنجليزي تحت النص العربي، أصغر (lost.html بس)
export function addEnglish(el, english) {
    const small = document.createElement("small");
    small.className = "en";
    small.lang = "en";
    small.dir = "ltr";
    small.textContent = english;
    el.appendChild(small);
}

// سطر مخيم: "منى: ١٢٣" أو "منى: مربع ٥"، والإنجليزي اختياري
export function campLine(place, number, english) {
    const line = document.createElement("p");
    line.className = "camp-line";
    const name = document.createElement("span");
    name.textContent = place + ": ";
    const value = document.createElement("strong");
    value.textContent = number;
    line.append(name, value);
    if (english) addEnglish(line, english);
    return line;
}

// زر اتصال: النص، وتحته الرقم صغير، والإنجليزي اختياري بينهم
export function callButton(text, phone, className, english) {
    const a = document.createElement("a");
    a.className = className;
    a.href = "tel:" + phone;
    a.textContent = text;
    if (english) addEnglish(a, english);
    const small = document.createElement("small");
    small.dir = "ltr"; // عشان + تبقى قبل الرقم
    small.textContent = phone;
    a.appendChild(small);
    return a;
}
