export type AuthStackParamList = {
  Welcome: undefined;
  CreateAccount: undefined;
  SignIn: undefined;
};

export type OnboardingStackParamList = {
  NativeLanguage: undefined;
  TargetLanguage: undefined;
  Motivation: undefined;
  Level: undefined;
  DailyGoal: undefined;
  PlanReady: undefined;
};

export type MainTabParamList = {
  Practice: undefined;
  Vocabulary: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Auth: undefined;
  Onboarding: undefined;
  Main: undefined;
  Chat: {
    conversationId: string;
    title?: string;
    guided?: boolean;
  };
};

export type PendingChat = {
  conversationId: string;
  title?: string;
  guided?: boolean;
};
