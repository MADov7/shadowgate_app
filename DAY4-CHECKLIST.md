# SHADOW GATE — قائمة متطلبات اليوم الرابع (Day 4 Checklist)

> **🔗 الموقع المنشور على Netlify:** https://shadow-gate-storefront.netlify.app (نسخة الإنتاج 6af01a9ccc11f08d606ff68b، 2026-11-08)
>
> **التحقق النهائي (2026-11-08):**
> - **القاعدة الحقيقية (MongoDB Atlas):**
>   - ✅ الاتصال (`npm run db:check`).
>   - ✅ تعبئة 12 منتج بدون تكرار (`npm run seed` مرتين).
>   - ✅ التعديل في Atlas يظهر بعد التحديث.
>   - ✅ كل كلمات السر bcrypt (`$2b$12$`).
>   - ✅ حسابين، وكل واحد يشوف طلباته بس.
> - **الاختبارات:** ✅ **371/371** اختبار وحدة · ✅ **30/30** E2E محلي (desktop + mobile) على Atlas.
> - **على الموقع المنشور:**
>   - ✅ **18/18** smoke E2E.
>   - ✅ فحوص HTTP والحماية.
>   - ✅ فحص الأسرار: 0.
>   - ✅ الكونسول بدون أخطاء.

الرمز: ✅ تم وتأكدت منه

> المشروع: `C:\Users\GAMING\ShadowGate-Storefront` · ملف المهارات: `SKILL.md`
> المحاضر سمح بـ Netlify بدل Replit/Vercel، فالأسرار في **Netlify Environment Variables** (للموقع المنشور) وفي **`.env.local`** (على الجهاز).
> Stripe والـ webhook والنشر الخاص باليوم الخامس خارج النطاق.

## المطلوب الأساسي (من ورقة الواجب)

| # | المطلوب | الملفات / المسارات | الحالة والدليل |
|---|---|---|---|
| 1 | ربط المتجر بـ MongoDB Atlas (M0 على حسابي) | `lib/db.ts` (اتصال واحد مشترك ومحفوظ globally) · `models/User.ts` · `models/Product.ts` · `models/Order.ts` | ✅ مشروع ShadowGate ← Cluster M0 ← قاعدة `shadowgate` (products 12 · users · orders). الموقع المنشور يقرأ منها (`/api/products` يرجع 12). |
| 2 | `MONGODB_URI` في الأسرار وأبدًا مو في كود الواجهة | `lib/db.ts` يقرأ `process.env.MONGODB_URI` على السيرفر فقط · `.gitignore` فيه `.env*` · `.env.local` محلي · Netlify env | ✅ موجود في متغيرات Netlify. فحص الأسرار على 49 ملف JS/CSS من الموقع المنشور + الصفحات + الـ API = **0** (`evidence/live-netlify-secret-scan.txt`). وما فيه أي سر داخل ZIP الكود. |
| 3 | المنتجات تنحفظ في القاعدة وتنعرض منها | `scripts/seed.ts` + `scripts/seed/catalog-data.ts` (بيانات التعبئة فقط) · `lib/catalog.ts` (بدون fallback) · `src/data/services.ts` (سجل فاضي يتعبّى من القاعدة) · `app/page.tsx` · `app/products/(list)/page.tsx` · `app/products/[slug]/page.tsx` · `app/api/products/*` | ✅ seed مرتين: 12 created ثم 0 created / 12 updated. وتعديل السعر في Atlas ظهر في الموقع بعد التحديث. |
| 4 | تسجيل حساب جديد (Sign Up) | `app/signup/page.tsx` · `components/shop/views/SignupView.tsx` · `app/api/auth/signup/route.ts` · `lib/validators.ts` | ✅ الحفظ (201)، والإيميل المكرر (409)، والتحقق (400) على السيرفر وفي المتصفح. |
| 5 | تسجيل دخول (Log In) | `app/login/page.tsx` · `components/shop/views/LoginView.tsx` · `app/api/auth/login/route.ts` · `lib/session.ts` (JWT) · `lib/auth.ts` (الكوكي) | ✅ مقارنة bcrypt ← JWT في كوكي `sg_session` (HttpOnly · Secure · SameSite=Lax · 7 أيام). |
| 6 | كلمات السر تنحفظ Hash | bcryptjs (cost 12) في `app/api/auth/signup/route.ts` · `models/User.ts` (`passwordHash` مع `select:false` وينحذف من JSON) · `lib/users.ts` | ✅ كل المستخدمين `$2b$12$…` (60 حرف)، وما يرجع الهاش في أي رد. |

