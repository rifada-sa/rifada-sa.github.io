const btn = document.getElementById("theme-btn");

btn.addEventListener("click", function () {
    document.body.classList.toggle("night");

    if (document.body.classList.contains("night")) {
        btn.textContent = "☀️ نهار عرفات";
    } else {
        btn.textContent = "🌙 ليل مزدلفة";
    }
});