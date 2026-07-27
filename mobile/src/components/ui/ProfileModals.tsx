import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../Button';
import { CefrLevelCard } from './CefrLevelCard';
import { DailyGoalOptionCard } from './DailyGoalOptionCard';
import { LanguageOptionCard } from './LanguageOptionCard';
import { ProfileSection } from './ProfileSections';
import {
  CEFR_LEVELS,
  CEFR_LEVEL_META,
  DAILY_GOAL_OPTIONS,
  LANGUAGES,
  languageMeta,
  type CefrLevel,
} from '../../config/constants';
import { LanguagePickerModal } from './LanguagePickerModal';
import { colors } from '../../theme/tokens';

type SheetProps = {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

function SettingsSheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-ink/40">
        <View
          className="max-h-[94%] rounded-t-[32px] bg-canvas px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View className="mb-4 items-center">
            <View
              className="mb-4 h-1 w-10 rounded-full"
              style={{ backgroundColor: colors.border }}
            />
            <View className="w-full flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-2xl font-bold text-ink">{title}</Text>
                {subtitle ? (
                  <Text className="mt-1 text-base leading-6 text-ink-muted">{subtitle}</Text>
                ) : null}
              </View>
              <Pressable onPress={onClose} className="px-2 py-1">
                <Text className="text-base font-bold text-brand">Cancel</Text>
              </Pressable>
            </View>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
            {children}
          </ScrollView>
          {footer}
        </View>
      </View>
    </Modal>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-muted">
        {label}
      </Text>
      {children}
    </View>
  );
}

export type PersonalInfoDraft = {
  displayName: string;
  email: string;
  nativeLanguage: string;
  targetLanguage: string;
  level: CefrLevel;
  dailyGoal: number;
};

type PersonalInfoModalProps = {
  visible: boolean;
  draft: PersonalInfoDraft;
  onApply: (draft: PersonalInfoDraft) => void;
  onClose: () => void;
};

export function PersonalInfoModal({
  visible,
  draft,
  onApply,
  onClose,
}: PersonalInfoModalProps) {
  const [local, setLocal] = useState(draft);
  const [langPicker, setLangPicker] = useState<'native' | 'target' | null>(null);

  const native = languageMeta(local.nativeLanguage);
  const target = languageMeta(local.targetLanguage);

  useEffect(() => {
    if (visible) setLocal(draft);
  }, [visible, draft]);

  function applyChanges() {
    onApply(local);
    onClose();
  }

  return (
    <>
      <SettingsSheet
        visible={visible}
        title="Personal Information"
        subtitle="Update your profile and learning preferences."
        onClose={onClose}
        footer={
          <Button
            title="Apply Changes"
            variant="lavender"
            className="mt-4"
            onPress={applyChanges}
          />
        }>
        <ProfileSection title="Account">
          <View className="px-2 pb-2">
            <FormField label="Display name">
              <TextInput
                className="rounded-2xl border px-4 py-3.5 text-base text-ink"
                style={{
                  borderColor: colors.border,
                  backgroundColor: colors.surfaceContainerLow,
                }}
                value={local.displayName}
                onChangeText={displayName => setLocal(prev => ({ ...prev, displayName }))}
                placeholder="Your name"
                placeholderTextColor={colors.inkMuted}
                autoCapitalize="words"
              />
            </FormField>
            <FormField label="Email">
              <View
                className="flex-row items-center gap-3 rounded-2xl px-4 py-3.5"
                style={{ backgroundColor: colors.surfaceContainerLow }}>
                <Text className="text-lg">✉️</Text>
                <Text className="flex-1 text-base text-ink-muted" numberOfLines={1}>
                  {local.email}
                </Text>
              </View>
            </FormField>
          </View>
        </ProfileSection>

        <ProfileSection title="Languages">
          <View className="gap-3 p-2">
            <LanguageOptionCard
              label={native.label}
              nativeLabel="Native language"
              flag={native.flag}
              embedded
              onPress={() => setLangPicker('native')}
              trailing={<Text className="text-xl text-ink-faint">›</Text>}
            />
            <LanguageOptionCard
              label={target.label}
              nativeLabel="Learning language"
              flag={target.flag}
              embedded
              onPress={() => setLangPicker('target')}
              trailing={<Text className="text-xl text-ink-faint">›</Text>}
            />
          </View>
        </ProfileSection>

        <ProfileSection title="Learning level">
          <View className="p-2">
            {CEFR_LEVELS.map(level => {
              const meta = CEFR_LEVEL_META[level];
              return (
                <CefrLevelCard
                  key={level}
                  compact
                  level={level}
                  title={meta.title}
                  subtitle={meta.subtitle}
                  selected={local.level === level}
                  onPress={() => setLocal(prev => ({ ...prev, level }))}
                />
              );
            })}
          </View>
        </ProfileSection>

        <ProfileSection title="Daily goal">
          <View className="gap-3 p-2">
            {DAILY_GOAL_OPTIONS.map(option => (
              <DailyGoalOptionCard
                key={option.minutes}
                label={option.label}
                minutes={option.minutes}
                icon={option.icon}
                selected={local.dailyGoal === option.minutes}
                onPress={() => setLocal(prev => ({ ...prev, dailyGoal: option.minutes }))}
              />
            ))}
          </View>
        </ProfileSection>

        <View
          className="mb-2 mt-2 flex-row items-start gap-3 rounded-[24px] p-4"
          style={{ backgroundColor: colors.insight }}>
          <Text className="text-lg">💡</Text>
          <Text className="flex-1 text-sm leading-5 text-tertiary">
            Tap <Text className="font-bold">Save Changes</Text> on your profile to sync these
            updates with your account.
          </Text>
        </View>
      </SettingsSheet>

      <LanguagePickerModal
        visible={langPicker === 'native'}
        title="Native language"
        languages={LANGUAGES}
        selectedCode={local.nativeLanguage}
        onSelect={code => setLocal(prev => ({ ...prev, nativeLanguage: code }))}
        onClose={() => setLangPicker(null)}
      />
      <LanguagePickerModal
        visible={langPicker === 'target'}
        title="Learning language"
        languages={LANGUAGES}
        selectedCode={local.targetLanguage}
        onSelect={code => setLocal(prev => ({ ...prev, targetLanguage: code }))}
        onClose={() => setLangPicker(null)}
      />
    </>
  );
}

