import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as api from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  APP_NAME,
  CEFR_LEVELS,
  LANGUAGES,
  type CefrLevel,
} from '../config/constants';
import { languageMeta } from '../config/constants';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { FluentAILogo } from '../components/brand/FluentAILogo';
import { ErrorCard } from '../components/ui/ErrorCard';
import { GlassCard } from '../components/ui/GlassCard';
import { LanguagePickerModal } from '../components/ui/LanguagePickerModal';
import {
  LevelPickerHorizontal,
  ProfileSection,
  SettingsRow,
} from '../components/ui/ProfileSections';
import { SkeletonList } from '../components/ui/Shimmer';
import { SplitHeadline } from '../components/ui/SplitHeadline';
import { useResponsive } from '../hooks/useResponsive';
import { colors } from '../theme/tokens';
import { softShadow } from '../theme/glass';

export function SettingsScreen() {
  const { user, logout, settings, setSettings } = useAuth();
  const { isTablet } = useResponsive();
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [level, setLevel] = useState<CefrLevel>('A1');
  const [wordCount, setWordCount] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [langModalOpen, setLangModalOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void (async () => {
        setLoading(true);
        try {
          const [s, words, convos] = await Promise.all([
            api.fetchSettings(),
            api.fetchVocabulary(),
            api.fetchConversations(),
          ]);
          setTargetLanguage(s.targetLanguage);
          setLevel(s.level as CefrLevel);
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
    }, [setSettings]),
  );

  async function onSave() {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const s = await api.updateSettings({ targetLanguage, level });
      setSettings(s);
      setMessage('Settings saved!');
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  }

  const target = languageMeta(targetLanguage);
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '?';
  const dailyGoal = settings?.dailyGoalMinutes ?? 10;

  if (loading) {
    return (
      <Screen scroll hasTabBar>
        <SplitHeadline primary="Your" accent="profile" />
        <SkeletonList count={3} />
      </Screen>
    );
  }

  return (
    <Screen scroll hasTabBar>
      <SplitHeadline primary="Your" accent="profile" />

      <ProfileSection title="Account">
        <GlassCard>
          <View className="flex-row items-center gap-4">
            <View
              className="h-16 w-16 items-center justify-center rounded-2xl"
              style={[{ backgroundColor: colors.primary }, softShadow(4)]}>
              <Text className="text-xl font-bold text-white">{initials}</Text>
            </View>
            <View className="flex-1">
              {user?.email ? (
                <Text className="text-base font-bold text-ink">{user.email}</Text>
              ) : null}
              <Text className="mt-1 text-sm text-ink-muted">
                {target.flag} {target.label} · {level}
              </Text>
            </View>
          </View>
        </GlassCard>
      </ProfileSection>

      <ProfileSection title="Learning preferences">
        <SettingsRow
          label="Target language"
          value={`${target.flag} ${target.label}`}
          onPress={() => setLangModalOpen(true)}
        />
        <View className="mt-3">
          <Text className="mb-3 text-sm font-semibold text-ink-muted">CEFR level</Text>
          <LevelPickerHorizontal
            selected={level}
            levels={CEFR_LEVELS}
            onSelect={setLevel}
          />
        </View>
        <View className="mt-3">
          <SettingsRow label="Daily goal" value={`${dailyGoal} min / day`} />
        </View>
      </ProfileSection>

      <ProfileSection title="Statistics">
        <View className={`gap-3 ${isTablet ? 'flex-row' : ''}`}>
          <GlassCard className="flex-1" tint="lavender">
            <Text className="text-xs font-bold uppercase text-ink-muted">Words saved</Text>
            <Text className="mt-2 text-3xl font-extrabold text-ink">{wordCount}</Text>
          </GlassCard>
          <GlassCard className="flex-1" tint="lavender">
            <Text className="text-xs font-bold uppercase text-ink-muted">Conversations</Text>
            <Text className="mt-2 text-3xl font-extrabold text-ink">{conversationCount}</Text>
          </GlassCard>
        </View>
      </ProfileSection>

      <ProfileSection title="Settings">
        <SettingsRow label="Notifications" value="Coming soon" />
        <View className="mt-2">
          <SettingsRow label="App language" value="English" />
        </View>
      </ProfileSection>

      <ProfileSection title="About">
        <GlassCard tint="lavender">
          <FluentAILogo variant="wordmark" />
          <Text className="mt-3 text-sm leading-6 text-ink-muted">
            {APP_NAME} — your personal AI language tutor. Practice conversations, save vocabulary,
            and build fluency at your own pace.
          </Text>
          <Text className="mt-3 text-xs text-ink-faint">Version 1.0.0</Text>
        </GlassCard>
      </ProfileSection>

      <ProfileSection title="Support">
        <SettingsRow label="Help center" value="Coming soon" />
        <View className="mt-2">
          <SettingsRow label="Send feedback" value="Coming soon" />
        </View>
      </ProfileSection>

      {error ? <ErrorCard message={error} onRetry={onSave} /> : null}
      {message ? (
        <Text className="mb-3 text-sm font-bold text-brand">{message}</Text>
      ) : null}

      <Button title="Save changes" variant="lavender" loading={saving} onPress={onSave} />
      <Button
        title="Log out"
        variant="outline"
        className="mt-3 mb-6"
        onPress={() => void logout()}
      />

      <LanguagePickerModal
        visible={langModalOpen}
        languages={LANGUAGES}
        selectedCode={targetLanguage}
        onSelect={setTargetLanguage}
        onClose={() => setLangModalOpen(false)}
      />
    </Screen>
  );
}
