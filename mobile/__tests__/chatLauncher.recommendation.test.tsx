import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PENDING_CHAT_PROMPT_KEY } from '../src/config/constants';
import { normalizePracticeContext } from '../src/features/chat/practiceContext';
import { useChatLauncher } from '../src/features/chat/useChatLauncher';
import type { Conversation } from '../src/api/types';

const mockNavigate = jest.fn();
const mockRefreshSettings = jest.fn();
const mockCreateConversation = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
}));

jest.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ refreshSettings: mockRefreshSettings }),
}));

jest.mock('../src/api/endpoints', () => ({
  createConversation: (...args: unknown[]) => mockCreateConversation(...args),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/api/client', () => ({
  getErrorMessage: (e: unknown) =>
    e instanceof Error ? e.message : 'error',
}));

type Launcher = ReturnType<typeof useChatLauncher>;

function HookHost({
  apiRef,
}: {
  apiRef: React.MutableRefObject<Launcher | null>;
}) {
  apiRef.current = useChatLauncher();
  return null;
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const sampleConversation: Conversation = {
  id: 'conv-rec-1',
  userId: 'user-1',
  title: 'Practical travel conversation',
  language: 'es',
  level: 'A2',
  nativeLanguage: 'en',
  topic: 'travel',
  scenario: 'Practical travel conversation',
  createdAt: '2026-10-28T12:00:00.000Z',
};

const recommendationCtx = {
  topic: 'travel' as const,
  scenario: 'Practical travel conversation',
  initialPrompt:
    'Practice Spanish travel phrases. Focus on checking into a hotel.',
  source: 'home_recommendation' as const,
};

describe('recommendation → chat launch (useChatLauncher)', () => {
  const apiRef = React.createRef<Launcher | null>() as React.MutableRefObject<Launcher | null>;

  beforeEach(async () => {
    jest.clearAllMocks();
    apiRef.current = null;
    mockRefreshSettings.mockResolvedValue(undefined);
    mockCreateConversation.mockResolvedValue(sampleConversation);

    await act(async () => {
      TestRenderer.create(<HookHost apiRef={apiRef} />);
    });
  });

  it('preserves home_recommendation source in practice context', () => {
    const normalized = normalizePracticeContext(recommendationCtx);
    expect(normalized?.source).toBe('home_recommendation');
    expect(normalized?.topic).toBe('travel');
    expect(normalized?.scenario).toBe('Practical travel conversation');
    expect(normalized?.initialPrompt).toContain('hotel');
  });

  it('refreshes settings before createConversation and passes topic/scenario/prompt only', async () => {
    const refreshGate = deferred<void>();
    const createGate = deferred<Conversation>();
    const order: string[] = [];

    mockRefreshSettings.mockImplementation(async () => {
      order.push('refresh:start');
      await refreshGate.promise;
      order.push('refresh:done');
    });
    mockCreateConversation.mockImplementation(async (body: unknown) => {
      order.push('create:start');
      expect(order).toContain('refresh:done');
      const result = await createGate.promise;
      order.push('create:done');
      return result;
    });

    let launchPromise!: Promise<void>;
    await act(async () => {
      launchPromise = apiRef.current!.startNewChat(recommendationCtx);
      await Promise.resolve();
    });

    expect(mockCreateConversation).not.toHaveBeenCalled();
    expect(order).toEqual(['refresh:start']);

    await act(async () => {
      refreshGate.resolve();
      await Promise.resolve();
      createGate.resolve(sampleConversation);
      await launchPromise;
    });

    expect(mockRefreshSettings).toHaveBeenCalledTimes(1);
    expect(mockCreateConversation).toHaveBeenCalledTimes(1);

    const createArg = mockCreateConversation.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(createArg.topic).toBe('travel');
    expect(createArg.scenario).toBe('Practical travel conversation');
    expect(createArg.title).toBe(recommendationCtx.initialPrompt.slice(0, 80));
    // Server owns language/level snapshot — client must not send overrides
    expect(createArg).not.toHaveProperty('language');
    expect(createArg).not.toHaveProperty('nativeLanguage');
    expect(createArg).not.toHaveProperty('level');
    expect(createArg).not.toHaveProperty('source');

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(
      PENDING_CHAT_PROMPT_KEY,
      JSON.stringify({
        conversationId: sampleConversation.id,
        prompt: recommendationCtx.initialPrompt,
      }),
    );

    expect(mockNavigate).toHaveBeenCalledWith(
      'Chat',
      expect.objectContaining({
        conversationId: sampleConversation.id,
        language: sampleConversation.language,
        level: sampleConversation.level,
        guided: true,
      }),
    );
    expect(order.indexOf('refresh:done')).toBeLessThan(
      order.indexOf('create:start'),
    );
  });

  it('ignores a second launch while the first create is in flight', async () => {
    const createGate = deferred<Conversation>();
    mockCreateConversation.mockImplementation(() => createGate.promise);

    let first!: Promise<void>;
    let second!: Promise<void>;
    await act(async () => {
      first = apiRef.current!.startNewChat(recommendationCtx);
      second = apiRef.current!.startNewChat({
        ...recommendationCtx,
        topic: 'grammar',
        source: 'home_recommendation',
      });
      await Promise.resolve();
    });

    expect(mockCreateConversation).toHaveBeenCalledTimes(1);

    await act(async () => {
      createGate.resolve(sampleConversation);
      await Promise.all([first, second]);
    });

    expect(mockCreateConversation).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it('resume navigates to the same conversationId without creating', async () => {
    const existing: Conversation = {
      ...sampleConversation,
      id: 'conv-existing',
      title: 'Earlier practice',
    };

    await act(async () => {
      apiRef.current!.resumeConversation(existing);
    });

    expect(mockCreateConversation).not.toHaveBeenCalled();
    expect(mockRefreshSettings).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('Chat', {
      conversationId: 'conv-existing',
      title: 'Earlier practice',
      language: existing.language,
      level: existing.level,
    });
  });
});
