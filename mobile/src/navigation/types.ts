export type AuthStackParamList = {
  Welcome: undefined;
  CreateAccount: undefined;
  SignIn: { resetSuccess?: boolean } | undefined;
  ForgotPassword: undefined;
  VerifyResetOtp: { email: string };
  ResetPassword:
    | { email?: string; resetToken?: string; token?: string }
    | undefined;
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
    language?: string;
    level?: string;
  };
  VocabularyDetail: { id: string };
  VocabularyReview: { language?: string } | undefined;
  PrivacyPolicy: undefined;
};

export type PendingChat = {
  conversationId: string;
  title?: string;
  guided?: boolean;
  language?: string;
  level?: string;
};
