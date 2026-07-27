export const HOME_TOPIC_CHIPS = [
  { label: 'Grammar', prompt: "Let's practice grammar and sentence structure." },
  { label: 'Culture', prompt: "Let's explore cultural expressions and customs." },
  { label: 'Business', prompt: 'Help me practice professional business conversations.' },
  { label: 'Travel', prompt: "Let's practice travel scenarios and directions." },
] as const;

export const FOR_YOU_ITEMS = [
  {
    id: 'parisian-etiquette',
    title: 'Parisian Etiquette',
    meta: '5 min • Culture',
    emoji: '🇫🇷',
    prompt: "Teach me Parisian café etiquette and polite phrases.",
  },
  {
    id: 'email-mastery',
    title: 'Email Mastery',
    meta: '8 min • Business',
    emoji: '✉️',
    prompt: 'Help me write professional emails in my target language.',
  },
] as const;

export const LEARNING_TIP =
  'Try practicing right before bed to boost memory retention.';
