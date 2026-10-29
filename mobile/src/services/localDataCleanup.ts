import AsyncStorage from '@react-native-async-storage/async-storage';
import { LAST_PRACTICE_KEY } from '../config/constants';
import { STREAK_COUNT_KEY } from './streakStorage';

/** Known legacy / unscoped keys that must not survive logout. */
const LEGACY_KEYS = [
  STREAK_COUNT_KEY,
  LAST_PRACTICE_KEY,
  '@ailanguage/access_token',
  '@ailanguage/refresh_token',
] as const;

const PROFILE_KEY_MARKERS = [
  '/profile/displayName/',
  '/profile/avatarUri/',
] as const;

function isProfileKey(key: string) {
  return PROFILE_KEY_MARKERS.some(marker => key.includes(marker));
}

type ClearLocalOptions = {
  /**
   * When false (default on logout), keep per-user display name + avatar so
   * signing back into the same account restores personal info.
   * Account deletion should pass true.
   */
  includeProfile?: boolean;
};

/** Clears non-secret local prefs. Tokens are cleared via tokenStorage.clearTokens. */
export async function clearLocalAppData(
  options: ClearLocalOptions = {},
): Promise<void> {
  const includeProfile = options.includeProfile === true;
  const keys = await AsyncStorage.getAllKeys();
  const appKeys = new Set(
    keys.filter(key => {
      if (!(key.startsWith('@ailanguage/') || key.startsWith('@fluentai/'))) {
        return false;
      }
      if (!includeProfile && isProfileKey(key)) {
        return false;
      }
      return true;
    }),
  );
  for (const key of LEGACY_KEYS) {
    appKeys.add(key);
  }
  if (appKeys.size > 0) {
    await AsyncStorage.removeMany([...appKeys]);
  }
}
