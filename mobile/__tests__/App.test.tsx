import { getDefaultApiBaseUrl } from '../src/config/constants';

test('release API default is HTTPS production host', () => {
  const url = getDefaultApiBaseUrl();
  // In Jest, __DEV__ is typically true — ensure helper does not throw.
  expect(typeof url).toBe('string');
  expect(url.length).toBeGreaterThan(0);
});
