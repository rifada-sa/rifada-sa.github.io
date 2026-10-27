// أيام الحج الستة وحساب تواريخها (مشترك بين صفحة الحملة وصفحة الحاج)

// num: المفتاح في Firestore، ar: الرقم بالعربي، name: الاسم الكامل، short: الاسم الصغير تحت الزر
export const DAYS = [
    { num: "8", ar: "٨", name: "يوم التروية", short: "التروية" },
    { num: "9", ar: "٩", name: "يوم عرفة", short: "عرفة" },
    { num: "10", ar: "١٠", name: "يوم النحر", short: "النحر" },
    { num: "11", ar: "١١", name: "أول أيام التشريق", short: "التشريق" },
    { num: "12", ar: "١٢", name: "ثاني أيام التشريق", short: "التشريق" },
    { num: "13", ar: "١٣", name: "ثالث أيام التشريق", short: "التشريق" }
];

// نجيب يوم من القائمة برقمه: getDay("9") ← يوم عرفة
export function getDay(num) {
    return DAYS.find(function (day) { return day.num === num; });
}

// "2027-05-14" ← منتصف الليل بتوقيت الجوال
// (new Date("2027-05-14") يعتبره UTC، فممكن يطلع اليوم اللي قبله)
export function parseLocalDate(text) {
    const [y, m, d] = text.split("-").map(Number);
    return new Date(y, m - 1, d); // الشهور في جافاسكربت تبدأ من صفر
}

// تاريخ أي يوم = تاريخ التروية + (رقم اليوم - 8)
export function dateOfDay(startDate, num) {
    const date = parseLocalDate(startDate);
    date.setDate(date.getDate() + (Number(num) - 8)); // setDate يعدّي آخر الشهر لحاله
    return date;
}

// تاريخ ← "الجمعة، ١٤ مايو"
export function formatDate(date) {
    return date.toLocaleDateString("ar-SA-u-ca-gregory", {
        weekday: "long", day: "numeric", month: "long"
    });
}
