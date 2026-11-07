// Fictional artefacts for the protection simulation: a lookalike-domain email and a sign-in alert.
// Every name, address and domain is made up (reserved ".example" domains, a documentation-range IP).
import type { ReactNode } from 'react';
import { Archive, CircleAlert, Forward, Mail, Reply, ShieldAlert, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useI18n } from '../../i18n';

export type MarkState = 'off' | 'on' | 'missed';
export interface ArtefactProps {
  /** How warning signals are shown: hidden, highlighted (coach marks) or flagged as missed. */
  marks: MarkState;
  /** Outcome stamp once the response step is reached. */
  outcome: 'none' | 'defended' | 'threat';
  outcomeText: string;
}

const FAKE = {
  sender: 'it-desk@yourc0mpany-support.example',
  to: 'team@yourcompany.example',
  link: 'https://yourcompany-verify.example/login',
  account: 'finance@yourcompany.example',
  ip: '203.0.113.24',
};

/** Coach-mark highlight with a numbered badge (the legend lives in the timeline). */
function Mark({ n, state, children, block }: { n: number; state: MarkState; children: ReactNode; block?: boolean }) {
  return (
    <span className={`sim-mark${block ? ' sim-mark--block' : ''}`} data-state={state} style={{ ['--n' as string]: n }}>
      {children}
      <span className="sim-mark__badge" aria-hidden="true">
        {n}
      </span>
    </span>
  );
}

/** Footer with a reserved height: idle placeholder controls, then the outcome stamp (no layout shift). */
function Foot({ outcome, text, idle }: { outcome: ArtefactProps['outcome']; text: string; idle: ReactNode }) {
  const Icon = outcome === 'defended' ? ShieldCheck : TriangleAlert;
  return (
    <div className="sim-art__foot" aria-hidden="true">
      {outcome === 'none' ? (
        idle
      ) : (
        <span key={outcome} className="sim-stamp" data-tone={outcome}>
          <Icon />
          <span>{text}</span>
        </span>
      )}
    </div>
  );
}

function Chrome({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="sim-art__chrome" aria-hidden="true">
      <span className="sim-art__dots">
        <i />
        <i />
        <i />
      </span>
      <span className="sim-art__title">
        {icon}
        {title}
      </span>
    </div>
  );
}

export function EmailArtefact({ marks, outcome, outcomeText }: ArtefactProps) {
  const { t } = useI18n();
  return (
    <figure className="sim-art sim-email" data-outcome={outcome} aria-label={t('simulation.email_window')}>
      <Chrome icon={<Mail />} title={t('simulation.email_window')} />
      <div className="sim-email__meta">
        <div className="sim-email__row">
          <span className="sim-email__k">{t('simulation.email_fromLabel')}</span>
          <Mark n={1} state={marks}>
            <span className="sim-email__from">{t('simulation.email_fromName')}</span>{' '}
            <bdi className="sim-email__addr" dir="ltr">
              &lt;{FAKE.sender}&gt;
            </bdi>
          </Mark>
        </div>
        <div className="sim-email__row">
          <span className="sim-email__k">{t('simulation.email_toLabel')}</span>
          <bdi className="sim-email__addr" dir="ltr">
            {FAKE.to}
          </bdi>
        </div>
        <div className="sim-email__row sim-email__row--subject">
          <span className="sim-email__k">{t('simulation.email_subjectLabel')}</span>
          <Mark n={2} state={marks}>
            <span className="sim-email__subject">{t('simulation.email_subject')}</span>
          </Mark>
        </div>
      </div>
      <div className="sim-email__body">
        <p>{t('simulation.email_greeting')}</p>
        <p>{t('simulation.email_body')}</p>
        <p>
          <Mark n={3} state={marks}>
            <strong>{t('simulation.email_bodyAsk')}</strong>
          </Mark>
        </p>
        <div className="sim-email__cta">
          <Mark n={4} state={marks} block>
            <span className="sim-email__btn" aria-hidden="true">
              {t('simulation.email_button')}
            </span>
            <span className="sim-email__url">
              {t('simulation.email_linkHint')}{' '}
              <bdi dir="ltr">{FAKE.link}</bdi>
            </span>
          </Mark>
        </div>
        <p className="sim-email__sign">{t('simulation.email_signoff')}</p>
      </div>
      <Foot
        outcome={outcome}
        text={outcomeText}
        idle={
          <span className="sim-art__tools">
            <Reply />
            <Forward />
            <Archive />
          </span>
        }
      />
    </figure>
  );
}

export function LoginArtefact({ marks, outcome, outcomeText }: ArtefactProps) {
  const { t } = useI18n();
  return (
    <figure className="sim-art sim-login" data-outcome={outcome} aria-label={t('simulation.login_window')}>
      <Chrome icon={<ShieldAlert />} title={t('simulation.login_window')} />
      <div className="sim-login__head">
        <span className="sim-login__icon" aria-hidden="true">
          <CircleAlert />
        </span>
        <div>
          <p className="sim-login__heading">{t('simulation.login_heading')}</p>
          <p className="sim-login__account">
            <span className="sim-email__k">{t('simulation.login_accountLabel')}</span>{' '}
            <bdi dir="ltr">{FAKE.account}</bdi>
          </p>
        </div>
      </div>
      <dl className="sim-login__grid">
        <div>
          <dt>{t('simulation.login_deviceLabel')}</dt>
          <dd>
            <Mark n={1} state={marks}>
              {t('simulation.login_deviceValue')}
            </Mark>
          </dd>
        </div>
        <div>
          <dt>{t('simulation.login_timeLabel')}</dt>
          <dd>
            <Mark n={2} state={marks}>
              <bdi>{t('simulation.login_timeValue')}</bdi>
            </Mark>
          </dd>
        </div>
        <div>
          <dt>{t('simulation.login_locationLabel')}</dt>
          <dd>
            <Mark n={3} state={marks}>
              {t('simulation.login_locationValue')}
            </Mark>
          </dd>
        </div>
        <div>
          <dt>{t('simulation.login_ipLabel')}</dt>
          <dd>
            <bdi dir="ltr" className="sim-login__ip">
              {FAKE.ip}
            </bdi>{' '}
            <span className="sim-login__note">({t('simulation.login_ipNote')})</span>
          </dd>
        </div>
        <div className="sim-login__wide">
          <dt>{t('simulation.login_historyLabel')}</dt>
          <dd>
            <Mark n={4} state={marks}>
              {t('simulation.login_historyValue')}
            </Mark>
          </dd>
        </div>
      </dl>
      <Foot
        outcome={outcome}
        text={outcomeText}
        idle={
          <span className="sim-login__fakebtns">
            <span>{t('simulation.login_btnNotMe')}</span>
            <span>{t('simulation.login_btnMe')}</span>
          </span>
        }
      />
    </figure>
  );
}