## التحدي الإضافي (Bonus)

| # | المطلوب | الملفات / المسارات | الحالة والدليل |
|---|---|---|---|
| 7 | صفحة «طلباتي» محمية (Token صحيح فقط) | `app/orders/page.tsx` و`app/orders/[id]/page.tsx` (فحص على السيرفر ← **307** إلى `/login`) · `app/api/orders/route.ts` (**401**) | ✅ على الموقع المنشور: بدون توكن، وتوكن مزوّر، وتوكن منتهي، كلها ← 307 / 401. |
| 8 | كل مستخدم يشوف طلباته بس | `lib/orders.ts`: `find({ user })` و`findOne({ _id, user })` · `app/api/orders/[id]/route.ts` · رقم المستخدم من التوكن فقط (`lib/validators.ts` يتجاهل أي `user` من المتصفح) | ✅ حسابين (سارة وعلي): كل واحد يشوف طلبه بس، وطلب سارة يرجع لعلي **404** من الصفحة ومن الـ API (`screenshots/day4-demo-with-database/` 10–13 + `e2e/day4.spec.ts`). |
| 9 | ربط نموذج الطلب والحجز الموجودين بالطلبات | `src/sections/Contact/Contact.tsx` و`src/overlays/BookingDialog.tsx` ← `POST /api/orders` | ✅ التأكيد يطلع **بعد** نجاح الحفظ فقط، والأسعار والمجموع يحسبها السيرفر. |

## خطوات `SKILL.md` (بالترتيب)

| الخطوة | الملفات | الحالة |
|---|---|---|
| 1. Next.js App Router + TypeScript + Tailwind بنفس التصميم | `next.config.ts` · `app/layout.tsx` · `app/tailwind.css` · `postcss.config.mjs` · `components/ExperienceClient.tsx` · `src/ClientApp.tsx` | ✅ نفس الهوية، والتجربة ثلاثية الأبعاد، والعربي، والجوال (`screenshots/live-netlify-final/`) |
| 2. الصفحات: Home (Hero + خدمات مميزة)، Products، Product details، Cart | `app/page.tsx` · `app/products/*` · `app/cart/page.tsx` · `components/shop/*` | ✅ |
| 3. الاتصال بـ MongoDB والنماذج | `lib/db.ts` · `models/*` · `npm run db:check` | ✅ |
| 4. تحميل المنتجات من القاعدة | `lib/catalog.ts` · `npm run seed` | ✅ |
| 5. صفحة Sign up + API | (انظر رقم 4) | ✅ |
| 6. صفحة Log in + API (مقارنة الهاش + JWT cookie) | (انظر رقم 5) | ✅ |
| 7. Log out + اسم المستخدم في القائمة | `app/api/auth/logout/route.ts` · `app/api/auth/me/route.ts` · `src/components/layout/AccountControl.tsx` · `components/shop/ShopNav.tsx` | ✅ الخروج يمسح الكوكي (Max-Age=0)، والاسم يطلع في القائمة |
| 8. Bonus: My Orders محمية | (انظر 7–9) | ✅ |
| النشر على Netlify | `netlify.toml` (`npm run build:netlify` = `next build --webpack`، `publish = ".next"`) · متغيرات `MONGODB_URI` و`JWT_SECRET` في Netlify | ✅ https://shadow-gate-storefront.netlify.app |

