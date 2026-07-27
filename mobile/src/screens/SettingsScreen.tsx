import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as api from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES, type CefrLevel } from '../config/constants';
import { languageMeta } from '../config/constants';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { ErrorCard } from '../components/ui/ErrorCard';
import { LanguagePickerModal } from '../components/ui/LanguagePickerModal';
import { ProfileAvatar } from '../components/ui/ProfileAvatar';
import { StreakBadge } from '../components/ui/StreakBadge';
import {
  AppearanceModal,
  EmailNotificationsModal,
  PersonalInfoModal,
  PrivacyModal,
  type AppearanceOption,
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
import { loadLocalProfile } from '../services/profileStorage';
import { getStreakDisplay } from '../services/streakStorage';
import { colors } from '../theme/tokens';
import { softShadow } from '../theme/glass';

const APPEARANCE_KEY = '@ailanguage/appearance';
const NOTIFY_PRACTICE_KEY = '@ailanguage/notify_practice';
const NOTIFY_DIGEST_KEY = '@ailanguage/notify_digest';

type SettingsSnapshot = {
  targetLanguage: string;
  nativeLanguage: string;
  level: CefrLevel;
  dailyGoal: number;
  displayName: string;
  avatarUri: string | null;
  appearance: AppearanceOption;
  practiceReminders: boolean;
  weeklyDigest: boolean;
};

function ProfileHeaderBar({
  initials,
  avatarUri,
  name,
  streakLabel,
}: {
  initials: string;
  avatarUri: string | null;
  name: string;
  streakLabel: string;
}) {
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();

  return (
    <View
      className="flex-row items-center justify-between gap-2 bg-canvas"
      style={{
        marginTop: -(insets.top + 8),
        paddingTop: insets.top + 8,
        marginHorizontal: -horizontalPadding,
        paddingHorizontal: horizontalPadding,
        paddingBottom: 8,
      }}>
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <ProfileAvatar uri={avatarUri} initials={initials} name={name} size="sm" />
        <Text className="text-2xl font-bold text-brand">FluentAI</Text>
      </View>
      <StreakBadge label={streakLabel} />
    </View>
  );
}

function formatChatHours(conversationCount: number, dailyGoalMinutes: number) {
  const estimatedMinutes = conversationCount * Math.max(dailyGoalMinutes * 0.75, 5);
  const hours = estimatedMinutes / 60;
  if (hours < 1) return `${Math.round(estimatedMinutes)}m`;
  return `${hours.toFixed(1)}h`;
}

export function SettingsScreen() {
  const { user, logout, setSettings } = useAuth();
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState<SettingsSnapshot | null>(null);

  const [personalOpen, setPersonalOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [nativeOpen, setNativeOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [streakLabel, setStreakLabel] = useState('Start today');

  const [appearance, setAppearance] = useState<AppearanceOption>('Light');
  const [practiceReminders, setPracticeReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const currentSnapshot = useMemo<SettingsSnapshot>(
    () => ({
      targetLanguage,
      nativeLanguage,
      level,
      dailyGoal,
      displayName,
      avatarUri,
      appearance,
      practiceReminders,
      weeklyDigest,
    }),
    [
      targetLanguage,
      nativeLanguage,
      level,
      dailyGoal,
      displayName,
      avatarUri,
      appearance,
      practiceReminders,
      weeklyDigest,
    ],
  );

  const isDirty = useMemo(() => {
    if (!savedSnapshot) return false;
    return JSON.stringify(currentSnapshot) !== JSON.stringify(savedSnapshot);
  }, [currentSnapshot, savedSnapshot]);

  const loadPrefs = useCallback(async () => {
    const [app, practice, digest] = await Promise.all([
      AsyncStorage.getItem(APPEARANCE_KEY),
      AsyncStorage.getItem(NOTIFY_PRACTICE_KEY),
      AsyncStorage.getItem(NOTIFY_DIGEST_KEY),
    ]);
    const appearanceValue =
      app === 'Light' || app === 'Dark' || app === 'System' ? app : 'Light';
    const practiceValue = practice !== null ? practice === '1' : true;
    const digestValue = digest !== null ? digest === '1' : false;

    setAppearance(appearanceValue);
    setPracticeReminders(practiceValue);
    setWeeklyDigest(digestValue);

    return {
      appearance: appearanceValue as AppearanceOption,
      practiceReminders: practiceValue,
      weeklyDigest: digestValue,
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setLoading(true);
        setError('');
        try {
          const prefs = await loadPrefs();
          await reloadProfile();
          setStreakLabel(await getStreakDisplay());
          const profile = user?.id
            ? await loadLocalProfile(user.id)
            : { displayName: '', avatarUri: null };

          const [s, words, convos] = await Promise.all([
            api.fetchSettings(),
            api.fetchVocabulary(),
            api.fetchConversations(),
          ]);

          setTargetLanguage(s.targetLanguage);
          setNativeLanguage(s.nativeLanguage);
          setLevel(s.level as CefrLevel);
          setDailyGoal(s.dailyGoalMinutes);
          setWordCount(words.length);
          setConversationCount(convos.length);
          setSettings(s);

          const snapshot: SettingsSnapshot = {
            targetLanguage: s.targetLanguage,
            nativeLanguage: s.nativeLanguage,
            level: s.level as CefrLevel,
            dailyGoal: s.dailyGoalMinutes,
            displayName: profile.displayName,
            avatarUri: profile.avatarUri,
            appearance: prefs.appearance,
            practiceReminders: prefs.practiceReminders,
            weeklyDigest: prefs.weeklyDigest,
          };
          setSavedSnapshot(snapshot);
        } catch (e) {
          setError(getErrorMessage(e));
        } finally {
          setLoading(false);
        }
      })();
    }, [loadPrefs, reloadProfile, setSettings, user?.id]),
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

      await persistProfile({
        displayName: displayName.trim(),
        avatarUri,
      });

      await Promise.all([
        AsyncStorage.setItem(APPEARANCE_KEY, appearance),
        AsyncStorage.setItem(NOTIFY_PRACTICE_KEY, practiceReminders ? '1' : '0'),
        AsyncStorage.setItem(NOTIFY_DIGEST_KEY, weeklyDigest ? '1' : '0'),
      ]);

      setSavedSnapshot(currentSnapshot);
      setMessage('Changes saved successfully.');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  function applyPersonalInfo(draft: PersonalInfoDraft) {
    setDisplayName(draft.displayName);
    setNativeLanguage(draft.nativeLanguage);
    setTargetLanguage(draft.targetLanguage);
    setLevel(draft.level);
    setDailyGoal(draft.dailyGoal);
  }

  async function onEditAvatar() {
    try {
      await pickAvatar();
    } catch (e) {
      Alert.alert('Photo upload failed', getErrorMessage(e));
    }
  }

  const target = languageMeta(targetLanguage);
  const native = languageMeta(nativeLanguage);
  const progress = levelProgressPercent(level);
  const chatTime = formatChatHours(conversationCount, dailyGoal);

  const personalDraft: PersonalInfoDraft = {
    displayName,
    email: user?.email ?? '',
    nativeLanguage,
    targetLanguage,
    level,
    dailyGoal,
  };

  if (loading) {
    return (
      <Screen scroll hasTabBar header={<ProfileHeaderBar initials="?" avatarUri={null} name="Learner" streakLabel="Start today" />}>
        <SkeletonList count={4} />
      </Screen>
    );
  }

  return (
    <Screen
      scroll
      hasTabBar
      header={
        <ProfileHeaderBar initials={initials} avatarUri={avatarUri} name={resolvedName} streakLabel={streakLabel} />
      }>
      <View className="mb-8 items-center">
        <ProfileAvatar
          uri={avatarUri}
          initials={initials}
          name={resolvedName}
          size="lg"
          editable
          onEditPress={() => void onEditAvatar()}
        />
        <Text className="mt-4 text-[28px] font-bold text-ink">{resolvedName}</Text>
        <Text className="mt-1 text-base text-ink-muted">
          {native.label} to {target.label} • {levelDisplayName(level)}
        </Text>
      </View>

      <View className={`mb-6 gap-4 ${isTablet ? 'flex-row' : 'flex-row'}`}>
        <ProfileStatCard icon="📖" value={wordCount.toLocaleString()} label="Words Learned" />
        <ProfileStatCard icon="⏱️" value={chatTime} label="Total Chat Time" />
      </View>

      <View
        className="mb-6 overflow-hidden rounded-[24px] p-6"
        style={{ backgroundColor: colors.insight }}>
        <View className="mb-4 flex-row items-start justify-between">
          <View>
            <Text className="text-sm font-bold uppercase tracking-wider text-ink-muted">
              ✨ Learning Progress
            </Text>
            <Text className="mt-1 text-2xl font-bold text-ink">Level {level} Mastery</Text>
          </View>
          <View
            className="rounded-full px-3 py-1"
            style={{ backgroundColor: 'rgba(255,255,255,0.5)' }}>
            <Text className="text-xs font-bold text-ink">{progress}%</Text>
          </View>
        </View>
        <View
          className="mb-6 h-3 overflow-hidden rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${progress}%`, backgroundColor: colors.secondary }}
          />
        </View>
        <View className="flex-row gap-4">
          <View className="flex-1">
            <Text className="text-xs font-bold uppercase text-ink-muted">Daily Goal</Text>
            <Text className="text-lg font-medium text-ink">{dailyGoal} mins / day</Text>
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold uppercase text-ink-muted">Next Milestone</Text>
            <Text className="text-lg font-medium text-ink">{nextMilestone(level)}</Text>
          </View>
        </View>
      </View>

      <ProfileSection title="Account">
        <SettingsRow icon="👤" label="Personal Information" onPress={() => setPersonalOpen(true)} />
        <SettingsRow icon="✉️" label="Email Notifications" onPress={() => setEmailOpen(true)} />
      </ProfileSection>

      <ProfileSection title="Settings">
        <SettingsRow
          icon="🌐"
          label="Native Language"
          value={native.label}
          onPress={() => setNativeOpen(true)}
        />
        <SettingsRow
          icon="🌙"
          label="Appearance"
          value={appearance}
          onPress={() => setAppearanceOpen(true)}
        />
        <SettingsRow icon="🔒" label="Privacy & Security" onPress={() => setPrivacyOpen(true)} />
      </ProfileSection>

      {error ? <ErrorCard message={error} onRetry={() => void onSave()} /> : null}
      {message ? (
        <View className="mb-3 rounded-2xl bg-surface px-4 py-3" style={softShadow(4)}>
          <Text className="text-sm font-medium text-ink">{message}</Text>
        </View>
      ) : null}

      <Button
        title="Save Changes"
        variant="lavender"
        loading={saving}
        disabled={!isDirty || saving}
        onPress={() => void onSave()}
      />
      <Pressable
        onPress={() => void logout()}
        className="mt-3 mb-8 min-h-[52px] flex-row items-center justify-center gap-2 rounded-full border-2"
        style={{ borderColor: colors.border }}>
        <Text className="text-lg">↪</Text>
        <Text className="text-sm font-bold text-ink">Logout</Text>
      </Pressable>

      <PersonalInfoModal
        visible={personalOpen}
        draft={personalDraft}
        onApply={applyPersonalInfo}
        onClose={() => setPersonalOpen(false)}
      />

      <EmailNotificationsModal
        visible={emailOpen}
        practiceReminders={practiceReminders}
        weeklyDigest={weeklyDigest}
        onTogglePractice={setPracticeReminders}
        onToggleDigest={setWeeklyDigest}
        onClose={() => setEmailOpen(false)}
      />

      <LanguagePickerModal
        visible={nativeOpen}
        languages={LANGUAGES}
        selectedCode={nativeLanguage}
        onSelect={setNativeLanguage}
        onClose={() => setNativeOpen(false)}
      />

      <AppearanceModal
        visible={appearanceOpen}
        selected={appearance}
        onSelect={setAppearance}
        onClose={() => setAppearanceOpen(false)}
      />

      <PrivacyModal visible={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </Screen>
  );
}
