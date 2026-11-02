// ⚠️ كل push غيّر رقم CACHE (rifada-v1 ← rifada-v2 ...)، وإلا الحجاج يشوفون ملفات قديمة

// Service Worker: يحفظ ملفات الموقع في الجوال عشان تفتح بدون نت
const CACHE = "rifada-v5";

const FIREBASE = "https://www.gstatic.com/firebasejs/12.19.0/";

// ملفات موقعنا
const SITE_FILES = [
    "./",
    "index.html", "campaign.html", "day.html", "print.html", "lost.html", "privacy.html",
    "style.css",
    "script.js", "firebase.js", "days.js", "qr.js", "camp.js", "home.js", "campaign.js", "day.js", "print.js", "lost.js",
    "vendor/qrcode.js",
    "manifest.json",
    "icons/icon.svg", "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"
];

// مكتبة Firebase: أول زيارة تتحمّل قبل ما يشتغل الـ Service Worker، فما يلتقطها.
// لو ما حفظناها هنا، الصفحة ما تفتح بدون نت بعد أول زيارة
const FIREBASE_FILES = [
    FIREBASE + "firebase-app.js",
    FIREBASE + "firebase-firestore.js",
    FIREBASE + "firebase-auth.js"
];

// عند التثبيت: نحفظ الملفات كلها، وبعدها نستلم على طول.
// skipWaiting: بدونها النسخة الجديدة تنتظر لين تنقفل كل الصفحات، وخلال هالوقت
// يوصل HTML جديد من الشبكة مع CSS و JS قديم من الكاش
self.addEventListener("install", function (event) {
    event.waitUntil(
        caches.open(CACHE).then(function (cache) {
            // cache: "reload" يقول للمتصفح: جيب الملف من GitHub نفسه، مو من نسختك المحفوظة
            const fresh = SITE_FILES.map(function (file) {
                return new Request(file, { cache: "reload" });
            });
            return cache.addAll(fresh.concat(FIREBASE_FILES));
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

// عند التفعيل: نمسح أي كاش قديم، ونمسك الصفحات المفتوحة على طول
self.addEventListener("activate", function (event) {
    event.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(names.map(function (name) {
                if (name !== CACHE) return caches.delete(name);
            }));
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener("fetch", function (event) {
    if (event.request.method !== "GET") return; // أي طلب مو GET ما نلمسه

    const url = new URL(event.request.url);

    // Firestore وتسجيل الدخول لهم طريقتهم في العمل بدون نت، فما نلمسهم أبداً
    if (url.hostname === "firestore.googleapis.com"
        || url.hostname === "identitytoolkit.googleapis.com"
        || url.hostname === "securetoken.googleapis.com") return;

    if (event.request.mode === "navigate") {
        // صفحات HTML: عشان أي تعديل يوصل
        event.respondWith(networkFirst(event, url));
    } else if (url.origin === self.location.origin
        || (url.hostname === "www.gstatic.com" && url.pathname.startsWith("/firebasejs/"))
        || url.hostname === "fonts.googleapis.com"
        || url.hostname === "fonts.gstatic.com") {
        // باقي ملفاتنا و Firebase والخطوط: الكاش أول عشان الصفحة تفتح بسرعة حتى لو النت ضعيف
        event.respondWith(cacheFirst(event.request));
    }
});

// صفحات HTML: الشبكة أول بمهلة ثانيتين، ولو فشلت أو تأخرت من الكاش
async function networkFirst(event, url) {
    const cache = await caches.open(CACHE);
    // نحفظ بدون ?c= عشان day.html تفتح لأي حملة، وما يكبر الكاش مع كل رابط
    const key = url.origin + url.pathname;

    const network = fetch(event.request).then(function (response) {
        if (response.ok) return cache.put(key, response.clone()).then(function () { return response; });
        return response;
    });
    // نخلي الـ Service Worker صاحي لين تخلص الشبكة، حتى لو رددنا من الكاش قبلها
    event.waitUntil(network.catch(function () { }));

    const timeout = new Promise(function (resolve) { setTimeout(resolve, 2000); });
    const first = await Promise.race([network.catch(function () { }), timeout]);
    if (first) return first;

    const cached = await cache.match(key);
    return cached || network; // ما فيه نسخة محفوظة: ننتظر الشبكة
}

// الكاش أول، ولو ما فيه نجيبه ونحفظه
async function cacheFirst(request) {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;

    const response = await fetch(request);
    // "opaque": رد من موقع ثاني ما نقدر نقرأ حالته، مثل ملف CSS حق الخطوط
    if (response.ok || response.type === "opaque") await cache.put(request, response.clone());
    return response;
}