type EmailNotificationsModalProps = {
  visible: boolean;
  practiceReminders: boolean;
  weeklyDigest: boolean;
  onTogglePractice: (v: boolean) => void;
  onToggleDigest: (v: boolean) => void;
  onClose: () => void;
};

export function EmailNotificationsModal({
  visible,
  practiceReminders,
  weeklyDigest,
  onTogglePractice,
  onToggleDigest,
  onClose,
}: EmailNotificationsModalProps) {
  return (
    <SettingsSheet visible={visible} title="Email Notifications" onClose={onClose}>
      <Text className="mb-4 text-base leading-6 text-ink-muted">
        Choose which updates FluentAI sends to your inbox.
      </Text>
      <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-surface-container-low px-4 py-4">
        <View className="flex-1 pr-4">
          <Text className="text-base font-medium text-ink">Practice reminders</Text>
          <Text className="mt-1 text-sm text-ink-muted">Daily nudge to keep your streak</Text>
        </View>
        <Switch
          value={practiceReminders}
          onValueChange={onTogglePractice}
          trackColor={{ false: colors.border, true: colors.secondaryContainer }}
          thumbColor={colors.surface}
        />
      </View>
      <View className="mb-3 flex-row items-center justify-between rounded-2xl bg-surface-container-low px-4 py-4">
        <View className="flex-1 pr-4">
          <Text className="text-base font-medium text-ink">Weekly progress digest</Text>
          <Text className="mt-1 text-sm text-ink-muted">Summary of words and chat time</Text>
        </View>
        <Switch
          value={weeklyDigest}
          onValueChange={onToggleDigest}
          trackColor={{ false: colors.border, true: colors.secondaryContainer }}
          thumbColor={colors.surface}
        />
      </View>
      <Button title="Done" variant="lavender" className="mt-2" onPress={onClose} />
    </SettingsSheet>
  );
}

const APPEARANCE_OPTIONS = ['Light', 'Dark', 'System'] as const;
export type AppearanceOption = (typeof APPEARANCE_OPTIONS)[number];

type AppearanceModalProps = {
  visible: boolean;
  selected: AppearanceOption;
  onSelect: (option: AppearanceOption) => void;
  onClose: () => void;
};

export function AppearanceModal({ visible, selected, onSelect, onClose }: AppearanceModalProps) {
  return (
    <SettingsSheet visible={visible} title="Appearance" onClose={onClose}>
      <Text className="mb-4 text-base leading-6 text-ink-muted">
        Select how FluentAI looks on your device.
      </Text>
      {APPEARANCE_OPTIONS.map(option => (
        <Pressable
          key={option}
          onPress={() => onSelect(option)}
          className="mb-2 flex-row items-center justify-between rounded-2xl px-4 py-4"
          style={{
            backgroundColor:
              selected === option ? colors.primarySoft : colors.surfaceContainerLow,
          }}>
          <Text className="text-base font-medium text-ink">{option}</Text>
          {selected === option ? (
            <Text className="text-base font-bold text-brand">✓</Text>
          ) : null}
        </Pressable>
      ))}
      <Button title="Done" variant="lavender" className="mt-2" onPress={onClose} />
    </SettingsSheet>
  );
}

type PrivacyModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function PrivacyModal({ visible, onClose }: PrivacyModalProps) {
  return (
    <SettingsSheet visible={visible} title="Privacy & Security" onClose={onClose}>
      <Text className="mb-4 text-base leading-6 text-ink-muted">
        Your conversations and vocabulary are stored securely and used only to personalize your
        tutoring experience.
      </Text>
      {[
        {
          title: 'Data storage',
          body: 'Messages and saved words are encrypted in transit and tied to your account.',
        },
        {
          title: 'AI processing',
          body: 'Chat content is sent to our language model to generate tutor replies and corrections.',
        },
        {
          title: 'Your control',
          body: 'You can delete saved vocabulary anytime and log out to end your session.',
        },
      ].map(item => (
        <View
          key={item.title}
          className="mb-3 rounded-2xl border px-4 py-4"
          style={{ borderColor: colors.border, backgroundColor: colors.surfaceContainerLow }}>
          <Text className="text-base font-bold text-ink">{item.title}</Text>
          <Text className="mt-1 text-sm leading-5 text-ink-muted">{item.body}</Text>
        </View>
      ))}
      <Button title="Got it" variant="lavender" className="mt-2" onPress={onClose} />
    </SettingsSheet>
  );
}
