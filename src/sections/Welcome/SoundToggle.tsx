// Ambient sound toggle (muted by default). Rendered in the Nav (compact, icon only) and on the welcome page.
// aria-pressed carries the on/off state; the accessible name stays constant ("Ambient sound").
import { useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useExperience } from '../../state/experience';
import { initSound, isAudioSupported, setSoundEnabled } from '../../lib/audio';
import './SoundToggle.css';

export function SoundToggle({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const soundOn = useExperience((s) => s.soundOn);

  useEffect(() => initSound(), []);

  if (!isAudioSupported()) return null;

  const Icon = soundOn ? Volume2 : VolumeX;
  const label = t('common.soundToggleLabel');

  return (
    <button
      type="button"
      className={`btn btn--ghost btn--sm sg-sound${compact ? ' btn--icon' : ''}`}
      aria-pressed={soundOn}
      aria-label={compact ? label : undefined}
      title={soundOn ? t('common.soundOn') : t('common.soundOff')}
      data-on={soundOn}
      onClick={() => setSoundEnabled(!soundOn)}
    >
      <Icon aria-hidden="true" />
      {compact ? null : (
        <>
          <span className="sg-sound__label">{label}</span>
          <span className="sg-sound__bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        </>
      )}
    </button>
  );
}
