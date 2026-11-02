// OWNER: welcome-hero agent. Placeholder: hides itself immediately so the site is usable.
import { useEffect } from 'react';
import { useExperience } from '../../state/experience';
import { scrollState } from '../../state/scroll';

export function Welcome() {
  const welcome = useExperience((s) => s.welcome);
  const setWelcome = useExperience((s) => s.setWelcome);
  useEffect(() => {
    scrollState.entry = 1;
    if (welcome !== 'hidden') setWelcome('hidden');
  }, [welcome, setWelcome]);
  return null;
}
