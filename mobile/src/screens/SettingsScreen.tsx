import React, { useCallback, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
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
import { FluentAIBrand } from '../components/brand/FluentAILogo';
import { ErrorCard } from '../components/ui/ErrorCard';
import { LanguagePickerModal } from '../components/ui/LanguagePickerModal';
import {
  AppearanceModal,
  EmailNotificationsModal,
  PersonalInfoModal,
  PrivacyModal,
  type AppearanceOption,
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
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/tokens';
import { softShadow } from '../theme/glass';

const APPEARANCE_KEY = '@ailanguage/appearance';
const NOTIFY_PRACTICE_KEY = '@ailanguage/notify_practice';
const NOTIFY_DIGEST_KEY = '@ailanguage/notify_digest';

function ProfileHeaderBar() {
  const insets = useSafeAreaInsets();
  const { horizontalPadding } = useResponsive();

  return (
    <View
      className="flex-row items-center justify-between bg-canvas"
      style={{
        marginTop: -(insets.top + 8),
        paddingTop: insets.top + 8,
        marginHorizontal: -horizontalPadding,
        paddingHorizontal: horizontalPadding,
        paddingBottom: 8,
      }}>
      <FluentAIBrand iconSize={40} />
      <Text className="text-sm font-bold text-brand">🔥 7 Days</Text>
    </View>
  );
}

function formatDisplayName(email?: string) {
  const raw = email?.split('@')[0] ?? 'Learner';
  return raw
    .split(/[._-]/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatChatHours(conversationCount: number, dailyGoalMinutes: number) {
  const estimatedMinutes = conversationCount * Math.max(dailyGoalMinutes * 0.75, 5);
  const hours = estimatedMinutes / 60;
  if (hours < 1) return `${Math.round(estimatedMinutes)}m`;
  return `${hours.toFixed(1)}h`;
}

export function SettingsScreen() {
  const { user, logout, settings, setSettings } = useAuth();
  const { isTablet } = useResponsive();
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

  const [personalOpen, setPersonalOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [nativeOpen, setNativeOpen] = useState(false);
  const [appearanceOpen, setAppearanceOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

  const [appearance, setAppearance] = useState<AppearanceOption>('Light');
  const [practiceReminders, setPracticeReminders] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  const loadPrefs = useCallback(async () => {
    const [app, practice, digest] = await Promise.all([
      AsyncStorage.getItem(APPEARANCE_KEY),
      AsyncStorage.getItem(NOTIFY_PRACTICE_KEY),
      AsyncStorage.getItem(NOTIFY_DIGEST_KEY),
    ]);
    if (app === 'Light' || app === 'Dark' || app === 'System') setAppearance(app);
    if (practice !== null) setPracticeReminders(practice === '1');
    if (digest !== null) setWeeklyDigest(digest === '1');
  }, []);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setLoading(true);
        try {
          await loadPrefs();
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
          setError('');
        } catch (e) {
          setError(getErrorMessage(e));
        } finally {
          setLoading(false);
        }
      })();
    }, [loadPrefs, setSettings]),
  );

  async function onSave() {
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
      await Promise.all([
        AsyncStorage.setItem(APPEARANCE_KEY, appearance),
        AsyncStorage.setItem(NOTIFY_PRACTICE_KEY, practiceReminders ? '1' : '0'),
        AsyncStorage.setItem(NOTIFY_DIGEST_KEY, weeklyDigest ? '1' : '0'),
      ]);
      setMessage('Changes saved successfully.');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const target = languageMeta(targetLanguage);
  const native = languageMeta(nativeLanguage);
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?';
  const displayName = formatDisplayName(user?.email);
  const progress = levelProgressPercent(level);
  const chatTime = formatChatHours(conversationCount, dailyGoal);

  if (loading) {
    return (
      <Screen scroll hasTabBar header={<ProfileHeaderBar />}>
        <SkeletonList count={4} />
      </Screen>
    );
  }

  return (
    <Screen scroll hasTabBar header={<ProfileHeaderBar />}>
      <View className="mb-8 items-center">
        <View className="relative">
          <View
            className="h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white"
            style={[softShadow(), { backgroundColor: colors.primarySoft }]}>
            <Text className="text-4xl font-bold text-brand">{initials}</Text>
          </View>
          <Pressable
            onPress={() => setPersonalOpen(true)}
            className="absolute bottom-1 right-0 h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.primary, ...softShadow(6) }}>
            <Text className="text-base text-white">✎</Text>
          </Pressable>
        </View>
        <Text className="mt-4 text-[28px] font-bold text-ink">{displayName}</Text>
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

      {error ? <ErrorCard message={error} onRetry={onSave} /> : null}
      {message ? (
        <View className="mb-3 rounded-2xl bg-surface px-4 py-3" style={softShadow(4)}>
          <Text className="text-sm font-medium text-ink">{message}</Text>
        </View>
      ) : null}

      <Button title="Save Changes" variant="lavender" loading={saving} onPress={onSave} />
      <Button
        title="Logout"
        variant="outline"
        className="mt-3 mb-8"
        onPress={() => void logout()}
      />

      <PersonalInfoModal
        visible={personalOpen}
        email={user?.email ?? ''}
        targetLanguage={targetLanguage}
        level={level}
        dailyGoal={dailyGoal}
        onChangeTarget={setTargetLanguage}
        onChangeLevel={setLevel}
        onChangeDailyGoal={setDailyGoal}
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
