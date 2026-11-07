// OWNER: guidance agent — interaction E "Recommendation Quiz". Keep ar/quiz.ts in sync (same keys).
export const quizEn = {
  eyebrow: 'Recommendation quiz',
  telemetry: 'SG//GUIDE',
  title: 'Three questions to a clear starting point.',
  lead: 'Tell us what you look after and what is on your mind. We will suggest two to four services and explain why each one fits.',
  guidance: 'Guidance only — not a security diagnosis.',
  progress: 'Question {n} of {total}',
  progressLabel: 'Quiz progress',
  yourAnswers: 'Your answers',
  notAnswered: 'Not answered yet',
  edit: 'Edit',
  editLabel: 'Edit answer: {question}',

  q1Title: 'Who is this for?',
  q1Hint: 'Pick one.',
  q1Short: 'Customer type',
  q2Title: 'What would you like to look after?',
  q2Hint: 'Choose all that apply.',
  q2Short: 'What you look after',
  q3Title: 'What is on your mind?',
  q3Hint: 'Choose all that apply. “Not sure yet” is a perfectly good answer.',
  q3Short: 'Concerns',

  opt_business: 'A business',
  opt_business_desc: 'A company, a team, a website or an online store.',
  opt_individual: 'Me or my family',
  opt_individual_desc: 'Personal accounts, phones and laptops.',
  opt_website: 'Company website',
  opt_website_desc: 'Your public site and its admin area.',
  opt_store: 'Online store',
  opt_store_desc: 'A shop, its checkout and extensions.',
  opt_email: 'Business email & accounts',
  opt_email_desc: 'Mailboxes and cloud app sign-ins.',
  opt_cloud: 'Cloud files & backups',
  opt_cloud_desc: 'Shared drives, documents, photos and their backups.',
  opt_teamDevices: 'Team devices',
  opt_teamDevices_desc: 'Laptops and phones your team works on.',
  opt_personalDevices: 'Personal devices',
  opt_personalDevices_desc: 'Your phone, tablet or laptop.',
  opt_social: 'Social & personal accounts',
  opt_social_desc: 'Email, social media, shopping and banking sign-ins.',
  opt_phishing: 'Phishing & scams',
  opt_phishing_desc: 'Convincing messages, fake links and calls.',
  opt_takeover: 'Account takeover',
  opt_takeover_desc: 'Someone else signing in as you.',
  opt_websiteAttacks: 'Website attacks',
  opt_websiteAttacks_desc: 'Probing, defacement or a compromised admin.',
  opt_dataLoss: 'Data loss',
  opt_dataLoss_desc: 'Deleted, locked or unrecoverable files.',
  opt_privacy: 'Privacy',
  opt_privacy_desc: 'Who can see your information.',
  opt_unsure: 'Not sure yet',
  opt_unsure_desc: 'Help me find a sensible place to start.',
  opt_breadth: 'Several areas to look after',
  exclusiveNote: 'Clears the other choices',

  errorPickOne: 'Choose one option to continue.',
  errorPickAny: 'Choose at least one option to continue.',
  next: 'Next',
  back: 'Back',
  seeResults: 'See my recommendations',

  resultsEyebrow: 'Your starting points',
  resultsTitle: 'Recommended for you',
  resultsLead: 'Ranked by how closely each service matches your answers.',
  resultCount: '{count} recommendations ready.',
  basedOn: 'Based on',
  bestMatch: 'Best match',
  startingPoint: 'Good starting point',
  matchedLabel: 'Matched answers',
  points: '+{n}',
  scoreLabel: 'Match score {score} of {max}',
  scoreShort: 'MATCH {score}/{max}',

  addAll: 'Add all recommended',
  allAdded: 'All recommended services are in your request',
  startOver: 'Start over',
  bookPath: 'Book a consultation',
  bookPathNote: 'Opens a demo booking for your top match. It is saved in this browser only and nothing is sent.',
  howTitle: 'How the ranking works',
  howBody:
    'Each answer adds points to the services that address it — for example, “Online store” adds 4 points to the E-commerce Security Review. Services are ordered by their total, and the points behind each one are listed on its card. Ties keep catalog order. If fewer than two services match, we add a general starting point.',

  quote: '“{label}”',
  why_websiteAssessment:
    'You chose {matches}. This assessment reviews your website’s configuration and common web weaknesses, then ranks what to fix first.',
  why_ecommerceReview:
    'You chose {matches}. This review looks at store settings, extensions and administrator access — the parts of a shop that need the most care.',
  why_emailAccounts:
    'You chose {matches}. This review strengthens sign-in with MFA and tidier access, so one leaked password goes less far.',
  why_awareness:
    'You chose {matches}. A practical session helps your team recognise phishing and handle data with care.',
  why_backupRecovery:
    'You chose {matches}. This review checks what is backed up and how recovery would actually work, before you need it.',
  why_consultation: 'You chose {matches}. A short session turns open questions into a prioritised, written plan.',
  why_monthlyReview:
    'You chose {matches}. A scheduled monthly review keeps improvements moving — it is not 24/7 monitoring.',
  why_monthlyReviewBreadth:
    'You look after {count} different areas. A scheduled monthly review keeps them all moving in the right direction — it is not 24/7 monitoring.',
  why_personalAccounts:
    'You chose {matches}. A guided session sets up stronger sign-in protection on the accounts you rely on most.',
  why_deviceReview:
    'You chose {matches}. A walkthrough tightens the security and backup settings on your own devices.',
  why_privacyReview: 'You chose {matches}. This review helps reduce what strangers can learn about you online.',
  why_scamAwareness:
    'You chose {matches}. A friendly session on common scams helps you pause before you click.',
  fallback_consultation:
    'A sensible first step whatever your answers: a short session that turns them into a prioritised plan.',
  fallback_emailAccounts:
    'Almost every business runs on email and cloud accounts, so stronger sign-in is a useful baseline.',
  fallback_personalAccounts: 'Your main email and social accounts are a sensible place to start for almost anyone.',
  fallback_scamAwareness: 'Knowing how common scams work is a useful habit, whatever you look after.',
} as const;
