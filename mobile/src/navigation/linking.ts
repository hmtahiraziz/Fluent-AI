import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

/** Custom scheme used in password-reset emails (`email.service.ts`). */
export const APP_LINK_SCHEME = 'fluentai';

export const linking: LinkingOptions<RootStackParamList> = {
  // Prefer HTTPS App Links (host must match APP_PUBLIC_URL / Digital Asset Links).
  prefixes: ['https://api.fluentai.app', `${APP_LINK_SCHEME}://`],
  config: {
    screens: {
      Auth: {
        screens: {
          Welcome: 'welcome',
          CreateAccount: 'create-account',
          SignIn: 'sign-in',
          ForgotPassword: 'forgot-password',
          VerifyResetOtp: 'verify-reset-otp',
          ResetPassword: 'reset-password',
        },
      },
      Onboarding: 'onboarding',
      Main: {
        screens: {
          Practice: 'practice',
          Vocabulary: 'vocabulary',
          Settings: 'settings',
        },
      },
      PrivacyPolicy: 'privacy',
      VocabularyDetail: 'vocabulary/:id',
      VocabularyReview: 'vocabulary-review',
      // Chat deep links intentionally omitted — conversation IDs must come from authenticated API flows.
    },
  },
};
