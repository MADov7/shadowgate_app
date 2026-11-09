// Loading state for store pages: shown while the server loads data and while the store UI starts in the browser.
// Plain markup + Tailwind only (safe to render on the server), in Shadow Gate's colours — never a blank screen.
export default function ShopSkeleton({ label = 'Loading the store… · جارٍ تحميل المتجر…' }: { label?: string }) {
  return (
    <div className="min-h-screen bg-sg-navy" role="status" aria-live="polite" aria-label={label}>
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-4 px-4 pt-5 sm:px-6">
        <div className="h-11 w-44 animate-pulse rounded-full border border-sg-line bg-sg-glass" />
        <div className="hidden h-11 w-80 animate-pulse rounded-full border border-sg-line bg-sg-glass md:block" />
        <div className="h-11 w-24 animate-pulse rounded-full border border-sg-line bg-sg-glass" />
      </div>
      <div className="mx-auto max-w-[1240px] px-4 pt-24 sm:px-6">
        <div className="h-3 w-32 animate-pulse rounded bg-sg-line-strong" />
        <div className="mt-4 h-9 w-full max-w-md animate-pulse rounded bg-sg-line-strong" />
        <div className="mt-3 h-4 w-full max-w-xl animate-pulse rounded bg-sg-line" />
        <ul className="mt-10 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <li key={i} className="h-64 animate-pulse rounded-2xl border border-sg-line bg-sg-glass" />
          ))}
        </ul>
        <p className="sr-only">{label}</p>
      </div>
    </div>
  );
}
