# SHADOW GATE — قائمة متطلبات اليوم الرابع (Day 4 Checklist) — نسخة Supabase

> **🔗 الموقع المنشور:** https://shadow-gate-storefront.netlify.app · وأيضًا https://shadowgate-app.vercel.app
> **📦 الكود:** https://github.com/MADov7/shadowgate_app
>
> **بعد ملاحظة التصحيح (2026-11-11):** انتقل المتجر بالكامل إلى **Supabase**:
> - المنتجات صارت تُقرأ مباشرة من جدول `products` في Supabase، وما عاد فيه أي كتالوج مكتوب في كود التطبيق.
> - التسجيل والدخول صاروا عن طريق **Supabase Auth**.
> - الطلبات صارت في جدول `orders` محمي بـ **Row Level Security**.
>
> **التحقق (2026-11-11):**
> - ✅ مشروع Supabase اسمه `shadow-gate` (المنظمة MAD7-7's Org، المنطقة us-east-1).
>   - جدول `products` فيه **12** منتج.
>   - جدول `orders` عليه RLS: الزائر المجهول يشوف **0** طلبات.
> - ✅ `npm run db:check` نجح.
> - ✅ **Security Advisor** حق Supabase طلع بدون أي تحذير (0).
> - ✅ الاختبارات:
>   - **412/412** اختبار وحدة.
>   - **30/30** E2E (desktop + mobile) على Supabase الحقيقي، منها:
>     - حسابين، وكل واحد يشوف طلباته بس.
>     - الإيميل المكرر يرجع 409.
>     - التوكن المزوّر يرجع 401 / 307.

الرمز: ✅ تم وتأكدت منه

> المحاضر سمح بـ Netlify بدل Replit.
> المفاتيح في **Environment Variables** في Netlify وVercel، وفي **`.env.local`** على الجهاز. وأبدًا ما تنكتب في الكود.

## المطلوب الأساسي (من ورقة الواجب)

| # | المطلوب | الملفات / المسارات | الحالة والدليل |
|---|---|---|---|
| 1 | مشروع Supabase + حفظ مفاتيح الربط | مشروع `shadow-gate` · المتغيرات: `SUPABASE_URL` و`SUPABASE_ANON_KEY` (publishable) و`SUPABASE_SERVICE_ROLE_KEY` (secret، للسيرفر بس) | ✅ المفاتيح في `.env.local` (موجود في `.gitignore` تحت `.env*`)، وفي متغيرات Netlify وVercel. وفي `.env.example` أسماء المتغيرات بس. |
| 2 | المفاتيح في مكان آمن، مو في الكود | `lib/supabase.ts` (`server-only`) ← `lib/supabaseRest.ts` يقرأ `process.env` على السيرفر فقط | ✅ ما فيه أي `NEXT_PUBLIC_` للمفتاح السري. و`/api/health` يرجع نعم/لا بس، بدون قيم. |
| 3 | جدول `products` وفيه منتجات تجريبية | [`supabase/migrations/20261111000000_shadow_gate.sql`](supabase/migrations/20261111000000_shadow_gate.sql) (الجدول + RLS + GRANT) · [`supabase/seed.sql`](supabase/seed.sql) (12 خدمة بالعربي والإنجليزي) · [`supabase/setup.sql`](supabase/setup.sql) (لصقة وحدة في SQL Editor) | ✅ 12 صف في Supabase. و`npm run seed` يعيد المزامنة حسب الـ slug بدون تكرار. |
| 4 | المتجر يعرض المنتجات من Supabase، مو من الكود | [`lib/catalog.ts`](lib/catalog.ts) يسوي `GET {SUPABASE_URL}/rest/v1/products` مع كل تحميل صفحة · `app/page.tsx` · `app/products/*` · `app/api/products` | ✅ ما فيه أي منتج مكتوب في كود التطبيق. ونسخة التعبئة في `src/test/fixtures/` للاختبارات وتوليد `seed.sql` بس. وأي تعديل في جدول Supabase يظهر بعد التحديث. |
| 5 | تسجيل حساب جديد عن طريق Supabase Auth | [`app/api/auth/signup/route.ts`](app/api/auth/signup/route.ts) ← `POST /auth/v1/admin/users` · `components/shop/views/SignupView.tsx` · `lib/validators.ts` | ✅ الحسابات تظهر في Supabase ← **Authentication → Users**. الإيميل المكرر يرجع 409، والتحقق 400. |
| 6 | تسجيل الدخول عن طريق Supabase Auth | [`app/api/auth/login/route.ts`](app/api/auth/login/route.ts) ← `POST /auth/v1/token?grant_type=password` · `lib/session.ts` · `lib/auth.ts` | ✅ Supabase يتحقق من كلمة السر، وبعدها السيرفر يصدر كوكي `sg_session` (HttpOnly · Secure · SameSite=Lax) فيه رقم مستخدم Supabase. |
| 7 | النشر | Netlify (`netlify.toml`) + Vercel (من GitHub) | ✅ الرابطين فوق |

## التحدي الإضافي (Bonus)

| # | المطلوب | الملفات / المسارات | الحالة والدليل |
|---|---|---|---|
| 8 | جدول خاص بالمستخدم (`orders`)، وكل مستخدم يشوف بياناته بس | جدول `orders` (`user_id` ← `auth.users`) · سياسة RLS: `auth.uid() = user_id` · `lib/orders.ts` (كل استعلام فيه فلتر رقم المستخدم من التوكن) | ✅ حسابين: كل واحد يشوف طلبه بس، وطلب الثاني يرجع **404** (`e2e/day4.spec.ts`). والزائر المجهول بالمفتاح العام يشوف 0 (`npm run db:check`). |
| 9 | اسم المستخدم في الشريط العلوي | `src/components/layout/AccountControl.tsx` · `app/api/auth/me/route.ts` (يقرأ مستخدم Supabase) | ✅ يطلع الاسم المسجّل في Supabase (`user_metadata.name`). |
| 10 | صفحة «طلباتي» محمية | `app/orders/page.tsx` · `app/orders/[id]/page.tsx` (307 ← `/login`) · `app/api/orders` (401) | ✅ |

## الأمان
- **RLS على الجدولين:**
  - `products`: قراءة للجميع، وما فيه أي كتابة من المتصفح.
  - `orders`: كل مستخدم يقرأ طلباته بس. والإضافة لصاحب الطلب فقط وبحالة `pending`.
  - الطلب «المدفوع» يكتبه السيرفر بس بعد ما يتأكد Stripe من الدفع.
- **GRANT صريح** لكل دور (anon / authenticated / service_role).
- **حد للمحاولات:** تسجيل الدخول 10 محاولات لكل إيميل كل 5 دقائق، والتسجيل 40 حساب لكل IP كل 10 دقائق. والرد 429 مع رسالة واضحة بالعربي والإنجليزي.
- **المفتاح السري ما يوصل للمتصفح:** `lib/supabase.ts` فيه `import 'server-only'`، فأي استيراد له من كود الواجهة يفشّل البناء.

## ملاحظات للمصحّح
- **ليش السيرفر يكلم Supabase بدل المتصفح؟**
  - المتصفح يكلم `/api/...` بس، والسيرفر (Next.js) يكلم Supabase بالـ REST API الرسمي (نفس اللي تستخدمه مكتبة supabase-js).
  - كذا المفتاح السري يبقى مخفي، وكوكي الدخول HttpOnly.
- **الأسعار حسب النطاق:** تنحفظ `price = 0` مع `pricing_kind = 'quote'`، والواجهة تعرض **«اطلب عرض سعر»**.
- **صورة الجدول للتسليم:** Supabase ← Table Editor ← `products`.

## الاختبارات
- اختبارات الوحدات: **412/412** ✅ (`npm test`)
- E2E: **30/30** ✅ (`npm run test:e2e`، desktop + mobile، على Supabase الحقيقي)
- مراجعة مستقلة بالوكلاء (أمان + توافق مع Supabase API + أي شي انكسر): 16 ملاحظة، وكل اللي تأكدنا إنها حقيقية انصلحت:
  - تحويل حد المحاولات إلى 429.
  - GRANT صريح.
  - الحساب المحظور.
  - FK ← 401.
  - تنظيف بقايا MongoDB.
