import type { navEn } from '../en/nav';

export const navAr: Record<keyof typeof navEn, string> = {
  label: 'التنقل الرئيسي',
  home: 'الرئيسية',
  business: 'خدمات الشركات',
  personal: 'خدمات الأفراد',
  radar: 'رادار التهديدات',
  packages: 'الباقات',
  contact: 'تواصل معنا',
  cta: 'اطلب تقييمًا أمنيًا',
  ctaShort: 'اطلب تقييمًا',
  basket: 'سلة الطلب',
  basketCount: 'سلة الطلب، {count} عنصر',
  menuOpen: 'فتح القائمة',
  menuClose: 'إغلاق القائمة',
  progress: 'تقدم الصفحة',
  homeLink: 'شادو غيت — العودة إلى الأعلى',
  settings: 'إعدادات العرض',
};
