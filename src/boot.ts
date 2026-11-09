// Runs once in the browser before the app renders (moved here from the Vite src/main.tsx).
import { applyLangToDocument, useLangStore } from './i18n';
import { applyModeToDocument, useExperience } from './state/experience';

applyLangToDocument(useLangStore.getState().lang);
const exp = useExperience.getState();
applyModeToDocument(exp.mode, exp.reducedMotion);
