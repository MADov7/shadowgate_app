// SEED DATA ONLY — the original Shadow Gate service catalog (English + Arabic), used by scripts/seed.ts to
// create/update the Product documents in MongoDB Atlas. The running storefront never imports this file: products
// are loaded from the database (lib/catalog.ts). Also used by unit tests and the dev-only ad renderer.
// Copy rules: no guarantees, no invented statistics; durations are estimates; personal sessions are guided and
// never involve remote access to, or scanning of, the person's devices.
import type { Service } from '../../src/data/types';

const PER_SESSION = { en: 'per session', ar: 'للجلسة' };
const PER_REVIEW = { en: 'per review', ar: 'للمراجعة' };

export const SEED_SERVICES: readonly Service[] = [
  // ---------------- BUSINESS ----------------
  {
    id: 'website-assessment',
    featured: true,
    audience: 'business',
    category: 'assessment',
    icon: 'Globe',
    primaryAction: 'add',
    layer: 'website',
    name: { en: 'Website Security Assessment', ar: 'تقييم أمن الموقع الإلكتروني' },
    benefit: {
      en: 'Find and prioritize the weaknesses on your company website.',
      ar: 'اكتشف نقاط الضعف في موقع شركتك الإلكتروني ورتّبها حسب الأولوية.',
    },
    audienceText: {
      en: 'Small businesses with a public company website or customer portal.',
      ar: 'الشركات الصغيرة التي تملك موقعًا إلكترونيًا عامًا أو بوابة لعملائها.',
    },
    summary: {
      en: 'A structured review of your website’s configuration and common web weaknesses, planned to avoid disrupting your visitors. Findings are ranked by priority and written so non-specialists can act on them.',
      ar: 'مراجعة منهجية لإعدادات موقعك ونقاط الضعف الشائعة في مواقع الويب، مخطَّط لها بحيث لا تعطّل تجربة زوّارك. تُرتَّب النتائج حسب الأولوية وتُكتب بلغة واضحة يستطيع غير المتخصصين العمل بها.',
    },
    scope: {
      en: [
        'HTTPS and certificate configuration, including redirects and mixed content',
        'Security headers and cookie settings',
        'Login, contact and other forms checked for common weaknesses',
        'Outdated software, plugins and themes visible from the outside',
        'Publicly exposed files, admin pages and information leaks',
        'Non-intrusive checks limited to the domains you own and list in the agreed scope',
      ],
      ar: [
        'إعدادات HTTPS والشهادة الرقمية، بما في ذلك إعادة التوجيه والمحتوى المختلط',
        'ترويسات الأمان (Security Headers) وإعدادات ملفات تعريف الارتباط',
        'فحص نماذج تسجيل الدخول والتواصل وغيرها بحثًا عن نقاط الضعف الشائعة',
        'البرمجيات والإضافات والقوالب القديمة الظاهرة من الخارج',
        'الملفات وصفحات الإدارة المكشوفة للعامة وأي تسريب للمعلومات',
        'فحوصات غير تدخّلية تقتصر على النطاقات التي تملكها وتحددها في النطاق المتفق عليه',
      ],
    },
    exclusions: {
      en: [
        'Fixes or code changes — we recommend, and your team or developer applies them, unless agreed separately',
        'In-depth exploitation or attack simulation (see Authorized Penetration Testing)',
        'Testing of systems outside the agreed scope or systems you do not own',
        'A guarantee that every weakness will be found',
      ],
      ar: [
        'تنفيذ الإصلاحات أو تعديل الشيفرة البرمجية — نقدّم التوصيات ويتولى فريقك أو مطوّرك تطبيقها، ما لم يُتفق على غير ذلك',
        'الاستغلال المتعمّق للثغرات أو محاكاة الهجمات (راجع خدمة اختبار الاختراق المصرّح به)',
        'اختبار أنظمة خارج النطاق المتفق عليه أو أنظمة لا تملكها',
        'ضمان اكتشاف جميع نقاط الضعف',
      ],
    },
    deliverables: {
      en: [
        'A findings report with prioritized recommendations',
        'A plain-language summary for owners and managers',
        'A short walkthrough call to answer questions about the findings',
      ],
      ar: [
        'تقرير بالنتائج مع توصيات مرتبة حسب الأولوية',
        'ملخص بلغة مبسطة لأصحاب الأعمال والمديرين',
        'مكالمة قصيرة لشرح النتائج والإجابة عن أسئلتك',
      ],
    },
    duration: { en: 'Estimated 3–5 business days', ar: 'تقديريًا من 3 إلى 5 أيام عمل' },
    pricing: { kind: 'quote' },
    keywords: {
      en: ['website', 'web security', 'vulnerability', 'scan', 'audit', 'SSL', 'HTTPS', 'security headers', 'WordPress', 'OWASP'],
      ar: ['موقع', 'الموقع الإلكتروني', 'أمن الويب', 'ثغرات', 'فحص', 'تدقيق', 'شهادة SSL', 'ترويسات الأمان', 'ووردبريس', 'تقييم أمني'],
    },
  },
  {
    id: 'pen-testing',
    audience: 'business',
    category: 'assessment',
    icon: 'Crosshair',
    primaryAction: 'quote',
    requiresAuthorization: true,
    layer: 'website',
    name: { en: 'Authorized Penetration Testing', ar: 'اختبار الاختراق المصرّح به' },
    benefit: {
      en: 'See how far a controlled, authorized attack could get — before a real attacker tries.',
      ar: 'اعرف إلى أي مدى قد يصل هجوم مضبوط ومصرّح به، قبل أن يحاول مهاجم حقيقي ذلك.',
    },
    audienceText: {
      en: 'Businesses that own the systems in scope, or hold explicit written authorization to have them tested.',
      ar: 'الشركات التي تملك الأنظمة المشمولة بالنطاق، أو تحمل تفويضًا كتابيًا صريحًا باختبارها.',
    },
    summary: {
      en: 'A scoped test in which agreed systems are examined the way an attacker would approach them, within written rules of engagement. Testing starts only after ownership or explicit authorization is confirmed in writing, and it is quoted after a scoping call because every scope is different.',
      ar: 'اختبار محدد النطاق تُفحص فيه الأنظمة المتفق عليها بالطريقة التي قد يتبعها المهاجم، وفق قواعد عمل مكتوبة ومتفق عليها. لا يبدأ الاختبار إلا بعد تأكيد الملكية أو التفويض الصريح كتابيًا، ويُحدَّد سعره بعد مكالمة لتحديد النطاق لأن كل نطاق يختلف عن غيره.',
    },
    scope: {
      en: [
        'A scoping call to agree targets, testing windows and rules of engagement',
        'Written confirmation of ownership or explicit authorization before any testing begins',
        'Controlled testing of the agreed web applications, servers or network ranges',
        'Manual verification of findings to reduce false positives',
        'An optional retest of fixed issues, if included in the quote',
      ],
      ar: [
        'مكالمة لتحديد النطاق والاتفاق على الأنظمة المستهدفة وأوقات الاختبار وقواعد العمل',
        'تأكيد كتابي للملكية أو للتفويض الصريح قبل البدء بأي اختبار',
        'اختبار مضبوط لتطبيقات الويب أو الخوادم أو نطاقات الشبكة المتفق عليها',
        'تحقق يدوي من النتائج للحد من الإنذارات الكاذبة',
        'إعادة اختبار اختيارية للمشكلات بعد إصلاحها، إذا شملها عرض السعر',
      ],
    },
    exclusions: {
      en: [
        'Any testing without the system owner’s explicit written authorization',
        'Systems, third-party services or hosting providers outside the agreed scope',
        'Denial-of-service, destructive testing or social engineering, unless explicitly agreed',
        'Fixing the issues found, or a guarantee that no other weaknesses exist',
      ],
      ar: [
        'أي اختبار دون تفويض كتابي صريح من مالك الأنظمة',
        'الأنظمة أو خدمات الأطراف الثالثة أو مزوّدو الاستضافة خارج النطاق المتفق عليه',
        'اختبارات حجب الخدمة أو الاختبارات التخريبية أو الهندسة الاجتماعية، ما لم يُتفق عليها صراحةً',
        'إصلاح المشكلات المكتشفة، أو ضمان عدم وجود نقاط ضعف أخرى',
      ],
    },
    deliverables: {
      en: [
        'A scoped assessment report with evidence and severity ratings',
        'Remediation guidance for each finding, ordered by priority',
        'An executive summary and a debrief call with your team',
      ],
      ar: [
        'تقرير تقييم محدد النطاق يتضمن الأدلة وتصنيف درجة الخطورة',
        'إرشادات معالجة لكل نتيجة، مرتبة حسب الأولوية',
        'ملخص تنفيذي ومكالمة لمناقشة النتائج مع فريقك',
      ],
    },
    duration: { en: 'Estimated 1–3 weeks depending on scope', ar: 'تقديريًا من أسبوع إلى 3 أسابيع حسب النطاق' },
    pricing: { kind: 'quote' },
    keywords: {
      en: ['pentest', 'pen test', 'penetration test', 'ethical hacking', 'vulnerability', 'exploit', 'authorized testing', 'security testing', 'attack simulation'],
      ar: ['اختبار اختراق', 'اختبار الاختراق', 'القرصنة الأخلاقية', 'الاختراق الأخلاقي', 'ثغرات', 'استغلال الثغرات', 'اختبار مصرّح به', 'الاختبار الأمني', 'محاكاة الهجمات'],
    },
  },
  {
    id: 'email-accounts',
    featured: true,
    audience: 'business',
    category: 'accounts',
    icon: 'MailCheck',
    primaryAction: 'add',
    layer: 'accounts',
    name: { en: 'Business Email & Account Security', ar: 'أمن البريد الإلكتروني والحسابات للشركات' },
    benefit: {
      en: 'Harden the email and cloud accounts your business runs on.',
      ar: 'عزّز حماية البريد الإلكتروني والحسابات السحابية التي يعتمد عليها عملك.',
    },
    audienceText: {
      en: 'Teams using business email and cloud workspaces such as Microsoft 365 or Google Workspace.',
      ar: 'الفرق التي تستخدم البريد الإلكتروني للشركات ومساحات العمل السحابية مثل Microsoft 365 أو Google Workspace.',
    },
    summary: {
      en: 'A review of your business email and account settings, sign-in protection and who has access to what. You get clear multi-factor authentication guidance and practical steps to tighten access.',
      ar: 'مراجعة لإعدادات البريد الإلكتروني والحسابات في شركتك، ولحماية تسجيل الدخول، ولصلاحيات الوصول الممنوحة لكل مستخدم. تحصل على إرشادات واضحة حول المصادقة متعددة العوامل وخطوات عملية لإحكام صلاحيات الوصول.',
    },
    scope: {
      en: [
        'Email security settings, including SPF, DKIM and DMARC records',
        'Multi-factor authentication coverage for users and administrators',
        'Administrator roles, shared mailboxes and former employees’ accounts',
        'Password policy and account recovery options',
        'Mail forwarding rules and third-party app connections',
      ],
      ar: [
        'إعدادات أمان البريد الإلكتروني، بما في ذلك سجلات SPF وDKIM وDMARC',
        'مدى تفعيل المصادقة متعددة العوامل لدى المستخدمين والمسؤولين',
        'أدوار المسؤولين وصناديق البريد المشتركة وحسابات الموظفين السابقين',
        'سياسة كلمات المرور وخيارات استعادة الحسابات',
        'قواعد إعادة توجيه البريد واتصالات تطبيقات الأطراف الثالثة',
      ],
    },
    exclusions: {
      en: [
        'Changing settings on your behalf, unless agreed in writing',
        'Ongoing mailbox monitoring or incident response',
        'Migrating your email to another provider',
      ],
      ar: [
        'تغيير الإعدادات نيابةً عنك، ما لم يُتفق على ذلك كتابيًا',
        'المراقبة المستمرة لصناديق البريد أو الاستجابة للحوادث الأمنية',
        'نقل بريدك الإلكتروني إلى مزوّد خدمة آخر',
      ],
    },
    deliverables: {
      en: [
        'A configuration review showing what is set up well and what needs attention',
        'Step-by-step multi-factor authentication (MFA) guidance for your team',
        'Access recommendations: who needs administrator rights and what to remove',
      ],
      ar: [
        'مراجعة للإعدادات توضّح ما هو مضبوط جيدًا وما يحتاج إلى معالجة',
        'إرشادات خطوة بخطوة لتفعيل المصادقة متعددة العوامل (MFA) لفريقك',
        'توصيات بشأن صلاحيات الوصول: من يحتاج إلى صلاحيات المسؤول، وما ينبغي إزالته',
      ],
    },
    duration: { en: 'Estimated 2–4 business days', ar: 'تقديريًا من يومين إلى 4 أيام عمل' },
    pricing: { kind: 'quote' },
    keywords: {
      en: ['email', 'MFA', '2FA', 'two-factor', 'Microsoft 365', 'Google Workspace', 'Outlook', 'Gmail', 'DMARC', 'account takeover', 'password'],
      ar: ['البريد الإلكتروني', 'المصادقة متعددة العوامل', 'المصادقة الثنائية', 'التحقق بخطوتين', 'مايكروسوفت 365', 'جوجل ورك سبيس', 'أوتلوك', 'جيميل', 'انتحال البريد', 'اختراق الحساب', 'كلمة المرور'],
    },
  },
  {
    id: 'awareness',
    audience: 'business',
    category: 'training',
    icon: 'Users',
    primaryAction: 'add',
    layer: 'email',
    name: { en: 'Employee Security Awareness', ar: 'التوعية الأمنية للموظفين' },
    benefit: {
      en: 'Help your team spot phishing and handle data safely.',
      ar: 'ساعد فريقك على كشف رسائل التصيّد الاحتيالي والتعامل مع البيانات بأمان.',
    },
    audienceText: {
      en: 'Staff at small and growing businesses — no technical background needed.',
      ar: 'موظفو الشركات الصغيرة والنامية، دون الحاجة إلى خلفية تقنية.',
    },
    summary: {
      en: 'A practical, interactive session that uses realistic examples to show how phishing, suspicious links and careless data handling lead to incidents — and the simple habits that help prevent them.',
      ar: 'جلسة عملية وتفاعلية تستعين بأمثلة واقعية لتوضيح كيف يقود التصيّد الاحتيالي والروابط المشبوهة والتعامل غير الحذر مع البيانات إلى حوادث أمنية، وما العادات البسيطة التي تساعد على تجنّبها.',
    },
    scope: {
      en: [
        'Recognizing phishing emails, messages and fake login pages',
        'Checking suspicious links and attachments before opening them',
        'Handling customer and company data safely',
        'Passwords, password managers and multi-factor authentication in practice',
        'What to do, and whom to tell, when something looks wrong',
        'Interactive examples and a short quiz tailored to your sector',
      ],
      ar: [
        'التعرّف على رسائل التصيّد الاحتيالي في البريد والمراسلات وصفحات تسجيل الدخول المزيفة',
        'التحقق من الروابط والمرفقات المشبوهة قبل فتحها',
        'التعامل الآمن مع بيانات العملاء والشركة',
        'كلمات المرور وبرامج إدارتها والمصادقة متعددة العوامل في التطبيق العملي',
        'ما الذي يجب فعله، ولمن يُبلَّغ، عند ملاحظة أمر مريب',
        'أمثلة تفاعلية واختبار قصير مُكيَّف مع مجال عملك',
      ],
    },
    exclusions: {
      en: [
        'Live phishing simulations sent to staff, unless agreed in advance',
        'Formal certification or accredited training credits',
        'A guarantee that no one will ever be deceived — awareness reduces risk, it does not remove it',
      ],
      ar: [
        'إرسال رسائل تصيّد تجريبية فعلية إلى الموظفين، ما لم يُتفق على ذلك مسبقًا',
        'شهادات رسمية أو ساعات تدريب معتمدة',
        'ضمان ألا يقع أي شخص ضحية للخداع، فالتوعية تقلل المخاطر ولا تلغيها',
      ],
    },
    deliverables: {
      en: [
        'A practical session on phishing, suspicious links and data handling',
        'A one-page quick-reference guide for staff',
        'Session slides to share internally',
      ],
      ar: [
        'جلسة عملية حول التصيّد الاحتيالي والروابط المشبوهة والتعامل مع البيانات',
        'دليل مرجعي سريع من صفحة واحدة للموظفين',
        'شرائح الجلسة لمشاركتها داخليًا',
      ],
    },
    duration: { en: 'Estimated 90-minute session', ar: 'جلسة مدتها 90 دقيقة تقديريًا' },
    pricing: { kind: 'quote' },
    keywords: {
      en: ['training', 'phishing', 'awareness', 'staff', 'employees', 'workshop', 'social engineering', 'suspicious links', 'scam', 'email safety'],
      ar: ['تدريب', 'التصيّد الاحتيالي', 'التوعية', 'الموظفين', 'فريق العمل', 'ورشة عمل', 'الهندسة الاجتماعية', 'الروابط المشبوهة', 'الاحتيال', 'أمان البريد'],
    },
  },
  {
    id: 'ecommerce-review',
    audience: 'business',
    category: 'assessment',
    icon: 'ShoppingCart',
    primaryAction: 'add',
    layer: 'website',
    name: { en: 'E-commerce Security Review', ar: 'مراجعة أمن المتجر الإلكتروني' },
    benefit: {
      en: 'Reduce risk across your store, its admins and your customers’ data.',
      ar: 'قلّل المخاطر المحيطة بمتجرك وحسابات مسؤوليه وبيانات عملائك.',
    },
    audienceText: {
      en: 'Online stores on hosted or self-managed platforms such as Shopify or WooCommerce.',
      ar: 'المتاجر الإلكترونية على المنصات المستضافة أو المُدارة ذاتيًا مثل Shopify أو WooCommerce.',
    },
    summary: {
      en: 'A focused review of your store settings, installed extensions and administrator access, so weak spots around checkout, accounts and customer data are found and prioritized.',
      ar: 'مراجعة مركّزة لإعدادات متجرك والإضافات المثبّتة وصلاحيات المسؤولين، بهدف تحديد نقاط الضعف المتعلقة بإتمام الشراء والحسابات وبيانات العملاء وترتيبها حسب الأولوية.',
    },
    scope: {
      en: [
        'Store and platform security settings',
        'Installed apps, plugins and themes: whether they are needed, updated and limited in permissions',
        'Administrator and staff accounts, roles and multi-factor authentication',
        'Checkout and payment configuration as shown in the platform settings',
        'Customer data handling, exports and notification emails',
      ],
      ar: [
        'إعدادات الأمان في المتجر والمنصة',
        'التطبيقات والإضافات والقوالب المثبّتة: مدى الحاجة إليها، وتحديثها، وتقييد صلاحياتها',
        'حسابات المسؤولين والموظفين وأدوارهم والمصادقة متعددة العوامل',
        'إعدادات إتمام الشراء والدفع كما تظهر في إعدادات المنصة',
        'طريقة التعامل مع بيانات العملاء وتصديرها ورسائل الإشعارات',
      ],
    },
    exclusions: {
      en: [
        'PCI DSS certification or a compliance sign-off',
        'Reviewing the payment provider’s own systems',
        'Installing, removing or updating extensions on your behalf, unless agreed',
        'A guarantee that every issue will be found',
      ],
      ar: [
        'الحصول على شهادة PCI DSS أو اعتماد الامتثال',
        'مراجعة أنظمة مزوّد خدمة الدفع نفسه',
        'تثبيت الإضافات أو إزالتها أو تحديثها نيابةً عنك، ما لم يُتفق على ذلك',
        'ضمان اكتشاف جميع المشكلات',
      ],
    },
    deliverables: {
      en: [
        'A review of store settings, extensions and administrator access',
        'A prioritized list of recommended changes',
        'A short checklist for adding staff and new extensions safely',
      ],
      ar: [
        'مراجعة لإعدادات المتجر والإضافات وصلاحيات المسؤولين',
        'قائمة بالتغييرات الموصى بها مرتبة حسب الأولوية',
        'قائمة تحقق مختصرة لإضافة الموظفين والإضافات الجديدة بأمان',
      ],
    },
    duration: { en: 'Estimated 3–5 business days', ar: 'تقديريًا من 3 إلى 5 أيام عمل' },
    pricing: { kind: 'quote' },
    keywords: {
      en: ['store', 'online store', 'e-commerce', 'shop', 'Shopify', 'WooCommerce', 'Magento', 'Salla', 'Zid', 'checkout', 'payments', 'plugins'],
      ar: ['متجر', 'متجر إلكتروني', 'التجارة الإلكترونية', 'متجر أونلاين', 'شوبيفاي', 'ووكومرس', 'ماجنتو', 'سلة', 'زد', 'إتمام الشراء', 'الدفع', 'الإضافات'],
    },
  },
  {
    id: 'backup-recovery',
    audience: 'business',
    category: 'resilience',
    icon: 'DatabaseBackup',
    primaryAction: 'add',
    layer: 'cloud',
    name: { en: 'Backup & Recovery Readiness', ar: 'جاهزية النسخ الاحتياطي والاستعادة' },
    benefit: {
      en: 'Find out whether you could really recover when something goes wrong.',
      ar: 'تأكّد مما إذا كنت قادرًا فعلًا على استعادة بياناتك عند حدوث أي طارئ.',
    },
    audienceText: {
      en: 'Businesses that rely on shared files, cloud storage or business applications.',
      ar: 'الشركات التي تعتمد على الملفات المشتركة أو التخزين السحابي أو تطبيقات الأعمال.',
    },
    summary: {
      en: 'A review of how your important data is backed up, where copies are kept and how recovery would actually work after a mistake, a device failure or ransomware. You get practical recommendations to close the gaps.',
      ar: 'مراجعة لطريقة النسخ الاحتياطي لبياناتك المهمة، وأماكن حفظ النسخ، وكيف ستجري الاستعادة فعليًا بعد خطأ بشري أو عطل في جهاز أو هجوم ببرامج الفدية. تحصل على توصيات عملية لسدّ الثغرات.',
    },
    scope: {
      en: [
        'Inventory of critical data and where it is stored',
        'Current backup methods, frequency and retention',
        'Offline or separated copies that ransomware cannot easily reach',
        'Who can access, delete or restore backups',
        'A guided walkthrough of how a restore would work, with an optional test restore that you perform',
      ],
      ar: [
        'حصر البيانات الحيوية وتحديد أماكن تخزينها',
        'أساليب النسخ الاحتياطي الحالية ودوريتها ومدة الاحتفاظ بالنسخ',
        'النسخ غير المتصلة أو المعزولة التي يصعب على برامج الفدية الوصول إليها',
        'من يملك صلاحية الوصول إلى النسخ الاحتياطية أو حذفها أو استعادتها',
        'استعراض موجَّه لخطوات الاستعادة، مع استعادة تجريبية اختيارية تُجريها بنفسك',
      ],
    },
    exclusions: {
      en: [
        'Buying, setting up or operating backup software for you',
        'Recovering data that has already been lost',
        'A guarantee that every recovery will succeed',
      ],
      ar: [
        'شراء برامج النسخ الاحتياطي أو إعدادها أو تشغيلها نيابةً عنك',
        'استعادة بيانات فُقدت بالفعل',
        'ضمان نجاح كل عملية استعادة',
      ],
    },
    deliverables: {
      en: [
        'A review of your current backup arrangements',
        'Recovery recommendations ranked by priority',
        'A simple recovery checklist your team can follow',
      ],
      ar: [
        'مراجعة لترتيبات النسخ الاحتياطي الحالية لديك',
        'توصيات للاستعادة مرتبة حسب الأولوية',
        'قائمة تحقق مبسطة للاستعادة يستطيع فريقك اتباعها',
      ],
    },
    duration: { en: 'Estimated 2–3 business days', ar: 'تقديريًا من يومين إلى 3 أيام عمل' },
    pricing: { kind: 'quote' },
    keywords: {
      en: ['backup', 'backups', 'restore', 'recovery', 'disaster recovery', 'ransomware', 'business continuity', 'cloud storage', 'data loss', '3-2-1 rule'],
      ar: ['النسخ الاحتياطي', 'نسخة احتياطية', 'الاستعادة', 'استرجاع البيانات', 'التعافي من الكوارث', 'برامج الفدية', 'استمرارية الأعمال', 'التخزين السحابي', 'فقدان البيانات', 'قاعدة 3-2-1'],
    },
  },
  {
    id: 'consultation',
    featured: true,
    audience: 'business',
    category: 'advisory',
    icon: 'MessagesSquare',
    primaryAction: 'add',
    name: { en: 'Cybersecurity Consultation', ar: 'استشارة الأمن السيبراني' },
    benefit: {
      en: 'Get a clear, prioritized starting point for your security.',
      ar: 'احصل على نقطة انطلاق واضحة ومرتبة حسب الأولوية لأمنك السيبراني.',
    },
    audienceText: {
      en: 'Business owners and managers who are not sure where to start.',
      ar: 'أصحاب الأعمال والمديرون الذين لا يعرفون من أين يبدؤون.',
    },
    summary: {
      en: 'An introductory session that turns your questions and concerns into a short, prioritized action plan — a sensible first step before choosing any other service.',
      ar: 'جلسة تعريفية تحوّل أسئلتك ومخاوفك إلى خطة عمل قصيرة مرتبة حسب الأولوية، وهي خطوة أولى مناسبة قبل اختيار أي خدمة أخرى.',
    },
    scope: {
      en: [
        'A conversation about your business, systems and main concerns',
        'A high-level look at your accounts, devices, website and data',
        'Identifying your most likely risks in plain language',
        'Agreeing on quick wins and longer-term priorities',
        'Guidance on which services, if any, would help next',
      ],
      ar: [
        'حوار حول طبيعة عملك وأنظمتك ومخاوفك الرئيسية',
        'نظرة عامة على حساباتك وأجهزتك وموقعك الإلكتروني وبياناتك',
        'تحديد المخاطر الأكثر احتمالًا لديك بلغة مبسطة',
        'الاتفاق على إجراءات سريعة الأثر وأولويات على المدى الأطول',
        'إرشادك إلى الخدمات التي قد تفيدك لاحقًا، إن كانت هناك حاجة إليها',
      ],
    },
    exclusions: {
      en: [
        'Hands-on technical testing or configuration changes',
        'Legal or regulatory compliance advice',
        'A detailed audit of every system',
      ],
      ar: [
        'الاختبارات التقنية العملية أو تعديل الإعدادات',
        'الاستشارات القانونية أو التنظيمية المتعلقة بالامتثال',
        'تدقيق تفصيلي لجميع الأنظمة',
      ],
    },
    deliverables: {
      en: ['An introductory session, online or in person', 'A prioritized action plan in writing'],
      ar: ['جلسة تعريفية عن بُعد أو حضوريًا', 'خطة عمل مكتوبة مرتبة حسب الأولوية'],
    },
    duration: { en: 'Estimated 60-minute session + written plan', ar: 'جلسة مدتها 60 دقيقة تقديريًا، تليها خطة مكتوبة' },
    pricing: { kind: 'illustrative', amount: 49, currency: 'USD', per: PER_SESSION },
    keywords: {
      en: ['consultation', 'consulting', 'advice', 'advisor', 'where to start', 'getting started', 'action plan', 'security plan', 'roadmap', 'strategy'],
      ar: ['استشارة', 'استشارات', 'نصيحة', 'مستشار', 'من أين أبدأ', 'البداية', 'خطة عمل', 'خطة أمنية', 'خارطة طريق', 'استراتيجية'],
    },
  },
  {
    id: 'monthly-review',
    audience: 'business',
    category: 'advisory',
    icon: 'CalendarSync',
    primaryAction: 'add',
    layer: 'ongoing',
    name: { en: 'Monthly Security Review', ar: 'المراجعة الأمنية الشهرية' },
    benefit: {
      en: 'Keep improving with a steady, scheduled review rhythm.',
      ar: 'واصل التحسّن عبر إيقاع ثابت من المراجعات المجدولة.',
    },
    audienceText: {
      en: 'Businesses that want ongoing, scheduled attention without a full-time security team.',
      ar: 'الشركات التي ترغب في متابعة مستمرة ومجدولة دون الحاجة إلى فريق أمني متفرغ.',
    },
    summary: {
      en: 'A scheduled monthly review of your key settings, accounts and open recommendations, with a concise report each cycle. It is not a staffed 24/7 monitoring service.',
      ar: 'مراجعة شهرية مجدولة لإعداداتك وحساباتك الرئيسية وللتوصيات التي لم تُنفَّذ بعد، مع تقرير موجز في كل دورة. وهي ليست خدمة مراقبة على مدار الساعة يتولاها فريق مناوب.',
    },
    scope: {
      en: [
        'A scheduled monthly review session',
        'A check of key account, email and website settings for changes',
        'Review of new users, administrator rights and departed staff',
        'Tracking progress on earlier recommendations',
        'A short briefing on relevant new threats and updates',
      ],
      ar: [
        'جلسة مراجعة شهرية مجدولة',
        'فحص الإعدادات الرئيسية للحسابات والبريد الإلكتروني والموقع لرصد أي تغييرات',
        'مراجعة المستخدمين الجدد وصلاحيات المسؤولين وحسابات الموظفين المغادرين',
        'متابعة التقدّم في تنفيذ التوصيات السابقة',
        'إحاطة مختصرة بالتهديدات والتحديثات الجديدة ذات الصلة',
      ],
    },
    exclusions: {
      en: [
        'Not a staffed 24/7 monitoring service — alerts are not watched around the clock',
        'Emergency incident response or on-call support',
        'Implementing fixes, unless agreed separately',
      ],
      ar: [
        'ليست خدمة مراقبة على مدار الساعة طوال أيام الأسبوع (24/7) يتولاها فريق مناوب، ولا تُتابَع التنبيهات بشكل متواصل',
        'الاستجابة الطارئة للحوادث الأمنية أو الدعم المناوب',
        'تنفيذ الإصلاحات، ما لم يُتفق على ذلك بشكل منفصل',
      ],
    },
    deliverables: {
      en: [
        'Scheduled reviews on an agreed monthly date',
        'A concise report after each review',
        'Follow-up on open recommendations until they are resolved or consciously accepted',
      ],
      ar: [
        'مراجعات مجدولة في موعد شهري متفق عليه',
        'تقرير موجز بعد كل مراجعة',
        'متابعة التوصيات المفتوحة حتى تُعالَج أو يُتخذ قرار واعٍ بقبول مخاطرها',
      ],
    },
    duration: { en: 'Estimated 2–3 hours each month (ongoing)', ar: 'تقديريًا من ساعتين إلى 3 ساعات شهريًا (مستمرة)' },
    pricing: { kind: 'quote' },
    keywords: {
      en: ['monthly', 'ongoing', 'recurring', 'retainer', 'subscription', 'regular review', 'check-up', 'follow-up', 'reports', 'monitoring'],
      ar: ['شهري', 'مستمر', 'دوري', 'اشتراك', 'عقد شهري', 'مراجعة دورية', 'فحص دوري', 'متابعة', 'التقارير', 'المراقبة'],
    },
  },

  // ---------------- PERSONAL ----------------
  {
    id: 'personal-accounts',
    featured: true,
    audience: 'personal',
    category: 'accounts',
    icon: 'KeyRound',
    primaryAction: 'book',
    name: { en: 'Personal Account Protection', ar: 'حماية الحسابات الشخصية' },
    benefit: {
      en: 'Strengthen sign-in protection on your email, social and banking accounts.',
      ar: 'عزّز حماية الدخول إلى بريدك الإلكتروني وحساباتك الاجتماعية والمصرفية.',
    },
    audienceText: {
      en: 'Individuals and families who want their important accounts better protected.',
      ar: 'الأفراد والعائلات الراغبون في حماية أفضل لحساباتهم المهمة.',
    },
    summary: {
      en: 'A friendly, guided session in which you set up stronger sign-in protection on your key accounts yourself, with step-by-step help. We never ask for your passwords.',
      ar: 'جلسة ودّية وموجَّهة تُفعّل خلالها بنفسك حماية أقوى لتسجيل الدخول إلى حساباتك الرئيسية، مع مساعدة خطوة بخطوة. ولن نطلب منك كلمات المرور أبدًا.',
    },
    scope: {
      en: [
        'Choosing which accounts matter most: email, banking, social media and shopping',
        'Turning on multi-factor authentication (2FA) step by step',
        'Setting up a password manager and replacing reused passwords',
        'Updating recovery email, phone number and backup codes',
        'Checking recent sign-in activity and connected devices',
      ],
      ar: [
        'تحديد الحسابات الأهم: البريد الإلكتروني والحساب المصرفي ووسائل التواصل الاجتماعي والتسوّق',
        'تفعيل المصادقة متعددة العوامل (المصادقة الثنائية) خطوة بخطوة',
        'إعداد برنامج لإدارة كلمات المرور واستبدال كلمات المرور المكررة',
        'تحديث بريد الاستعادة ورقم الهاتف ورموز الاسترداد الاحتياطية',
        'مراجعة نشاط تسجيل الدخول الأخير والأجهزة المرتبطة',
      ],
    },
    exclusions: {
      en: [
        'Asking for, seeing or storing your passwords',
        'Remote access to, or remote scanning of, your devices',
        'Recovering accounts that are already compromised (we can point you to the provider’s official recovery steps)',
      ],
      ar: [
        'طلب كلمات المرور الخاصة بك أو الاطلاع عليها أو حفظها',
        'الوصول إلى أجهزتك أو فحصها عن بُعد',
        'استعادة الحسابات المخترقة بالفعل (يمكننا إرشادك إلى خطوات الاستعادة الرسمية لدى مزوّد الخدمة)',
      ],
    },
    deliverables: {
      en: [
        'Stronger sign-in settings on your key accounts, set up by you during the session',
        'A personal checklist of the accounts reviewed and what was changed',
        'Practical tips for keeping your accounts safer from now on',
      ],
      ar: [
        'إعدادات تسجيل دخول أقوى لحساباتك الرئيسية، تُفعّلها بنفسك خلال الجلسة',
        'قائمة تحقق شخصية بالحسابات التي رُوجعت والتغييرات التي أُجريت',
        'نصائح عملية تساعدك على الحفاظ على أمان حساباتك من الآن فصاعدًا',
      ],
    },
    duration: { en: 'Estimated 60-minute session', ar: 'جلسة مدتها 60 دقيقة تقديريًا' },
    pricing: { kind: 'illustrative', amount: 39, currency: 'USD', per: PER_SESSION },
    keywords: {
      en: ['account', 'password', 'password manager', 'account security', 'MFA', '2FA', 'two-factor', 'hacked account', 'Instagram', 'WhatsApp', 'banking', 'login'],
      ar: ['حساب', 'كلمة المرور', 'مدير كلمات المرور', 'أمان الحسابات', 'المصادقة متعددة العوامل', 'المصادقة الثنائية', 'التحقق بخطوتين', 'حساب مخترق', 'إنستغرام', 'واتساب', 'الحساب المصرفي', 'تسجيل الدخول'],
    },
  },
  {
    id: 'device-review',
    audience: 'personal',
    category: 'devices',
    icon: 'Smartphone',
    primaryAction: 'book',
    name: { en: 'Device Security Settings Review', ar: 'مراجعة إعدادات أمان الأجهزة' },
    benefit: {
      en: 'Tighten the security settings on your phone, tablet and laptop.',
      ar: 'اضبط إعدادات الأمان في هاتفك وجهازك اللوحي وحاسوبك المحمول.',
    },
    audienceText: {
      en: 'Individuals who use a phone, tablet or laptop in everyday life.',
      ar: 'الأفراد الذين يستخدمون الهاتف أو الجهاز اللوحي أو الحاسوب المحمول في حياتهم اليومية.',
    },
    summary: {
      en: 'A guided walkthrough in which you review the security settings on your own devices with us, one step at a time. You stay in control of your device — there is no remote access or scanning.',
      ar: 'جولة إرشادية تراجع خلالها معنا إعدادات الأمان في أجهزتك خطوة بخطوة. يبقى جهازك تحت تحكّمك الكامل، دون أي وصول أو فحص عن بُعد.',
    },
    scope: {
      en: [
        'Screen lock, PIN and biometric settings',
        'System and app updates',
        'App permissions for location, camera, microphone and contacts',
        'Find-my-device, encryption and device backup settings',
        'Wi-Fi, Bluetooth and sharing settings',
      ],
      ar: [
        'إعدادات قفل الشاشة والرمز السري والبصمة أو التعرّف على الوجه',
        'تحديثات النظام والتطبيقات',
        'أذونات التطبيقات للوصول إلى الموقع والكاميرا والميكروفون وجهات الاتصال',
        'إعدادات العثور على الجهاز والتشفير والنسخ الاحتياطي للجهاز',
        'إعدادات الواي فاي والبلوتوث والمشاركة',
      ],
    },
    exclusions: {
      en: [
        'Remote access, remote scanning or installing software on your device',
        'Repairing hardware or removing malware',
        'Reviewing devices you do not own or manage',
      ],
      ar: [
        'الوصول إلى جهازك أو فحصه عن بُعد، أو تثبيت أي برامج عليه',
        'إصلاح العتاد أو إزالة البرمجيات الخبيثة',
        'مراجعة أجهزة لا تملكها أو لا تتولى إدارتها',
      ],
    },
    deliverables: {
      en: [
        'A guided review of your device settings, with any changes made by you',
        'A personal checklist for each device reviewed',
        'Simple habits to keep your devices up to date',
      ],
      ar: [
        'مراجعة موجَّهة لإعدادات أجهزتك، وأي تغييرات تُجريها بنفسك',
        'قائمة تحقق شخصية لكل جهاز تمت مراجعته',
        'عادات بسيطة تساعدك على إبقاء أجهزتك محدَّثة',
      ],
    },
    duration: { en: 'Estimated 45–60 minutes', ar: 'تقديريًا من 45 إلى 60 دقيقة' },
    pricing: { kind: 'illustrative', amount: 35, currency: 'USD', per: PER_REVIEW },
    keywords: {
      en: ['phone', 'mobile', 'smartphone', 'iPhone', 'Android', 'laptop', 'computer', 'tablet', 'settings', 'updates', 'app permissions'],
      ar: ['هاتف', 'جوال', 'هاتف ذكي', 'آيفون', 'أندرويد', 'حاسوب محمول', 'لابتوب', 'جهاز لوحي', 'الإعدادات', 'التحديثات', 'أذونات التطبيقات'],
    },
  },
  {
    id: 'privacy-review',
    audience: 'personal',
    category: 'privacy',
    icon: 'EyeOff',
    primaryAction: 'book',
    name: { en: 'Digital Privacy Review', ar: 'مراجعة الخصوصية الرقمية' },
    benefit: {
      en: 'Reduce what strangers can learn about you online.',
      ar: 'قلّل ما يمكن للغرباء معرفته عنك عبر الإنترنت.',
    },
    audienceText: {
      en: 'Individuals who want more control over their personal information.',
      ar: 'الأفراد الراغبون في تحكّم أكبر بمعلوماتهم الشخصية.',
    },
    summary: {
      en: 'A guided review of your privacy settings and public footprint: together we look at what is visible about you online, and you choose what to hide, limit or remove.',
      ar: 'مراجعة موجَّهة لإعدادات خصوصيتك وبصمتك الرقمية العامة: نستعرض معًا ما يظهر عنك على الإنترنت، وتختار أنت ما تريد إخفاءه أو تقييده أو حذفه.',
    },
    scope: {
      en: [
        'Privacy settings on your social media accounts',
        'A search for publicly visible personal details, using only your own name and accounts',
        'Location sharing, photo metadata and tagging',
        'Ad tracking, app data sharing and browser privacy options',
        'Old or unused accounts worth closing',
      ],
      ar: [
        'إعدادات الخصوصية في حساباتك على وسائل التواصل الاجتماعي',
        'بحث عن تفاصيلك الشخصية المتاحة للعامة، باستخدام اسمك وحساباتك أنت فقط',
        'مشاركة الموقع والبيانات الوصفية للصور والإشارة إليك في المنشورات',
        'تتبّع الإعلانات ومشاركة بيانات التطبيقات وخيارات الخصوصية في المتصفح',
        'الحسابات القديمة أو غير المستخدمة التي يُستحسن إغلاقها',
      ],
    },
    exclusions: {
      en: [
        'Investigating or tracking other people',
        'Removing information held by third-party websites (we show you how to request it)',
        'Remote scanning of your devices or accounts',
        'Legal advice on privacy or data protection law',
      ],
      ar: [
        'التحرّي عن أشخاص آخرين أو تتبّعهم',
        'حذف المعلومات المنشورة على مواقع أطراف ثالثة (نوضّح لك كيف تطلب حذفها)',
        'فحص أجهزتك أو حساباتك عن بُعد',
        'الاستشارات القانونية المتعلقة بقوانين الخصوصية وحماية البيانات',
      ],
    },
    deliverables: {
      en: [
        'A summary of what is visible about you online, reviewed together',
        'Updated privacy settings, changed by you during the session',
        'A short list of follow-up steps, such as removal requests you can send',
      ],
      ar: [
        'ملخص لما يظهر عنك على الإنترنت، نستعرضه معًا',
        'إعدادات خصوصية محدَّثة تعدّلها بنفسك خلال الجلسة',
        'قائمة مختصرة بخطوات المتابعة، مثل طلبات الحذف التي يمكنك إرسالها',
      ],
    },
    duration: { en: 'Estimated 60–90 minutes', ar: 'تقديريًا من 60 إلى 90 دقيقة' },
    pricing: { kind: 'illustrative', amount: 45, currency: 'USD', per: PER_REVIEW },
    keywords: {
      en: ['privacy', 'digital footprint', 'personal data', 'social media', 'tracking', 'location', 'doxxing', 'data broker', 'cookies', 'online reputation'],
      ar: ['الخصوصية', 'البصمة الرقمية', 'البيانات الشخصية', 'وسائل التواصل الاجتماعي', 'التتبّع', 'الموقع الجغرافي', 'كشف المعلومات الشخصية', 'وسطاء البيانات', 'ملفات تعريف الارتباط', 'السمعة الرقمية'],
    },
  },
  {
    id: 'scam-awareness',
    audience: 'personal',
    category: 'training',
    icon: 'ShieldAlert',
    primaryAction: 'book',
    name: { en: 'Scam & Phishing Awareness Session', ar: 'جلسة توعية بالاحتيال والتصيّد' },
    benefit: {
      en: 'Recognize scams and phishing before they cost you.',
      ar: 'تعرّف على أساليب الاحتيال والتصيّد قبل أن تكلّفك شيئًا.',
    },
    audienceText: {
      en: 'Individuals, parents and older relatives — anyone who receives messages and calls.',
      ar: 'الأفراد والآباء والأمهات والأقارب من كبار السن، وكل من يتلقى رسائل ومكالمات.',
    },
    summary: {
      en: 'A friendly, practical session on the scams and phishing tricks people meet most often — fake messages, calls and websites — and the simple checks that help you pause before you click or pay.',
      ar: 'جلسة ودّية وعملية حول أكثر أساليب الاحتيال والتصيّد الاحتيالي شيوعًا، من الرسائل والمكالمات إلى المواقع المزيفة، والخطوات البسيطة التي تساعدك على التوقف والتحقق قبل أن تضغط على رابط أو تدفع.',
    },
    scope: {
      en: [
        'Common scams by SMS, WhatsApp, email and phone call',
        'Spotting fake delivery, bank and prize messages',
        'Checking links, sender details and website addresses',
        'Why you should never share one-time verification codes',
        'What to do if you think you have been scammed',
      ],
      ar: [
        'أساليب الاحتيال الشائعة عبر الرسائل النصية وواتساب والبريد الإلكتروني والمكالمات الهاتفية',
        'كشف الرسائل المزيفة المتعلقة بالشحنات والبنوك والجوائز',
        'التحقق من الروابط وبيانات المرسل وعناوين المواقع',
        'لماذا لا ينبغي أبدًا مشاركة رموز التحقق لمرة واحدة',
        'ما الذي تفعله إذا ظننت أنك تعرّضت للاحتيال',
      ],
    },
    exclusions: {
      en: [
        'Recovering lost money or contacting banks on your behalf',
        'Investigating specific scammers or reporting to the authorities for you',
        'Remote scanning of your phone or computer',
      ],
      ar: [
        'استرداد الأموال المفقودة أو التواصل مع البنوك نيابةً عنك',
        'التحرّي عن محتالين بعينهم أو تقديم البلاغات إلى الجهات المختصة نيابةً عنك',
        'فحص هاتفك أو حاسوبك عن بُعد',
      ],
    },
    deliverables: {
      en: [
        'A friendly, practical session for you or your family',
        'A printable checklist of scam warning signs',
        'A simple “stop, check, ask” routine to use before you click or pay',
      ],
      ar: [
        'جلسة ودّية وعملية لك أو لأفراد عائلتك',
        'قائمة قابلة للطباعة بالعلامات التحذيرية للاحتيال',
        'روتين بسيط «توقّف، تحقّق، اسأل» قبل أن تضغط على رابط أو تدفع',
      ],
    },
    duration: { en: 'Estimated 45-minute session', ar: 'جلسة مدتها 45 دقيقة تقديريًا' },
    pricing: { kind: 'illustrative', amount: 29, currency: 'USD', per: PER_SESSION },
    keywords: {
      en: ['scam', 'fraud', 'phishing', 'smishing', 'fake message', 'WhatsApp scam', 'OTP', 'fake call', 'elderly', 'family'],
      ar: ['احتيال', 'نصب', 'التصيّد الاحتيالي', 'رسائل نصية احتيالية', 'رسالة مزيفة', 'احتيال واتساب', 'رمز التحقق', 'مكالمة احتيالية', 'كبار السن', 'العائلة'],
    },
  },
];
