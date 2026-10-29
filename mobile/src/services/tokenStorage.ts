import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { TOKEN_STORAGE_KEY } from '../config/constants';

const ACCESS_SERVICE = 'com.fluentai.auth.access';
const REFRESH_SERVICE = 'com.fluentai.auth.refresh';

const baseOptions: Keychain.SetOptions = {
  accessible: Keychain.ACCESSIBLE.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  storage: Keychain.STORAGE_TYPE.AES_GCM_NO_AUTH,
};

async function setSecret(service: string, value: string): Promise<void> {
  const attempts: Keychain.SetOptions[] = [
    {
      ...baseOptions,
      service,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_HARDWARE,
    },
    {
      ...baseOptions,
      service,
      securityLevel: Keychain.SECURITY_LEVEL.SECURE_SOFTWARE,
    },
    {
      ...baseOptions,
      service,
      securityLevel: Keychain.SECURITY_LEVEL.ANY,
    },
  ];

  let lastError: unknown;
  for (const options of attempts) {
    try {
      const result = await Keychain.setGenericPassword('token', value, options);
      if (result) return;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to store token in Keychain');
}

async function getSecret(service: string): Promise<string | null> {
  try {
    const result = await Keychain.getGenericPassword({ service });
    if (!result) return null;
    return result.password;
  } catch {
    return null;
  }
}

async function deleteSecret(service: string): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service });
  } catch {
    // Already absent or platform reset failed — treat as cleared.
  }
}

/** One-shot: copy legacy AsyncStorage JWT into Keychain, then delete the old key. */
export async function migrateTokensFromAsyncStorage(): Promise<void> {
  const legacy = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (!legacy) return;

  const existing = await getSecret(ACCESS_SERVICE);
  if (!existing) {
    await setSecret(ACCESS_SERVICE, legacy);
  }

  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  return getSecret(ACCESS_SERVICE);
}

export async function getRefreshToken(): Promise<string | null> {
  return getSecret(REFRESH_SERVICE);
}

export async function setTokens(tokens: {
  accessToken: string;
  refreshToken?: string | null;
}): Promise<void> {
  await setSecret(ACCESS_SERVICE, tokens.accessToken);

  if (tokens.refreshToken) {
    await setSecret(REFRESH_SERVICE, tokens.refreshToken);
  } else if (tokens.refreshToken === null) {
    await deleteSecret(REFRESH_SERVICE);
  }

  // Ensure no plaintext copy remains in AsyncStorage after any write path.
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    deleteSecret(ACCESS_SERVICE),
    deleteSecret(REFRESH_SERVICE),
    AsyncStorage.removeItem(TOKEN_STORAGE_KEY),
  ]);
}
