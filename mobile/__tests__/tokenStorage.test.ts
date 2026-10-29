import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { TOKEN_STORAGE_KEY } from '../src/config/constants';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  migrateTokensFromAsyncStorage,
  setTokens,
} from '../src/services/tokenStorage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest').default,
);

const store: Record<string, string> = {};

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AccessibleAfterFirstUnlockThisDeviceOnly',
  },
  SECURITY_LEVEL: {
    SECURE_HARDWARE: 2,
    SECURE_SOFTWARE: 1,
    ANY: 0,
  },
  STORAGE_TYPE: {
    AES_GCM_NO_AUTH: 'KeystoreAESGCM_NoAuth',
  },
  setGenericPassword: jest.fn(
    async (_username: string, password: string, options?: { service?: string }) => {
      const service = options?.service ?? 'default';
      store[service] = password;
      return { service, storage: 'KeystoreAESGCM_NoAuth' };
    },
  ),
  getGenericPassword: jest.fn(async (options?: { service?: string }) => {
    const service = options?.service ?? 'default';
    const password = store[service];
    if (!password) return false;
    return {
      username: 'token',
      password,
      service,
      storage: 'KeystoreAESGCM_NoAuth',
    };
  }),
  resetGenericPassword: jest.fn(async (options?: { service?: string }) => {
    const service = options?.service ?? 'default';
    delete store[service];
    return true;
  }),
}));

describe('tokenStorage', () => {
  beforeEach(async () => {
    Object.keys(store).forEach(key => delete store[key]);
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  it('migrates AsyncStorage token once and deletes the legacy key', async () => {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, 'legacy-jwt');

    await migrateTokensFromAsyncStorage();

    expect(await getAccessToken()).toBe('legacy-jwt');
    expect(await AsyncStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(Keychain.setGenericPassword).toHaveBeenCalled();
  });

  it('does not overwrite an existing Keychain access token during migrate', async () => {
    await setTokens({ accessToken: 'keychain-jwt' });
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, 'legacy-jwt');

    await migrateTokensFromAsyncStorage();

    expect(await getAccessToken()).toBe('keychain-jwt');
    expect(await AsyncStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('stores access and refresh tokens in Keychain and strips AsyncStorage', async () => {
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, 'stale');
    await setTokens({ accessToken: 'access-1', refreshToken: 'refresh-1' });

    expect(await getAccessToken()).toBe('access-1');
    expect(await getRefreshToken()).toBe('refresh-1');
    expect(await AsyncStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });

  it('clearTokens removes Keychain secrets and any legacy AsyncStorage key', async () => {
    await setTokens({ accessToken: 'a', refreshToken: 'r' });
    await AsyncStorage.setItem(TOKEN_STORAGE_KEY, 'stale');

    await clearTokens();

    expect(await getAccessToken()).toBeNull();
    expect(await getRefreshToken()).toBeNull();
    expect(await AsyncStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
  });
});
