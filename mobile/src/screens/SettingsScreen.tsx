import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as api from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES, type CefrLevel } from '../config/constants';
import { languageMeta } from '../config/constants';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { AppScreenHeader } from '../components/ui/AppScreenHeader';
import { ErrorCard } from '../components/ui/ErrorCard';
import { LanguagePickerModal } from '../components/ui/LanguagePickerModal';
import { ProfileAvatar } from '../components/ui/ProfileAvatar';
import {
  DeleteAccountModal,
  PersonalInfoModal,
  PrivacyModal,
  type PersonalInfoDraft,
} from '../components/ui/ProfileModals';
import {
  ProfileSection,
  ProfileStatCard,
  SettingsRow,
  levelDisplayName,
  levelProgressPercent,
  nextMilestone,
} from '../components/ui/ProfileSections';
import { SkeletonList } from '../components/ui/Shimmer';
import { useProfile } from '../hooks/useProfile';
import { useResponsive } from '../hooks/useResponsive';
import type { RootStackParamList } from '../navigation/types';
import { loadLocalProfile } from '../services/profileStorage';
import { getStreakDisplay } from '../services/streakStorage';
import { colors } from '../theme/tokens';
import { softShadow } from '../theme/glass';

type SettingsSnapshot = {
  targetLanguage: string;
  nativeLanguage: string;
  level: CefrLevel;
  dailyGoal: number;
  displayName: string;
  avatarUri: string | null;
};

function ProfileHeaderBar({ streakLabel }: { streakLabel: string }) {
  return (
    <AppScreenHeader
      title="Profile"
      subtitle="Account & learning prefs"
      streakLabel={streakLabel}
      showAvatar={false}
    />
  );
}

