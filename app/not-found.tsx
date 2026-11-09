import Link from 'next/link';

// 404 — unknown page or product slug (bilingual, Shadow Gate styling).
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-sg-navy px-4">
      <div className="panel grid max-w-lg gap-3 p-8 text-center">
        <p className="eyebrow">SG//404</p>
        <h1 className="h2">Page not found · الصفحة غير موجودة</h1>
        <p className="text-sg-muted">
          This service or page does not exist, or is no longer offered.
          <br />
          هذه الخدمة أو الصفحة غير موجودة، أو لم تعد متاحة.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link className="btn btn--primary" href="/products">
            Browse all services · تصفّح كل الخدمات
          </Link>
          <Link className="btn btn--secondary" href="/">
            Home · الرئيسية
          </Link>
        </div>
      </div>
    </main>
  );
}
