'use client';

import Link from 'next/link';

// Friendly error screen (bilingual) for unexpected server/data errors — never a blank page.
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-sg-navy px-4" role="alert">
      <div className="panel grid max-w-lg gap-3 p-8 text-center">
        <p className="eyebrow">SG//ERROR</p>
        <h1 className="h2">Something went wrong · حدث خطأ ما</h1>
        <p className="text-sg-muted">
          We could not load this page. Check your connection and try again.
          <br />
          تعذّر تحميل هذه الصفحة. تحقّق من اتصالك ثم حاول مرة أخرى.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <button type="button" className="btn btn--primary" onClick={reset}>
            Try again · حاول مرة أخرى
          </button>
          <Link className="btn btn--secondary" href="/">
            Home · الرئيسية
          </Link>
        </div>
      </div>
    </main>
  );
}
