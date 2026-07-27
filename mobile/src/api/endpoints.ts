import { api } from './client';
import type {
  AuthResponse,
  Conversation,
  LanguageOption,
  Message,
  UserSettings,
  VocabularyItem,
} from './types';

export async function fetchMe() {
  const { data } = await api.get<{
    user: AuthResponse['user'];
    settings: AuthResponse['settings'];
  }>('/api/auth/me');
  return data;
}

export async function register(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/api/auth/register', {
    email,
    password,
  });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/api/auth/login', {
    email,
    password,
  });
  return data;
}

export async function fetchLanguages() {
  const { data } = await api.get<{
    languages: LanguageOption[];
    levels: { level: string; description: string }[];
  }>('/api/languages');
  return data;
}

export async function fetchSettings() {
  const { data } = await api.get<UserSettings>('/api/settings');
  return data;
}

export async function updateSettings(patch: Partial<UserSettings>) {
  const { data } = await api.patch<UserSettings>('/api/settings', patch);
  return data;
}

export async function fetchConversations() {
  const { data } = await api.get<{ conversations: Conversation[] }>(
    '/api/conversations',
  );
  return data.conversations;
}

export async function createConversation(title?: string) {
  const { data } = await api.post<{ conversation: Conversation }>(
    '/api/conversations',
    title ? { title } : {},
  );
  return data.conversation;
}

export async function fetchMessages(conversationId: string) {
  const { data } = await api.get<{ messages: Message[] }>(
    `/api/conversations/${conversationId}/messages`,
  );
  return data.messages;
}

export async function sendChatMessage(conversationId: string, content: string) {
  const { data } = await api.post<{
    userMessage: Message;
    assistantMessage: Message;
    correction: Message['correction'];
  }>(`/api/conversations/${conversationId}/messages`, { content });
  return data;
}

export async function fetchVocabulary(language?: string) {
  const { data } = await api.get<{ items: VocabularyItem[] }>(
    '/api/vocabulary',
    { params: language ? { language } : undefined },
  );
  return data.items;
}

export async function createVocabularyItem(body: {
  phrase: string;
  translation?: string;
  note?: string;
  language?: string;
  sourceMessageId?: string;
}) {
  const { data } = await api.post<{ item: VocabularyItem }>(
    '/api/vocabulary',
    body,
  );
  return data.item;
}

export async function deleteVocabularyItem(id: string) {
  await api.delete(`/api/vocabulary/${id}`);
}
