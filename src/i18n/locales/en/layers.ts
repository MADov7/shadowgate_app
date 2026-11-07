// OWNER: guidance agent — Scene C "Defense Layers". Keep ar/layers.ts in sync (same keys).
export const layersEn = {
  eyebrow: 'Defense layers',
  telemetry: 'SG//LAYERS',
  title: 'Five layers between your business and the noise.',
  lead: 'Good protection is rarely one big wall. It is a few well-placed layers, each covering a different way in. Scroll to raise them, one by one, around a typical small-business network.',
  leadStatic:
    'Good protection is rarely one big wall. It is a few well-placed layers, each covering a different way in — here are the five we help small businesses put in place.',
  scrollHint: 'Scroll to raise each layer',
  counter: 'LAYER {n} / {total}',
  introCounter: 'NETWORK · {total} LAYERS',
  shellsActive: 'SHELLS {n} / {total} RAISED',
  riskLabel: 'The risk',
  valueLabel: 'What this layer does',
  serviceLabel: 'Linked service',
  railLabel: 'Defense layers',
  stepButton: 'Layer {n}: {name}',
  announce: 'Layer {n} of {total}: {name}',
  storeNote: 'Running an online store?',
  storeLink: 'E-commerce Security Review',
  staticNote: 'The five layers at a glance',
  diagramLabel: 'Diagram of a business network wrapped in five protection layers',
  diagramCaption:
    'Each node is a part of the business and each shell is a layer around it. The outer ring is the scheduled review that keeps every layer current.',
  coreLabel: 'Your business',

  websiteName: 'Website & online store',
  websiteShort: 'Website',
  websiteRisk:
    'Your website is public by design, so anyone can probe it for outdated software, weak settings or an exposed admin page.',
  websiteValue:
    'A structured assessment finds the weak spots and ranks what to fix first. Online stores get a dedicated review of settings, extensions and admin access.',

  emailName: 'Email & people',
  emailShort: 'Email',
  emailRisk:
    'Most phishing arrives by email. One convincing message can trick a busy person into sharing a password or opening a harmful file.',
  emailValue:
    'Practical awareness training helps your team recognise the signs, pause, and report suspicious messages instead of acting on them.',

  cloudName: 'Cloud files & backups',
  cloudShort: 'Cloud',
  cloudRisk:
    'Files can be deleted by mistake, locked by ransomware or exposed by an over-shared folder — and a backup that was never tested may not restore.',
  cloudValue:
    'A readiness review checks what is backed up, where it lives and how recovery would actually work, so you know your options before you need them.',

  accountsName: 'Accounts & access',
  accountsShort: 'Accounts',
  accountsRisk:
    'A reused or leaked password can open a business mailbox, and old accounts often keep their access long after someone has left.',
  accountsValue:
    'Multi-factor sign-in, sensible access rights and tidier admin roles make a single stolen password far less useful.',

  ongoingName: 'Ongoing review',
  ongoingShort: 'Ongoing',
  ongoingRisk:
    'Settings drift, people join and leave, software changes. Protection that fitted last year can quietly fall behind.',
  ongoingValue:
    'A scheduled monthly review checks key settings, follows up on earlier recommendations and keeps improvements moving.',
  ongoingNote: 'A scheduled review rhythm — not a 24/7 monitoring service.',
} as const;
