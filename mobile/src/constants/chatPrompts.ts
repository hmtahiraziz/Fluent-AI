/** Default quick replies — English (used when target language has no override). */
export const CHAT_QUICK_REPLIES = [
  'I went to the park',
  'It was very sunny',
  'How do you say...?',
] as const;

/** Default empty-state suggested prompts — English. */
export const SUGGESTED_PROMPTS = [
  'Hello! I would like to introduce myself.',
  'Can we practice ordering food at a restaurant?',
  'Help me describe my daily routine.',
  'Teach me how to ask for directions.',
  "Let's talk about my hobbies.",
  'Correct my grammar as we chat.',
] as const;

export const CONVERSATION_TOPICS = [
  { emoji: '👋', label: 'Introductions' },
  { emoji: '🍽️', label: 'Food & dining' },
  { emoji: '✈️', label: 'Travel' },
  { emoji: '💼', label: 'Work' },
  { emoji: '🏠', label: 'Daily life' },
  { emoji: '🎭', label: 'Culture' },
] as const;
