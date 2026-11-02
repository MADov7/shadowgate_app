import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/500.css';
import '@fontsource/tajawal/700.css';
import '@fontsource/tajawal/800.css';
import '@fontsource-variable/jetbrains-mono';
import './styles/tokens.css';
import './styles/base.css';
import { applyLangToDocument, useLangStore } from './i18n';
import { applyModeToDocument, useExperience } from './state/experience';
import App from './App';

applyLangToDocument(useLangStore.getState().lang);
const exp = useExperience.getState();
applyModeToDocument(exp.mode, exp.reducedMotion);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
