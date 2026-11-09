import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
// Self-hosted brand fonts (same as the original Vite entry).
import '@fontsource-variable/manrope';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import '@fontsource/tajawal/800.css';
import '@fontsource-variable/jetbrains-mono';
// Shadow Gate design tokens and shared UI primitives, then Tailwind (theme + utilities only, no reset).
import '../src/styles/tokens.css';
import '../src/styles/base.css';
import './tailwind.css';

export const metadata: Metadata = {
  title: 'SHADOW GATE — Cybersecurity services for businesses and individuals',
  description:
    'Shadow Gate offers understandable cybersecurity assessments, account protection, security awareness, consultations and ongoing reviews for small businesses and individuals.',
  icons: { icon: { url: '/favicon.svg', type: 'image/svg+xml' } },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#070B14',
  colorScheme: 'dark',
};

// Sets language/direction and the motion preference before first paint (no layout flash), exactly like the
// inline script the Vite index.html had. It only reads the URL and the visitor's own saved preferences.
const PREPAINT = `(function () {
  try {
    var root = document.documentElement;
    var q = new URLSearchParams(location.search);
    var lang = q.get('lang') || localStorage.getItem('sg-lang');
    if (lang === 'ar') { root.lang = 'ar'; root.dir = 'rtl'; }
    var m = q.get('motion') || localStorage.getItem('sg-motion');
    var reduced = m === 'reduced' || (m !== 'full' && matchMedia('(prefers-reduced-motion: reduce)').matches);
    root.dataset.motion = reduced ? 'reduced' : 'full';
  } catch (e) {}
})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    // The pre-paint script may switch lang/dir/data-motion before React hydrates; that is intended.
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <body>
        {/* First thing in <body>, not in <head>: hosts may inject text/comments into <head> (Netlify adds a newline +
            comment after the charset meta), which breaks React's hydration of a non-hoistable inline script there
            (React #418). Here it still runs before any content is parsed or painted. */}
        <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
        <noscript>
          <div style={{ padding: 24, fontFamily: 'system-ui', color: '#f3f6fa', background: '#070b14' }}>
            SHADOW GATE needs JavaScript for the interactive storefront. Contact and service information is available
            once JavaScript is enabled.
          </div>
        </noscript>
        {children}
      </body>
    </html>
  );
}
