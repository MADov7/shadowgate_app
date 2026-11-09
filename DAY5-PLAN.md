# خطة اليوم الخامس: التحكم بالنسخ والنشر وعمليات الدفع (Shadow Gate)

> **المصدر:** منصة CODED (Web with AI). اليوم الخامس يوم **الاثنين 9 نوفمبر، من 4:30 إلى 9:00 مساءً**، وورقة الواجب للحين مقفولة («Unlocks when Day 5 begins»).
> بنيت الخطة على عنوان اليوم وعلى قسم Day 5 في `SKILL.md` من الكلاس. وأول ما تنفتح الورقة يوم الاثنين أطابقها وأعدّل اللي يختلف.
> **الهوية:** كل شي باسمك: **Soud Alkaban (سعود عبدالعزيز الكبان) · s2ou9dalkabban@gmail.com**.

## 1. المطلوب
| # | المطلوب | من وين |
|---|---|---|
| 1 | **التحكم بالنسخ:** المشروع على Git وGitHub، بـ commits واضحة | عنوان اليوم + «Deployment: Vercel, from GitHub» |
| 2 | **Stripe Checkout (test mode) للسلة**، وجلسة الدفع تنعمل على السيرفر فقط | SKILL.md، الخطوة 9 |
| 3 | **صفحتين Success و Cancel** | SKILL.md، الخطوة 10 |
| 4 | **Bonus:** Stripe webhook يحوّل الطلب إلى **paid** في القاعدة | SKILL.md، الخطوة 11 |
| 5 | **النشر من GitHub** (SKILL.md يقول Vercel، والمحاضر سمح لنا بـ Netlify) | SKILL.md، القسم 2 |
| 6 | أسرار جديدة: `STRIPE_SECRET_KEY` و`STRIPE_WEBHOOK_SECRET`، على السيرفر فقط | SKILL.md، القسم 3 |

## 2. وين واقفين الحين
- ✅ Next.js + MongoDB Atlas + الدخول + «طلباتي» محمية. نموذج `Order` فيه أصلًا `status: pending / paid`.
- ✅ السلة فيها كميات، والسيرفر يحسب الأسعار من القاعدة.
- ✅ الموقع منشور: https://shadow-gate-storefront.netlify.app (من الـ CLI، مو من GitHub).
- ⚠️ Git موجود محليًا (آخر commit: «Baseline… before Day 4»)، بس **شغل اليوم الرابع كله مو committed** (69 ملف). وما فيه GitHub remote، و`gh` مو مثبّت.
- ⚠️ اسم المؤلف في Git حاليًا `MAD7-7 <…@users.noreply.github.com>`، ولازم يصير باسمك وإيميلك.
- ⚠️ الـ Netlify CLI على الجهاز مسجّل الحين بحساب **Amnah Alhashimi**، ولازم يرجع لحسابك (Soud Alkaban، محفوظ على الجهاز).
- ❌ ما فيه Stripe: لا حساب، ولا مكتبة `stripe`، ولا مفاتيح.

## 3. قرار يحتاج المحاضر
**النشر من GitHub على Netlify ولا على Vercel؟** SKILL.md يقول Vercel، والمحاضر سمح بـ Netlify في اليوم الرابع.
- **توصيتي:** Netlify مربوط بـ GitHub. يبقى نفس الرابط، والبناء يصير على سيرفرات Netlify، فتروح مشاكل Windows والـ DNS اللي واجهتنا.
- إذا المحاضر يبي Vercel بالذات: نسوي Import للـ repo في Vercel بنفس متغيرات البيئة. الكود نفسه يشتغل على الاثنين.

## 4. الخطوات بالترتيب

### المرحلة 0: تجهيز قبل الكلاس (أقدر أسويها الحين، تقريبًا 20 دقيقة)
- فحص أسرار على كل الملفات قبل أي commit (`.env*` و`demo-accounts.local.txt` و`db-report.html` مستبعدة أصلًا في `.gitignore`).
- اسم المؤلف في Git للمشروع: `Soud Alkaban <s2ou9dalkabban@gmail.com>`.
- commit لشغل اليوم الرابع، مقسّم: الانتقال لـ Next.js، ثم القاعدة والمنتجات، ثم الدخول، ثم «طلباتي»، ثم إصلاحات النشر. **(بموافقتك)**

