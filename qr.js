// رسم QR (مشترك بين لوحة الحملة وصفحة الطباعة)
// qrcode تجي من vendor/qrcode.js، وتنحمّل بـ <script> عادي قبل هالملف

// يعبّي العنصر بـ QR للنص. المكتبة ترجع SVG فيه مربعات بس، بدون النص،
// فهنا innerHTML آمن. الإطار الأبيض من CSS (.qr-frame) عشان الكاميرا تقراه حتى بالليل
export function drawQr(el, text) {
    const qr = qrcode(0, "M"); // 0 = الحجم يتحدد حسب طول النص، و M = تصحيح أخطاء متوسط
    qr.addData(text);
    qr.make();
    el.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
}
