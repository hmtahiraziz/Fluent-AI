import AsyncStorage from '@react-native-async-storage/async-storage';

const DISPLAY_NAME_KEY = '@ailanguage/profile/displayName';
const AVATAR_URI_KEY = '@ailanguage/profile/avatarUri';

function scopedKey(base: string, userId: string) {
  return `${base}/${userId}`;
}

export type LocalProfile = {
  displayName: string;
  avatarUri: string | null;
};

export async function loadLocalProfile(userId: string): Promise<LocalProfile> {
  const [displayName, avatarUri] = await Promise.all([
    AsyncStorage.getItem(scopedKey(DISPLAY_NAME_KEY, userId)),
    AsyncStorage.getItem(scopedKey(AVATAR_URI_KEY, userId)),
  ]);

  return {
    displayName: displayName ?? '',
    avatarUri: avatarUri,
  };
}

export async function saveLocalProfile(
  userId: string,
  profile: Partial<LocalProfile>,
): Promise<LocalProfile> {
  const current = await loadLocalProfile(userId);
  const next: LocalProfile = {
    displayName: profile.displayName ?? current.displayName,
    avatarUri: profile.avatarUri !== undefined ? profile.avatarUri : current.avatarUri,
  };

  await Promise.all([
    AsyncStorage.setItem(scopedKey(DISPLAY_NAME_KEY, userId), next.displayName),
    next.avatarUri
      ? AsyncStorage.setItem(scopedKey(AVATAR_URI_KEY, userId), next.avatarUri)
      : AsyncStorage.removeItem(scopedKey(AVATAR_URI_KEY, userId)),
  ]);

  return next;
}
