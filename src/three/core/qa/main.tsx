// Dev-only isolated harness for the 3D world (not part of the production build: Vite only builds /index.html).
// Lets world-core be screenshotted even while other sections are mid-edit:
//   /src/three/core/qa/index.html?entry=0&qaT=1.6&radarDemo=1&quality=high
import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import '../../../styles/tokens.css';
import '../../../styles/base.css';

const Stage = lazy(() => import('../../Stage'));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Stage />
    </Suspense>
  </StrictMode>,
);
