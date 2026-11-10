# رِفادة

**برنامج أيام الحج في جوال كل حاج، من حملته إليه، بدون تحميل تطبيق.**

🔗 **https://rifada-sa.github.io**

## المشكلة

برنامج الحج يتغير، وأغلب الحجاج يعرفونه من رسالة واتساب ضاعت في القروب، أو ورقة في المخيم. وفي منى وعرفات النت ضعيف، والتطبيقات تحتاج تحميل وتسجيل، والحاج الكبير ما يبغى هذا كله.

## الحل

الحملة تكتب برنامج أيامها مرة وحدة، وتشارك رابط أو رمز أو QR. والحاج يفتحه في جواله بدون حساب، ويشوف يومه وتعديلاته لحظياً، حتى لو النت انقطع.

## قصة الاسم

كانت الرِّفادة مالاً تُخرجه قريش كل موسم، يُصنع منه طعام للحجاج أيام منى. فرضها قصيّ بن كلاب، وتولّاها من بعده هاشم بن عبد مناف. واليوم نكمل الحكاية بطريقتنا: يوم الحاج في جوّاله، ليتفرّغ لحجّه بقلب مطمئن.

## المزايا

**للحاج**
- برنامج الأيام من ٨ إلى ١٣ ذو الحجة، ويتحدّث لحظياً.
- قوس اليوم: الشمس والفعاليات في مكان وقتها، و"الآن" و"التالي".
- يشتغل بدون نت بعد أول فتحة، ويتذكر الحملة.
- يضاف للشاشة الرئيسية مثل التطبيق.
- بطاقة "مخيمي" فيها المخيم وأزرار الاتصال بالمشرف والطوارئ.
- خط كبير لكبار السن، ووضع ليلي.

**للحملة**
- حساب مجاني، ورمز من ٦ حروف، ورابط وQR.
- مسبحة يومية لكل يوم، بوقت بداية ونهاية.
- تنبيه عاجل يوصل الحجاج بالأحمر لحظياً ويختفي لحاله.
- مشاركة بالواتساب، وبطاقة مخيم جاهزة للطباعة.

**للي يلقى حاج تايه**
- بطاقة مطبوعة فيها QR والأرقام، وصفحة بالعربي والإنجليزي تعرّف بحملته ومخيمه، بدون أي بيانات عن الحاج.

## التقنيات

- HTML و CSS و JavaScript modules، بدون frameworks.
- Firebase Authentication و Cloud Firestore في منطقة الدمام، مع قواعد حماية ([firestore.rules](firestore.rules)).
- Service Worker و PWA، للعمل بدون نت والإضافة للشاشة الرئيسية.
- GitHub Pages للاستضافة.
- [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) لرسم QR (رخصة MIT).

## الخصوصية

الحاج ما يعطينا أي بيانات، وما فيه إعلانات ولا أدوات تتبّع. التفاصيل في [صفحة الخصوصية](https://rifada-sa.github.io/privacy.html).

## صور

الصور في مجلد `docs/screenshots/`.

<!-- لما تنضاف الصور:
![صفحة الحاج](docs/screenshots/day.png)
![لوحة الحملة](docs/screenshots/campaign.png)
![بطاقة المخيم](docs/screenshots/print.png)
-->

---

## English

**Rifada puts each Hajj day's schedule on every pilgrim's phone, from their campaign, with no app to install.**

🔗 **https://rifada-sa.github.io**

**The problem:** Hajj schedules change, pilgrims rely on lost WhatsApp messages and paper sheets, and the network in Mina and Arafat is weak.

**The solution:** A campaign writes its schedule once and shares a link, a code or a QR. Pilgrims open it with no account, see live updates, and keep it offline.

**The name:** *Rifada* was the provision Quraysh set aside each season to feed pilgrims, established by Qusayy ibn Kilab and carried on by Hashim ibn Abd Manaf.

**Features:** live daily schedule, offline support, home screen install, urgent alerts, camp and call card, large text, night mode, printable camp card with QR, and a bilingual page for anyone who finds a lost pilgrim.

**Built with:** HTML, CSS and JavaScript modules, Firebase Authentication and Cloud Firestore (Dammam) with security rules, Service Worker and PWA, GitHub Pages, and qrcode-generator (MIT).

**Privacy:** pilgrims give us no personal data, and there are no ads or trackers. See the [privacy page](https://rifada-sa.github.io/privacy.html).
© 2026 Rifada. All rights reserved. See LICENSE.
