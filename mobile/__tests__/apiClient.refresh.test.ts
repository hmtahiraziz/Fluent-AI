import axios from 'axios';
import {
  api,
  initApiClient,
  refreshAccessToken,
  registerUnauthorizedHandler,
  setAuthToken,
} from '../src/api/client';
import * as tokenStorage from '../src/services/tokenStorage';

jest.mock('../src/services/tokenStorage');
jest.mock('../src/config/constants', () => ({
  getDefaultApiBaseUrl: () => 'https://api.test',
  TOKEN_STORAGE_KEY: '@ailanguage/access_token',
}));

describe('api refresh interceptor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setAuthToken(null);
    (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue(null);
    (tokenStorage.getAccessToken as jest.Mock).mockResolvedValue(null);
    (tokenStorage.clearTokens as jest.Mock).mockResolvedValue(undefined);
    (tokenStorage.setTokens as jest.Mock).mockResolvedValue(undefined);
    (tokenStorage.migrateTokensFromAsyncStorage as jest.Mock).mockResolvedValue(
      undefined,
    );
  });

  it('dedupes concurrent refresh calls into one network request', async () => {
    (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue('refresh-1');

    let refreshCalls = 0;
    const postSpy = jest.spyOn(axios, 'post').mockImplementation(async () => {
      refreshCalls += 1;
      await new Promise<void>(resolve => setTimeout(resolve, 30));
      return {
        data: { accessToken: 'new-access', refreshToken: 'refresh-2' },
      };
    });

    const [first, second] = await Promise.all([
      refreshAccessToken(),
      refreshAccessToken(),
    ]);

    expect(first).toBe('new-access');
    expect(second).toBe('new-access');
    expect(refreshCalls).toBe(1);
    expect(tokenStorage.setTokens).toHaveBeenCalledTimes(1);
    expect(tokenStorage.setTokens).toHaveBeenCalledWith({
      accessToken: 'new-access',
      refreshToken: 'refresh-2',
    });

    postSpy.mockRestore();
  });

  it('clears tokens when refresh fails', async () => {
    (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue('bad-refresh');
    const postSpy = jest
      .spyOn(axios, 'post')
      .mockRejectedValue(new Error('invalid_grant'));

    const result = await refreshAccessToken();

    expect(result).toBeNull();
    expect(tokenStorage.clearTokens).toHaveBeenCalled();
    expect(api.defaults.headers.common.Authorization).toBeUndefined();

    postSpy.mockRestore();
  });

  it('returns null without network call when no refresh token is stored', async () => {
    (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue(null);
    const postSpy = jest.spyOn(axios, 'post');

    const result = await refreshAccessToken();

    expect(result).toBeNull();
    expect(postSpy).not.toHaveBeenCalled();
    postSpy.mockRestore();
  });

  it('initApiClient migrates then loads access token into Axios defaults', async () => {
    (tokenStorage.getAccessToken as jest.Mock).mockResolvedValue('from-keychain');

    await initApiClient();

    expect(tokenStorage.migrateTokensFromAsyncStorage).toHaveBeenCalled();
    expect(api.defaults.headers.common.Authorization).toBe(
      'Bearer from-keychain',
    );
  });

  it('forces sign-out via unauthorized handler when refresh yields null', async () => {
    const onUnauthorized = jest.fn();
    registerUnauthorizedHandler(onUnauthorized);
    (tokenStorage.getRefreshToken as jest.Mock).mockResolvedValue(null);

    // Trigger interceptor path: 401 with no refresh available.
    api.defaults.adapter = async config => {
      if ((config as { _retry?: boolean })._retry) {
        return {
          data: {},
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }
      const error = new axios.AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          data: { error: 'Invalid or expired token' },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        },
      );
      throw error;
    };

    await expect(api.get('/api/settings')).rejects.toBeTruthy();
    expect(tokenStorage.clearTokens).toHaveBeenCalled();
    expect(onUnauthorized).toHaveBeenCalled();

    // Restore default adapter for other suites.
    delete (api.defaults as { adapter?: unknown }).adapter;
  });
});
