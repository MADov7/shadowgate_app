// Typography layer for the ad: the real SVG mark + brand fonts, timed by ad-package/overlays.json.
// Rendered on a transparent page and composited over the 3D plates, so the AI/3D footage never has to draw text.
import type { CSSProperties } from 'react';
import { MARK_FRAME, MARK_S } from '../brand/Logo';
import { CUES, cueAlpha, cueProgress, type AdLang, type Aspect } from './timeline';
import { clamp01, easeInOutCubic, range } from '../lib/choreo';

const SLOGAN: Record<AdLang, string> = {
  en: 'Your gateway to a safer digital world.',
  ar: 'حمايتك تبدأ من هنا',
};

// Path lengths (approximate, viewBox 0..64) for stroke draw-on.
const FRAME_LEN = 37 + 17.7 + 15 + 17.7 + 37;
const S_LEN = 16.5 + 12 + 15 + 12 + 16.5;

function GateCap({ width }: { width: number }) {
  return (
    <svg className="ad-cap" width={width} height={width * 0.22} viewBox="0 0 80 18" aria-hidden="true">
      <path d="M2 17V9.5L9.5 2h61L78 9.5V17" fill="none" stroke="#35F2C4" strokeWidth="2.6" />
    </svg>
  );
}

function Mark({ size, drawFrame, drawS }: { size: number; drawFrame: number; drawS: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path
        d={MARK_FRAME}
        stroke="#F3F6FA"
        strokeWidth="5"
        strokeLinecap="square"
        strokeDasharray={FRAME_LEN}
        strokeDashoffset={FRAME_LEN * (1 - drawFrame)}
      />
      <path
        d={MARK_S}
        stroke="#35F2C4"
        strokeWidth="5"
        strokeLinecap="square"
        strokeDasharray={S_LEN}
        strokeDashoffset={S_LEN * (1 - drawS)}
        style={{ filter: `drop-shadow(0 0 ${size * 0.06}px rgba(53,242,196,${0.55 * drawS}))` }}
      />
    </svg>
  );
}

function Wordmark({ size, spacing, opacity }: { size: number; spacing: number; opacity: number }) {
  return (
    <div className="ad-word" style={{ fontSize: size, letterSpacing: `${spacing}em`, opacity }} dir="ltr">
      SHADOW<span className="ad-word__gate">GATE</span>
    </div>
  );
}

export function AdOverlay({ frame, aspect, lang }: { frame: number; aspect: Aspect; lang: AdLang }) {
  const portrait = aspect === '9x16';
  const W = portrait ? 1080 : 1920;
  const H = portrait ? 1920 : 1080;

  return (
    <div className={`ad-overlay ad-overlay--${aspect}`} style={{ width: W, height: H }} lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {CUES.map((cue) => {
        const a = cueAlpha(cue, frame);
        if (a <= 0) return null;
        const p = cueProgress(cue, frame);

        if (cue.kind === 'lines') {
          const lines = cue.lines?.[aspect]?.[lang] ?? [cue.text[lang]];
          const st = cue.style?.[aspect]?.[lang];
          const size = ((st?.sizePctOfFrameHeight ?? 6) / 100) * H;
          const rise = (1 - easeInOutCubic(clamp01((frame - cue.in.frame + 1) / (cue.fadeInFrames ?? 6)))) * H * (portrait ? 0.01 : 0.015);
          const style: CSSProperties = portrait
            ? { top: H * 0.17, opacity: a, transform: `translateY(${rise}px)` }
            : { bottom: H * 0.1, opacity: a, transform: `translateY(${rise}px)` };
          return (
            <div key={cue.id} className="ad-lines" style={style}>
              <div className="ad-scrim" />
              <GateCap width={size * 1.5} />
              <p
                className="ad-lines__text"
                style={{ fontSize: size, fontWeight: st?.weight ?? 800, lineHeight: st?.lineHeight ?? (lang === 'ar' ? 1.3 : 1.12) }}
              >
                {lines.map((line, i) => (
                  <span key={i} className={i > 0 && cue.slug === 'benefit' ? 'ad-teal' : undefined}>
                    {line}
                  </span>
                ))}
              </p>
            </div>
          );
        }

        if (cue.kind === 'stacked') {
          // Brand beat: the real mark draws itself, then the wordmark settles.
          const size = H * (portrait ? 0.2 : 0.3);
          const drawFrame = easeInOutCubic(range(0, 0.42, p));
          const drawS = easeInOutCubic(range(0.25, 0.62, p));
          const wordIn = easeInOutCubic(range(0.45, 0.8, p));
          return (
            <div key={cue.id} className="ad-stacked" style={{ opacity: a, top: portrait ? 350 : 140 }}>
              <div className="ad-glow" style={{ width: size * 2.4, height: size * 2.4, opacity: 0.55 * drawS }} />
              <Mark size={size} drawFrame={drawFrame} drawS={drawS} />
              <Wordmark size={H * (portrait ? 0.042 : 0.068)} spacing={0.42 - 0.18 * wordIn} opacity={wordIn} />
            </div>
          );
        }

        if (cue.kind === 'lockup') {
          const size = H * (portrait ? 0.05 : 0.075);
          return (
            <div key={cue.id} className="ad-lockup" style={{ opacity: a, top: portrait ? 300 : 150 }}>
              <Mark size={size} drawFrame={1} drawS={1} />
              <Wordmark size={size * 0.46} spacing={0.24} opacity={1} />
            </div>
          );
        }

        if (cue.kind === 'cta') {
          const lines = cue.lines?.[aspect]?.[lang] ?? [cue.text[lang]];
          const size = H * (portrait ? 0.036 : 0.058);
          const rise = (1 - easeInOutCubic(clamp01((frame - cue.in.frame + 1) / 8))) * H * 0.012;
          return (
            <div key={cue.id} className="ad-cta" style={{ opacity: a, top: portrait ? 470 : 300, transform: `translateY(${rise}px)` }}>
              <div className="ad-scrim ad-scrim--wide" />
              <p className="ad-cta__text" style={{ fontSize: size, lineHeight: lang === 'ar' ? 1.3 : 1.1 }}>
                {lines.map((line, i) => (
                  <span key={i}>{line}</span>
                ))}
              </p>
              <span className="ad-cta__bar" style={{ transform: `scaleX(${easeInOutCubic(range(0.1, 0.6, p))})` }} />
            </div>
          );
        }

        if (cue.kind === 'slogan') {
          const size = H * (portrait ? 0.022 : 0.03);
          return (
            <p key={cue.id} className="ad-slogan" style={{ opacity: a, top: portrait ? 760 : 470, fontSize: size }}>
              {SLOGAN[lang]}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}