### المرحلة 1: GitHub (التحكم بالنسخ، تقريبًا 20 دقيقة)
- repo جديد `shadow-gate-storefront` على حسابك في GitHub، ونرفع فرع `main`.
- README للمستودع: شرح المشروع، وطريقة التشغيل، والمتغيرات المطلوبة (بدون قيم).
- فحص تاريخ الـ commits كامل: ما فيه أي سر.
- طريقة الشغل: كل ميزة في commit لحالها برسالة واضحة. (وإذا المطلوب يقول، فرع `day-5` ثم Pull Request.)

### المرحلة 2: Stripe Checkout (تقريبًا 1.5 ساعة)
- نثبّت مكتبة `stripe` (موجودة في SKILL.md) **بموافقتك**.
- `lib/stripe.ts` على السيرفر فقط، يقرأ `STRIPE_SECRET_KEY`. إذا المفتاح ناقص، رسالة واضحة.
- **`POST /api/checkout`:**
  - يحتاج تسجيل دخول (بدونه 401).
  - يستقبل من المتصفح بس أرقام المنتجات والكميات، ويحسب الأسعار من القاعدة.
  - ينشئ `Order` بحالة pending، ثم Stripe Checkout Session فيها: `line_items` من الأسعار المحسوبة بالدولار، و`metadata.orderId`، و`client_reference_id = userId`.
  - `success_url`: `/checkout/success?session_id={CHECKOUT_SESSION_ID}`، و`cancel_url`: `/checkout/cancel`.
- خدمات «اطلب عرض سعر» (السعر 0) ما تدخل في الدفع، لأن Stripe ما يقبل مبلغ 0. هذي تتحول طلب عرض سعر مثل الحين.
- نضيف لنموذج `Order`: `stripeSessionId`، و`paymentIntentId`، و`paidAt`، و`currency`.
- زر **«ادفع الآن»** في السلة، بالعربي والإنجليزي، مع حالات التحميل والخطأ.

### المرحلة 3: صفحتين Success و Cancel (تقريبًا 30 دقيقة)
- **`/checkout/success`:**
  - السيرفر يسترجع الجلسة من Stripe ويتأكد إنها لصاحب الطلب.
  - تعرض رقم الطلب والمجموع والحالة، وتفضّي السلة.
- **`/checkout/cancel`:** رسالة واضحة وزر يرجع للسلة، والطلب يبقى pending.
- بنفس هوية Shadow Gate، عربي/إنجليزي وجوال.

### المرحلة 4: Bonus Webhook (تقريبًا 45 دقيقة)
- **`POST /api/webhook`:**
  - يقرأ الطلب خام (`req.text()`) ويتحقق من التوقيع بـ `stripe.webhooks.constructEvent` و`STRIPE_WEBHOOK_SECRET`. التوقيع الغلط يرجع 400.
  - على `checkout.session.completed`: يتأكد من المبلغ والعملة، ويحوّل الطلب إلى **paid** ويسجّل `paidAt`.
  - التكرار ما يضر: إذا وصل نفس الحدث مرتين، الطلب ما يتغير.
- «طلباتي» تعرض شارة «مدفوع».
- **التجربة:**
  - محليًا: Stripe CLI (`stripe listen`)، **بموافقتك على التثبيت**، أو نرسل حدث موقّع من سكربت اختبار.
  - على الموقع المنشور: Endpoint من Stripe Dashboard.

### المرحلة 5: النشر من GitHub (تقريبًا 30 دقيقة)
- نرجّع الـ Netlify CLI لحسابك (بموافقتك).
- نربط الموقع بالـ repo (Link repository)، وبعدها كل push على `main` يصير نشر تلقائي.
- متغيرات البيئة في Netlify: `MONGODB_URI`، و`JWT_SECRET`، و`STRIPE_SECRET_KEY`، و`STRIPE_WEBHOOK_SECRET`.
- نتأكد إن البناء من GitHub نجح، والرابط شغال.

