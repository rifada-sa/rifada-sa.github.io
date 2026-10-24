const btn = document.getElementById("theme-btn");

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