// نسجّل الـ Service Worker عشان الموقع يفتح بدون نت (هذا الملف في كل الصفحات)
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(function () {
        // لو فشل، الموقع يشتغل عادي بس بدون نسخة محفوظة
    });

    // أول زيارة: الخطوط تتحمّل قبل ما يبدأ الـ Service Worker، فما يشوفها.
    // أول ما يمسك الصفحة نطلبها مرة ثانية عشان تنحفظ، ويبقى خط الموقع بدون نت
    navigator.serviceWorker.addEventListener("controllerchange", function () {
        performance.getEntriesByType("resource").forEach(function (entry) {
            if (entry.name.includes("fonts.g")) fetch(entry.name).catch(function () {});
        });
    });
}

// الخط الكبير: نطبّقه هنا، قبل ما تشتغل الـ modules، عشان الصفحة ما تومض (صفحة الحاج بس)
const bigBtn = document.getElementById("big-btn");

if (bigBtn) {
    try {
        if (localStorage.getItem("rifada-big") === "1") {
            document.body.classList.add("big");
            bigBtn.setAttribute("aria-pressed", "true");
        }
    } catch (error) {
        // التخزين ممنوع: نبدأ بالخط العادي
    }
}

const btn = document.getElementById("theme-btn");

// lost.html بدون زر ليل، فكل هالجزء يشتغل بس لو الزر موجود
if (btn) {
    // أول ما تفتح الصفحة: وش كان آخر اختيار؟
    if (localStorage.getItem("theme") === "night") {
        document.body.classList.add("night");
        btn.textContent = "☀️ نهار عرفات";
    }

    // لما ينضغط الزر
    btn.addEventListener("click", function () {
        document.body.classList.toggle("night");

        if (document.body.classList.contains("night")) {
            btn.textContent = "☀️ نهار عرفات";
            localStorage.setItem("theme", "night");
        } else {
            btn.textContent = "🌙 ليل مزدلفة";
            localStorage.setItem("theme", "day");
        }
    });
}