### المرحلة 6: التحقق والتسليم (تقريبًا ساعة)
- **اختبارات وحدة:** حساب مبلغ الجلسة من القاعدة، وتجاهل أي سعر يجي من المتصفح، والتوقيع الغلط يرجع 400، وتكرار الحدث ما يغيّر الطلب.
- **E2E محلي** بكرت Stripe التجريبي `4242 4242 4242 4242`:
  - دفع، ثم صفحة success، ثم الطلب يصير **paid** في القاعدة وفي «طلباتي».
  - مسار cancel.
  - غير مسجّل يرجع 401.
- **على الموقع المنشور:** الصفحات والحماية (401/400) شغالة، وفحص أسرار يطلع 0 (المفتاح السري ما يوصل للمتصفح أبدًا).
- **صور التسليم:**
  - صفحة الدفع في Stripe (test mode)، وصفحة success، و«طلباتي» فيها «مدفوع».
  - Stripe Dashboard فيه الدفعة، والـ repo في GitHub بالـ commits.
  - Netlify «Deployed from GitHub».
- ملف تسليم: README + `DAY5-CHECKLIST.md` + الأدلة + ZIP بدون أسرار + **رابط GitHub + رابط الموقع**.

## 5. اللي عليك أنت (أوامر قصيرة، يفضل قبل الاثنين)
1. **Stripe:**
   - سوّ حساب على stripe.com **بإيميلك s2ou9dalkabban@gmail.com** وخلّه على **Test mode**.
   - روح **Developers ← API keys** وانسخ **Secret key** (يبدأ بـ `sk_test_`).
   - حطه بنفسك في `.env.local` كذا: `STRIPE_SECRET_KEY=sk_test_...`
2. **GitHub:**
   - في حسابك (MAD7-7؟): **Settings ← Emails**، تأكد إن `s2ou9dalkabban@gmail.com` مضاف ومؤكَّد، عشان الـ commits تطلع باسمك.
   - سوّ repo فاضي اسمه `shadow-gate-storefront`، **أو** وافق إني أثبّت GitHub CLI (`gh`) وتسجّل دخول مرة وحدة.
3. **Netlify:** دوس **Link repository** في إعدادات الموقع، ووافق على صلاحية GitHub.
4. **Webhook (البونص):**
   - Stripe ← **Developers ← Webhooks ← Add endpoint**.
   - الرابط `https://shadow-gate-storefront.netlify.app/api/webhook`، والحدث `checkout.session.completed`.
   - انسخ **Signing secret** (يبدأ بـ `whsec_`) وحطه في `.env.local` كذا: `STRIPE_WEBHOOK_SECRET=whsec_...`
5. **ارفع المتغيرات لـ Netlify** (في CMD، كل سطر لحاله): `cd /d C:\Users\GAMING\ShadowGate-Storefront` ثم `npx -y netlify-cli@latest env:import .env.local`
6. **دفعة تجريبية وحدة على الموقع المنشور** بكرت `4242 4242 4242 4242` (أي تاريخ مستقبلي وأي CVC) عشان صورة التسليم. أنا أختبر الدفع محليًا، بس على رابط الإنتاج لازم أنت اللي تدفع.
7. **موافقات مني تحتاجها:** commit وpush، و`npm install stripe`، وStripe CLI (اختياري)، وإرجاع الـ Netlify CLI لحسابك.

## 6. ملاحظات ومخاطر
- **Stripe ما يقبل منتجات سعرها 0.** خدمات «اطلب عرض سعر» تبقى طلب عرض سعر، ونوضح هذا في التسليم.
- **الـ webhook في App Router** يحتاج يقرأ الطلب خام (`req.text()`)، وإلا التحقق من التوقيع يفشل.
- **Atlas:** رخصة `0.0.0.0/0` تنتهي بعد أسبوع (حوالي 15 نوفمبر). خلها دائمة.
- **كلمة سر القاعدة** طلعت في صورة الشاشة، فغيّرها بعد تقييم اليوم الرابع وحدّث `.env.local` وNetlify.
- يوم الاثنين أول ما تنفتح ورقة الواجب: أقرأها وأحدّث هالخطة لو فيه شي مختلف (مثلًا Vercel إجباري، أو Pull Request، أو شي إضافي).
