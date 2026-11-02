// Brand constants for JavaScript / WebGL (CSS uses the tokens in src/styles/tokens.css).
export const BRAND = {
  name: 'SHADOW GATE',
  slogan: { en: 'Your gateway to a safer digital world.', ar: 'حمايتك تبدأ من هنا' },
  personality: ['Vigilant', 'Precise', 'Approachable'],
} as const;

export const COLORS = {
  navy: '#070B14',
  navy2: '#0E1628',
  navy3: '#142035',
  teal: '#35F2C4',
  tealSoft: '#8AF7DA',
  white: '#F3F6FA',
  muted: '#A9B4C4',
  /** Semantic only: simulated threats. */
  threat: '#FF4D5E',
  phishing: '#FFB547',
  login: '#B99CFF',
  scanning: '#5CC8FF',
  traffic: '#FF4D5E',
  metal: '#1C2638',
} as const;