export function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout, deleteAccount, setSettings } = useAuth();
  const { isTablet } = useResponsive();
  const {
    displayName,
    setDisplayName,
    avatarUri,
    resolvedName,
    initials,
    reload: reloadProfile,
    persistProfile,
    pickAvatar,
  } = useProfile();

  const [targetLanguage, setTargetLanguage] = useState('es');
  const [nativeLanguage, setNativeLanguage] = useState('en');
  const [level, setLevel] = useState<CefrLevel>('A1');
  const [dailyGoal, setDailyGoal] = useState(10);
  const [wordCount, setWordCount] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState<SettingsSnapshot | null>(null);

  const [personalOpen, setPersonalOpen] = useState(false);
  const [nativeOpen, setNativeOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [streakLabel, setStreakLabel] = useState('Start today');
  const requestIdRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const isDirtyRef = useRef(false);

  const currentSnapshot = useMemo<SettingsSnapshot>(
    () => ({
      targetLanguage,
      nativeLanguage,
      level,
      dailyGoal,
      displayName,
      avatarUri,
    }),
    [targetLanguage, nativeLanguage, level, dailyGoal, displayName, avatarUri],
  );

  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    return JSON.stringify(currentSnapshot) !== JSON.stringify(savedSnapshot);
  }, [currentSnapshot, savedSnapshot]);

  isDirtyRef.current = isDirty;

  const loadProfileData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    if (hasLoadedRef.current) setRefreshing(true);
    setError('');

    try {
      await reloadProfile();
      if (requestId !== requestIdRef.current) return;

      const [streak, profile, s, vocabStats, convos] = await Promise.all([
        getStreakDisplay(user?.id),
        user?.id
          ? loadLocalProfile(user.id)
          : Promise.resolve({ displayName: '', avatarUri: null as string | null }),
        api.fetchSettings(),
        api.fetchVocabularyStats(),
        api.fetchConversations(),
      ]);
      if (requestId !== requestIdRef.current) return;

      setStreakLabel(streak);
      setWordCount(vocabStats.total);
      setConversationCount(convos.length);
      setSettings(s);

      const snapshot: SettingsSnapshot = {
        targetLanguage: s.targetLanguage,
        nativeLanguage: s.nativeLanguage,
        level: s.level as CefrLevel,
        dailyGoal: s.dailyGoalMinutes,
        displayName: profile.displayName,
        avatarUri: profile.avatarUri,
      };

      // Keep in-progress edits; still refresh counts/settings cache above.
      if (!isDirtyRef.current) {
        setTargetLanguage(s.targetLanguage);
        setNativeLanguage(s.nativeLanguage);
        setLevel(s.level as CefrLevel);
        setDailyGoal(s.dailyGoalMinutes);
        setSavedSnapshot(snapshot);
      }

      hasLoadedRef.current = true;
    } catch (e) {
      if (requestId !== requestIdRef.current) return;
      setError(getErrorMessage(e));
    } finally {
      if (requestId === requestIdRef.current) {
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  }, [reloadProfile, setSettings, user?.id]);

  useFocusEffect(
    useCallback(() => {
      void loadProfileData();
      return () => {
        requestIdRef.current += 1;
      };
    }, [loadProfileData]),
  );

  async function onSave() {
    if (!isDirty || saving) return;

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const s = await api.updateSettings({
        targetLanguage,
        nativeLanguage,
        level,
        dailyGoalMinutes: dailyGoal,
      });
      setSettings(s);

      const nextName = displayName.trim();
      await persistProfile({
        displayName: nextName,
        avatarUri,
      });

      setSavedSnapshot({
        targetLanguage: s.targetLanguage,
        nativeLanguage: s.nativeLanguage,
        level: s.level as CefrLevel,
        dailyGoal: s.dailyGoalMinutes,
        displayName: nextName,
        avatarUri,
      });
      setMessage('Changes saved successfully.');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  async function applyPersonalInfo(draft: PersonalInfoDraft) {
    const nextName = draft.displayName.trim();
    setDisplayName(nextName);
    setNativeLanguage(draft.nativeLanguage);
    setTargetLanguage(draft.targetLanguage);
    setLevel(draft.level);
    setDailyGoal(draft.dailyGoal);
    setError('');
    setMessage('');

    try {
      // Persist name locally and sync learning prefs to the server in one apply.
      const [s] = await Promise.all([
        api.updateSettings({
          targetLanguage: draft.targetLanguage,
          nativeLanguage: draft.nativeLanguage,
          level: draft.level,
          dailyGoalMinutes: draft.dailyGoal,
        }),
        persistProfile({ displayName: nextName }),
      ]);
      setSettings(s);
      setSavedSnapshot({
        targetLanguage: s.targetLanguage,
        nativeLanguage: s.nativeLanguage,
        level: s.level as CefrLevel,
        dailyGoal: s.dailyGoalMinutes,
        displayName: nextName,
        avatarUri,
      });
      setMessage('Profile updated.');
    } catch (e) {
      setError(getErrorMessage(e));
    }
  }

  async function onEditAvatar() {
    try {
      const uri = await pickAvatar();
      if (!uri) return;
      // Durable data-URI persist so the photo survives app restarts / re-login.
      await persistProfile({ avatarUri: uri });
      setSavedSnapshot(prev =>
        prev
          ? { ...prev, avatarUri: uri }
          : {
              targetLanguage,
              nativeLanguage,
              level,
              dailyGoal,
              displayName,
              avatarUri: uri,
            },
      );
      setMessage('Profile photo saved.');
    } catch (e) {
      Alert.alert('Photo upload failed', getErrorMessage(e));
    }
  }

  const target = languageMeta(targetLanguage);
  const native = languageMeta(nativeLanguage);
  const progress = levelProgressPercent(level);

  const personalDraft: PersonalInfoDraft = {
    displayName,
    email: user?.email ?? '',
    nativeLanguage,
    targetLanguage,
    level,
    dailyGoal,
  };

  if (initialLoading) {
    return (
      <Screen scroll hasTabBar header={<ProfileHeaderBar streakLabel="Start today" />}>
        <SkeletonList count={4} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      hasTabBar
      header={<ProfileHeaderBar streakLabel={streakLabel} />}>
      {refreshing ? (
        <View className="mb-3 flex-row items-center justify-center gap-2 py-1">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text className="text-xs font-medium text-ink-muted">Updating…</Text>
        </View>
      ) : null}

      {/* Identity hero — matches Home/Words card language */}
      <View
        className="mb-5 overflow-hidden rounded-[28px] px-5 pb-5 pt-6"
        style={[
          {
            backgroundColor: colors.insight,
            borderWidth: 1,
            borderColor: colors.insightBorder,
          },
          softShadow(2),
        ]}>
        <View
          className="absolute -right-8 -top-10 h-36 w-36 rounded-full"
          style={{ backgroundColor: 'rgba(90, 77, 190, 0.08)' }}
        />
        <View className="items-center">
          <ProfileAvatar
            uri={avatarUri}
            initials={initials}
            name={resolvedName}
            size="lg"
            editable
            onEditPress={() => void onEditAvatar()}
          />
          <Text className="mt-4 text-center text-[26px] font-extrabold text-ink">
            {resolvedName}
          </Text>
          {user?.email ? (
            <Text className="mt-1 text-center text-sm text-ink-muted" numberOfLines={1}>
              {user.email}
            </Text>
          ) : null}
          <View
            className="mt-3 flex-row items-center gap-2 rounded-full px-3.5 py-1.5"
            style={{ backgroundColor: colors.surface }}>
            <Text className="text-sm font-bold text-ink">
              {native.flag} {native.label}
            </Text>
            <Text className="text-sm font-bold" style={{ color: colors.secondary }}>
              →
            </Text>
            <Text className="text-sm font-bold text-ink">
              {target.flag} {target.label}
            </Text>
            <View
              className="ml-1 rounded-full px-2 py-0.5"
              style={{ backgroundColor: colors.primarySoft }}>
              <Text className="text-[11px] font-extrabold text-brand">{level}</Text>
            </View>
          </View>
          <Text className="mt-2 text-xs font-semibold text-ink-muted">
            {levelDisplayName(level)}
          </Text>
        </View>
      </View>

      <View className={`mb-5 gap-3 ${isTablet ? 'flex-row' : 'flex-row'}`}>
        <ProfileStatCard
          icon="📖"
          value={wordCount.toLocaleString()}
          label="Words"
          hint="From your library"
        />
        <ProfileStatCard
          icon="💬"
          value={conversationCount.toLocaleString()}
          label="Chats"
          hint="Practice threads"
        />
      </View>

      <View
        className="mb-5 overflow-hidden rounded-[24px] p-5"
        style={[
          {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderLight,
          },
          softShadow(1),
        ]}>
        <View className="mb-4 flex-row items-start justify-between gap-3">
          <View className="min-w-0 flex-1">
            <Text className="text-[11px] font-extrabold uppercase tracking-wider text-brand">
              Learning Progress
            </Text>
            <Text className="mt-1 text-xl font-extrabold text-ink">
              Level {level} · {levelDisplayName(level)}
            </Text>
          </View>
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: colors.primarySoft }}>
            <Text className="text-xs font-extrabold text-brand">{progress}%</Text>
          </View>
        </View>
        <View
          className="mb-5 h-2.5 overflow-hidden rounded-full"
          style={{ backgroundColor: colors.surfaceContainerHighest }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${progress}%`, backgroundColor: colors.secondary }}
          />
        </View>
        <View className="flex-row gap-3">
          <View
            className="min-w-0 flex-1 rounded-[16px] px-3 py-3"
            style={{ backgroundColor: colors.surfaceContainerLow }}>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              Daily Goal
            </Text>
            <Text className="mt-1 text-base font-extrabold text-ink">
              {dailyGoal} min
            </Text>
          </View>
          <View
            className="min-w-0 flex-1 rounded-[16px] px-3 py-3"
            style={{ backgroundColor: colors.phraseCard }}>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              Next Milestone
            </Text>
            <Text className="mt-1 text-base font-extrabold text-ink" numberOfLines={2}>
              {nextMilestone(level)}
            </Text>
          </View>
        </View>
      </View>

      <ProfileSection title="Account">
        <SettingsRow
          icon="👤"
          label="Personal Information"
          value={displayName.trim() || undefined}
          onPress={() => setPersonalOpen(true)}
        />
      </ProfileSection>

      <ProfileSection title="Learning">
        <SettingsRow
          icon="🌐"
          label="Native Language"
          value={native.label}
          onPress={() => setNativeOpen(true)}
        />
        <SettingsRow
          icon="🎯"
          label="Target & Level"
          value={`${target.label} · ${level}`}
          onPress={() => setPersonalOpen(true)}
        />
      </ProfileSection>

      <ProfileSection title="Privacy">
        <SettingsRow
          icon="🔒"
          label="Privacy & Security"
          onPress={() => setPrivacyOpen(true)}
        />
      </ProfileSection>

      {error ? (
        <View className="mb-3">
          <ErrorCard
            message={error}
            onRetry={() => void (isDirty ? onSave() : loadProfileData())}
          />
        </View>
      ) : null}
      {message ? (
        <View
          className="mb-3 rounded-[16px] px-4 py-3"
          style={{ backgroundColor: colors.primarySoft }}>
          <Text className="text-sm font-semibold text-ink">{message}</Text>
        </View>
      ) : null}
      {isDirty ? (
        <View
          className="mb-3 rounded-[16px] px-4 py-3"
          style={{
            backgroundColor: colors.insight,
            borderWidth: 1,
            borderColor: colors.insightBorder,
          }}>
          <Text className="text-sm font-semibold text-ink">
            You have unsaved learning preference changes.
          </Text>
        </View>
      ) : null}

      <Button
        title={saving ? 'Saving…' : 'Save Changes'}
        variant="lavender"
        loading={saving}
        disabled={!isDirty || saving}
        onPress={() => void onSave()}
      />
      <Pressable
        onPress={() => void logout()}
        accessibilityRole="button"
        accessibilityLabel="Log out"
        className="mt-3 mb-10 min-h-[52px] flex-row items-center justify-center gap-2 rounded-full"
        style={{
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderLight,
        }}>
        <Text className="text-base">↪</Text>
        <Text className="text-sm font-bold text-ink">Log out</Text>
      </Pressable>

      <PersonalInfoModal
        visible={personalOpen}
        draft={personalDraft}
        onApply={draft => {
          void applyPersonalInfo(draft);
        }}
        onClose={() => setPersonalOpen(false)}
      />

      <LanguagePickerModal
        visible={nativeOpen}
        languages={LANGUAGES}
        selectedCode={nativeLanguage}
        onSelect={setNativeLanguage}
        onClose={() => setNativeOpen(false)}
      />

      <PrivacyModal
        visible={privacyOpen}
        onClose={() => setPrivacyOpen(false)}
        onOpenPrivacyPolicy={() => {
          setPrivacyOpen(false);
          navigation.navigate('PrivacyPolicy');
        }}
        onDeleteAccount={() => {
          setPrivacyOpen(false);
          setDeleteError('');
          setDeleteOpen(true);
        }}
      />
      <DeleteAccountModal
        visible={deleteOpen}
        loading={deleting}
        error={deleteError}
        onClose={() => {
          if (deleting) return;
          setDeleteOpen(false);
          setDeleteError('');
        }}
        onConfirm={password => {
          void (async () => {
            setDeleting(true);
            setDeleteError('');
            try {
              await deleteAccount(password);
            } catch (e) {
              setDeleteError(getErrorMessage(e));
            } finally {
              setDeleting(false);
            }
          })();
        }}
      />
    </Screen>
  );
}
