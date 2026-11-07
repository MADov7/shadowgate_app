// Interaction layer over the 3D constellation: a drag surface (horizontal drag rotates, vertical scrolling is
// never blocked) and one accessible hotspot BUTTON per service, positioned every frame from the projected
// 3D positions (transform-only writes, rAF runs only while the section is near the viewport).
import { useEffect, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent, type RefObject } from 'react';
import { BUSINESS_SERVICE_IDS, getService } from '../../data/services';
import { useI18n } from '../../i18n';
import { hotspots } from '../../state/projection';
import { beginDrag, constellationState, endDrag, nudgeYaw, setYawTarget } from '../../state/constellation';
import { useUI } from '../../state/ui';
import { pad2 } from './shared';

interface Props {
  pinRef: RefObject<HTMLDivElement | null>;
  sectionRef: RefObject<HTMLElement | null>;
  index: number;
}

interface DragState {
  id: number;
  x: number;
  y: number;
  yaw: number;
  active: boolean;
}

const DRAG_RADIANS_PER_WIDTH = 2.6;
const KEY_NUDGE = 0.2;

export function ConstellationStage({ pinRef, sectionRef, index }: Props) {
  const { t, loc } = useI18n();
  const stageRef = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef<DragState | null>(null);
  const suppressClick = useRef(false);

  // Position hotspots from the 3D projection. Reads one rect, then writes transforms only.
  useEffect(() => {
    const pin = pinRef.current;
    const section = sectionRef.current;
    if (!pin || !section) return;
    // Sentinels far off-screen (not NaN: NaN comparisons are always false, so the first write would never happen).
    const cache = BUSINESS_SERVICE_IDS.map(() => ({ x: -1e6, y: -1e6, vis: false, e: -1, r: -1 }));
    let raf = 0;
    let running = false;
    const hideAll = () => {
      buttons.current.forEach((el, i) => {
        if (el) el.dataset.visible = 'false';
        cache[i].vis = false;
      });
    };
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const rect = pin.getBoundingClientRect();
      for (let i = 0; i < BUSINESS_SERVICE_IDS.length; i++) {
        const el = buttons.current[i];
        if (!el) continue;
        const h = hotspots.get(`svc-${BUSINESS_SERVICE_IDS[i]}`);
        const c = cache[i];
        const vis = !!h && h.visible;
        if (vis !== c.vis) {
          el.dataset.visible = vis ? 'true' : 'false';
          c.vis = vis;
        }
        if (!h || !vis) continue;
        const x = h.x - rect.left;
        const y = h.y - rect.top;
        if (Math.abs(x - c.x) > 0.15 || Math.abs(y - c.y) > 0.15) {
          el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
          c.x = x;
          c.y = y;
        }
        if (Math.abs(h.emphasis - c.e) > 0.008) {
          el.style.setProperty('--e', h.emphasis.toFixed(3));
          c.e = h.emphasis;
        }
        const r = constellationState.radiusPx[i];
        if (Math.abs(r - c.r) > 0.4) {
          el.style.setProperty('--r', `${Math.max(18, r).toFixed(1)}px`);
          c.r = r;
        }
      }
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(tick);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
          hideAll();
        }
      },
      { rootMargin: '120px 0px' },
    );
    io.observe(section);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [pinRef, sectionRef]);

  // Always release a drag on unmount.
  useEffect(() => () => endDrag(), []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, yaw: constellationState.yawTarget, active: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const stage = stageRef.current;
    if (!d || d.id !== e.pointerId || !stage) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.active) {
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        d.active = true;
        d.x = e.clientX;
        beginDrag();
        stage.dataset.dragging = 'true';
        try {
          stage.setPointerCapture(e.pointerId);
        } catch {
          /* pointer already gone */
        }
      } else if (Math.abs(dy) > 12) {
        drag.current = null; // a vertical gesture: leave it to page scrolling
      }
      return;
    }
    setYawTarget(d.yaw + ((e.clientX - d.x) / Math.max(1, stage.clientWidth)) * DRAG_RADIANS_PER_WIDTH);
  };
  const finish = (e: PointerEvent<HTMLDivElement>, cancelled: boolean) => {
    const d = drag.current;
    const stage = stageRef.current;
    if (d && d.id === e.pointerId && d.active) {
      endDrag();
      if (!cancelled) {
        suppressClick.current = true;
        window.setTimeout(() => (suppressClick.current = false), 0);
      }
      if (stage) {
        delete stage.dataset.dragging;
        if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
      }
    }
    drag.current = null;
  };
  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (!suppressClick.current) return;
    e.preventDefault();
    e.stopPropagation();
    suppressClick.current = false;
  };
  // Clicking anywhere on an object's silhouette (not only its hotspot button) opens it.
  const onStageClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    let best = -1;
    let bestD = Infinity;
    BUSINESS_SERVICE_IDS.forEach((id, i) => {
      const h = hotspots.get(`svc-${id}`);
      if (!h || !h.visible) return;
      const d = Math.hypot(e.clientX - h.x, e.clientY - h.y);
      const r = Math.max(28, constellationState.radiusPx[i]);
      if (d <= r && d < bestD) {
        best = i;
        bestD = d;
      }
    });
    if (best >= 0) useUI.getState().openDetails(BUSINESS_SERVICE_IDS[best]);
  };
  const onHotspotKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      nudgeYaw(e.key === 'ArrowRight' ? KEY_NUDGE : -KEY_NUDGE);
    }
  };

  return (
    <div
      ref={stageRef}
      className="cst-stage"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => finish(e, false)}
      onPointerCancel={(e) => finish(e, true)}
      onClickCapture={onClickCapture}
      onClick={onStageClick}
    >
      <p id="cst-keys" className="sr-only">
        {t('constellation.hintKeys')}
      </p>
      <ul className="cst-hotspots" aria-label={t('constellation.objectsLabel')}>
        {BUSINESS_SERVICE_IDS.map((id, i) => {
          const name = loc(getService(id).name);
          return (
            <li key={id}>
              <button
                ref={(el) => {
                  buttons.current[i] = el;
                }}
                type="button"
                className="cst-hot"
                data-visible="false"
                data-focused={i === index ? 'true' : 'false'}
                aria-label={t('constellation.hotspotLabel', { name })}
                aria-describedby="cst-keys"
                onClick={() => useUI.getState().openDetails(id)}
                onKeyDown={onHotspotKey}
              >
                <span className="cst-hot__reticle" aria-hidden="true" />
                <span className="cst-hot__dot" aria-hidden="true" />
                <span className="cst-hot__tag" aria-hidden="true">
                  <span className="cst-hot__num">{pad2(i + 1)}</span>
                  <span className="cst-hot__open">{t('constellation.hotspotOpen')}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
