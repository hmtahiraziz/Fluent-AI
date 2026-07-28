import type { Conversation, UserSettings } from '../../api/types';

export type LanguageSettings = Pick<UserSettings, 'targetLanguage' | 'level'>;

export function matchesCurrentSettings(
  conversation: Conversation,
  settings: LanguageSettings,
): boolean {
  return (
    conversation.language === settings.targetLanguage &&
    conversation.level === settings.level
  );
}

export function findResumableConversation(
  conversations: Conversation[],
  settings: LanguageSettings,
): Conversation | null {
  return conversations.find(c => matchesCurrentSettings(c, settings)) ?? null;
}

export function getOtherLanguageConversations(
  conversations: Conversation[],
  settings: LanguageSettings,
): Conversation[] {
  return conversations.filter(c => !matchesCurrentSettings(c, settings));
}
