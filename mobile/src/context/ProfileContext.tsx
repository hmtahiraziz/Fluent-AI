import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAuth } from './AuthContext';
import { loadLocalProfile, saveLocalProfile } from '../services/profileStorage';
import { formatDisplayName, getInitials } from '../utils/profile';

type ProfileState = {
  displayName: string;
  setDisplayName: (name: string) => void;
  avatarUri: string | null;
  resolvedName: string;
  initials: string;
  loading: boolean;
  reload: () => Promise<void>;
  persistProfile: (patch: { displayName?: string; avatarUri?: string | null }) => Promise<void>;
  pickAvatar: () => Promise<string | null>;
};

const ProfileContext = createContext<ProfileState | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id;
  const [displayName, setDisplayName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!userId) {
      setDisplayName('');
      setAvatarUri(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const profile = await loadLocalProfile(userId);
      setDisplayName(profile.displayName);
      setAvatarUri(profile.avatarUri);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const resolvedName = useMemo(
    () => formatDisplayName(user?.email, displayName),
    [displayName, user?.email],
  );

  const initials = useMemo(
    () => getInitials(resolvedName, user?.email),
    [resolvedName, user?.email],
  );

  const persistProfile = useCallback(
    async (patch: { displayName?: string; avatarUri?: string | null }) => {
      if (!userId) return;
      const saved = await saveLocalProfile(userId, patch);
      setDisplayName(saved.displayName);
      setAvatarUri(saved.avatarUri);
    },
    [userId],
  );

  const pickAvatar = useCallback(async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.85,
      maxWidth: 640,
      maxHeight: 640,
      selectionLimit: 1,
    });

    if (result.didCancel || result.errorCode || !result.assets?.[0]?.uri) {
      return null;
    }

    const uri = result.assets[0].uri;
    setAvatarUri(uri);
    return uri;
  }, []);

  const value = useMemo(
    () => ({
      displayName,
      setDisplayName,
      avatarUri,
      resolvedName,
      initials,
      loading,
      reload,
      persistProfile,
      pickAvatar,
    }),
    [
      displayName,
      avatarUri,
      resolvedName,
      initials,
      loading,
      reload,
      persistProfile,
      pickAvatar,
    ],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
