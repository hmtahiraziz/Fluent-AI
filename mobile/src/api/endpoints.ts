import { api } from './client';
import type {
  AuthResponse,
  Conversation,
  LanguageOption,
  LearningState,
  Message,
  UserSettings,
  VocabRating,
  VocabularyItem,
  VocabularySource,
  VocabularyStats,
  WeeklyProgress,
} from './types';

export async function fetchMe() {
  const { data } = await api.get<{
    user: AuthResponse['user'];
    settings: AuthResponse['settings'];
  }>('/api/auth/me');
  return data;
}

export async function register(
  email: string,
  password: string,
  ageConfirmed: true,
) {
  const { data } = await api.post<AuthResponse>('/api/auth/register', {
    email,
    password,
    ageConfirmed,
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

export async function refreshSession(refreshToken: string) {
  const { data } = await api.post<{
    accessToken: string;
    refreshToken: string;
  }>('/api/auth/refresh', { refreshToken });
  return data;
}

export async function logoutRemote(refreshToken?: string | null) {
  try {
    await api.post('/api/auth/logout', refreshToken ? { refreshToken } : {});
  } catch {
    // Local logout still proceeds if network fails.
  }
}

export async function deleteAccount(password: string) {
  await api.delete('/api/auth/account', { data: { password } });
}

export async function requestPasswordReset(email: string) {
  const { data } = await api.post<{ message: string }>(
    '/api/auth/forgot-password',
    { email },
  );
  return data;
}

export async function verifyResetOtp(email: string, code: string) {
  const { data } = await api.post<{
    resetToken: string;
    expiresInMinutes: number;
    message: string;
  }>('/api/auth/verify-reset-otp', { email, code });
  return data;
}

export async function resetPassword(token: string, password: string) {
  const { data } = await api.post<{ message: string }>('/api/auth/reset-password', {
    token,
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

export async function updateSettings(
  patch: Partial<UserSettings> & { acceptLlmConsent?: true },
) {
  const { data } = await api.patch<UserSettings>('/api/settings', patch);
  return data;
}

export async function reportContent(body: {
  conversationId?: string;
  messageId?: string;
  reason: 'inappropriate' | 'harmful' | 'incorrect' | 'spam' | 'other';
  details?: string;
}) {
  const { data } = await api.post<{ report: { id: string } }>(
    '/api/reports',
    body,
  );
  return data.report;
}

export async function fetchConversations() {
  const { data } = await api.get<{ conversations: Conversation[] }>(
    '/api/conversations',
  );
  return data.conversations;
}

export async function createConversation(input?: {
  title?: string;
  topic?: Conversation['topic'];
  scenario?: string;
}) {
  const body: {
    title?: string;
    topic?: Conversation['topic'];
    scenario?: string;
  } = {};
  if (input?.title) body.title = input.title;
  if (input?.topic) body.topic = input.topic;
  if (input?.scenario) body.scenario = input.scenario;
  const { data } = await api.post<{ conversation: Conversation }>(
    '/api/conversations',
    body,
  );
  return data.conversation;
}

export async function fetchMessages(conversationId: string) {
  const { data } = await api.get<{ messages: Message[] }>(
    `/api/conversations/${conversationId}/messages`,
  );
  return data.messages;
}

export async function sendChatMessage(
  conversationId: string,
  content: string,
  clientRequestId?: string,
) {
  const { data } = await api.post<{
    userMessage: Message;
    assistantMessage: Message;
    correction: Message['correction'];
    vocabularySuggestions?: Message['vocabularySuggestions'];
  }>(`/api/conversations/${conversationId}/messages`, {
    content,
    ...(clientRequestId ? { clientRequestId } : {}),
  });
  return data;
}

export async function fetchVocabulary(
  language?: string,
  opts?: {
    limit?: number;
    state?: LearningState;
    sort?: 'created_at' | 'phrase' | 'next_review_at';
    q?: string;
    cursor?: string;
  },
) {
  const { data } = await api.get<{
    items: VocabularyItem[];
    nextCursor?: string | null;
  }>('/api/vocabulary', {
    params: {
      ...(language ? { language } : {}),
      ...(opts?.limit != null ? { limit: opts.limit } : {}),
      ...(opts?.state ? { state: opts.state } : {}),
      ...(opts?.sort ? { sort: opts.sort } : {}),
      ...(opts?.q ? { q: opts.q } : {}),
      ...(opts?.cursor ? { cursor: opts.cursor } : {}),
    },
  });
  return data;
}

export async function fetchVocabularyStats(
  language?: string,
  opts?: { createdSince?: string },
) {
  const { data } = await api.get<VocabularyStats>('/api/vocabulary/stats', {
    params: {
      ...(language ? { language } : {}),
      ...(opts?.createdSince ? { createdSince: opts.createdSince } : {}),
    },
  });
  return data;
}

export async function fetchVocabularyItem(id: string) {
  const { data } = await api.get<{
    item: VocabularyItem;
    source: VocabularySource | null;
  }>(`/api/vocabulary/${id}`);
  return data;
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

export async function updateVocabularyItem(
  id: string,
  body: {
    translation?: string | null;
    note?: string | null;
    pronunciation?: string | null;
    exampleSentence?: string | null;
  },
) {
  const { data } = await api.patch<{ item: VocabularyItem }>(
    `/api/vocabulary/${id}`,
    body,
  );
  return data.item;
}

export async function deleteVocabularyItem(id: string) {
  await api.delete(`/api/vocabulary/${id}`);
}

export async function restoreVocabularyItem(id: string) {
  const { data } = await api.post<{ item: VocabularyItem }>(
    `/api/vocabulary/${id}/restore`,
  );
  return data.item;
}

export async function fetchReviewQueue(language?: string, limit = 20) {
  const { data } = await api.get<{ items: VocabularyItem[] }>(
    '/api/vocabulary/review-queue',
    { params: { ...(language ? { language } : {}), limit } },
  );
  return data.items;
}

export async function submitVocabularyReview(
  id: string,
  body: { rating: VocabRating; clientRequestId: string },
) {
  const { data } = await api.post<{
    item: VocabularyItem;
    review: {
      id: string;
      rating: VocabRating;
      clientRequestId: string;
      status: string;
      createdAt: string;
    };
  }>(`/api/vocabulary/${id}/review`, body);
  return data;
}

export async function upsertPracticeDaily(body: {
  date: string;
  durationMs: number;
}) {
  const { data } = await api.put<{ date: string; durationMs: number }>(
    '/api/progress/practice-daily',
    body,
  );
  return data;
}

export async function fetchWeeklyProgress(timeZone: string) {
  const { data } = await api.get<WeeklyProgress>('/api/progress/weekly', {
    params: { timeZone },
  });
  return data;
}
