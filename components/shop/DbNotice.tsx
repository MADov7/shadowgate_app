// Shown by server pages when Supabase is not reachable/configured: an honest bilingual notice instead of an error
// page. The products are never replaced by hardcoded data — the catalog simply stays empty until the Supabase
// connection (SUPABASE_URL + keys) is available.
export default function DbNotice() {
  return (
    <div
      role="status"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-3xl rounded-2xl border border-sg-line-strong bg-sg-glass-strong px-4 py-3 text-center text-sm text-sg-white shadow-lg backdrop-blur"
      data-testid="db-notice"
    >
      <strong className="text-sg-teal">Store database not connected yet</strong> — products, accounts and orders will appear
      once the Supabase connection is configured.
      <span className="block pt-1" lang="ar" dir="rtl">
        <strong className="text-sg-teal">قاعدة بيانات المتجر غير متصلة بعد</strong> — ستظهر المنتجات والحسابات والطلبات بعد
        إعداد اتصال Supabase.
      </span>
    </div>
  );
}