## قواعد الجودة (`SKILL.md` §7)

| القاعدة | أين | الحالة |
|---|---|---|
| متجاوب (الجوال أولًا) | كل الصفحات · `components/shop/shop.css` | ✅ 360 و390 بكسل، عربي وإنجليزي، بدون تحريك جانبي |
| حالات التحميل والنجاح والخطأ | `components/shop/ShopSkeleton.tsx` · `app/error.tsx` · `app/not-found.tsx` · `components/shop/DbNotice.tsx` · رسائل النماذج | ✅ |
| كل API يرجع الكود الصحيح | `lib/http.ts`: 200 / 201 / 400 / 401 / 404 / 409 / 500 / 503 | ✅ (`evidence/live-netlify-http-checks.txt`) |
| التحقق من النماذج (فراغ، صيغة الإيميل، كلمة سر ≥ 8) | `lib/validators.ts` (السيرفر) · `components/shop/authShared.tsx` (المتصفح) | ✅ |
| ترتيب المجلدات | `app/` · `app/api/auth/{signup,login,logout,me}` · `app/api/products` · `app/api/orders` · `components/` · `lib/` · `models/` | ✅ |
| هيدرات الأمان | `netlify.toml` (الملفات الثابتة) + `next.config.ts` `headers()` (الصفحات والـ API) | ✅ nosniff · Referrer-Policy · HSTS |

## ملاحظات للمصحّح
- **الأسعار حسب النطاق:** الخدمات اللي سعرها حسب النطاق تنحفظ `price: 0` مع `pricing.kind = 'quote'`، والواجهة تعرض بدالها **«اطلب عرض سعر»**. وفي الطلبات، السيرفر يجمع الأسعار التوضيحية بس.
- **الباقات في صفحة السلة** (Foundation / Business / Continuity Gate) إعدادات تسويقية ثابتة تشير لمنتجات القاعدة بالـ slug. المنتجات نفسها وأسعارها كلها من القاعدة.
- **`src/ad/`** صفحة Vite منفصلة لتصيير فيديو الإعلان، وتستخدم بيانات التعبئة. المتجر ما يستخدمها.
- **ليش الحسابات انختبرت محليًا بس:** ما سوينا حسابات على الموقع المنشور عشان ما نوسّخ قاعدة الإنتاج. التسجيل والدخول وعزل الطلبات انختبرت على **نفس قاعدة Atlas** من نسخة الإنتاج المحلية (30/30).

## الاختبارات
- اختبارات الوحدات: **371/371** ✅ (`npm test`)
- E2E محلي: **30/30** ✅ (`npm run test:e2e`، desktop + mobile، على Atlas الحقيقي، منها `e2e/day4.spec.ts`: حسابين مع عزل الطلبات والأسعار من السيرفر)
- E2E على الموقع المنشور: **18/18** ✅ (`npx playwright test -c playwright.live.config.ts`، للقراءة فقط بدون إنشاء حسابات)

## مراجعات الوكلاء (Agents)
- **مراجعة أمنية:** 3 مشاكل حقيقية وكلها انصلحت:
  - تحويل لموقع خارجي عبر `next=`.
  - تأكيد التصريح لاختبار الاختراق كان في المتصفح بس، وصار السيرفر يفرضه.
  - توقف القاعدة كان يرجع 500، وصار يرجع 503.
- **مراجعة الواجهة:** 20 ملاحظة وكلها انصلحت.
- **التحقق من الموقع المنشور (جولتين):** لقينا وصلّحنا:
  - الملفات الثابتة كانت ترجع 404 بسبب النشر على خطوتين، وصار النشر بخطوة وحدة.
  - هيدر Referrer-Policy ما كان يوصل للصفحات.
  - خطأ hydration (React #418) بسبب تعليق يحقنه Netlify في `<head>`.
  - السعر بالعربي كان يطلع «$US 49».
