import { createRoot } from 'react-dom/client';
import '@fontsource-variable/manrope';
import '@fontsource/tajawal/700.css';
import '@fontsource/tajawal/800.css';
import '@fontsource-variable/jetbrains-mono';
import './ad.css';
import { AdApp } from './AdApp';

createRoot(document.getElementById('ad-root')!).render(<AdApp />);
