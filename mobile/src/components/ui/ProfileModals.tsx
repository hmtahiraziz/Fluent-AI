import React from 'react';
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
import { LevelPickerHorizontal } from './ProfileSections';
import { CEFR_LEVELS, LANGUAGES, type CefrLevel } from '../../config/constants';
import { languageMeta } from '../../config/constants';
import { LanguagePickerModal } from './LanguagePickerModal';
import { colors } from '../../theme/tokens';

type SheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

function SettingsSheet({ visible, title, onClose, children }: SheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-ink/40">
        <View
          className="max-h-[90%] rounded-t-[32px] bg-surface px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-ink">{title}</Text>
            <Pressable onPress={onClose} className="px-2 py-1">
              <Text className="text-base font-bold text-brand">Done</Text>
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
        </View>
      </View>
    </Modal>
  );
}

type PersonalInfoModalProps = {
  visible: boolean;
  email: string;
  targetLanguage: string;
  level: CefrLevel;
  dailyGoal: number;
  onChangeTarget: (code: string) => void;
  onChangeLevel: (level: CefrLevel) => void;
  onChangeDailyGoal: (minutes: number) => void;
  onClose: () => void;
};

export function PersonalInfoModal({
  visible,
  email,
  targetLanguage,
  level,
  dailyGoal,
  onChangeTarget,
  onChangeLevel,
  onChangeDailyGoal,
  onClose,
}: PersonalInfoModalProps) {
  const [langOpen, setLangOpen] = React.useState(false);
  const target = languageMeta(targetLanguage);

  return (
    <>
      <SettingsSheet visible={visible} title="Personal Information" onClose={onClose}>
        <Text className="mb-2 ml-1 text-sm font-bold text-ink-muted">Email</Text>
        <TextInput
          className="mb-4 rounded-full border border-border bg-white px-5 py-3 text-base text-ink-muted"
          value={email}
          editable={false}
        />
        <Text className="mb-2 ml-1 text-sm font-bold text-ink-muted">Target language</Text>
        <Pressable
          onPress={() => setLangOpen(true)}
          className="mb-4 flex-row items-center justify-between rounded-full border border-border bg-white px-5 py-3">
          <Text className="text-base text-ink">
            {target.flag} {target.label}
          </Text>
          <Text className="text-lg text-ink-faint">›</Text>
        </Pressable>
        <Text className="mb-2 ml-1 text-sm font-bold text-ink-muted">Learning level</Text>
        <LevelPickerHorizontal selected={level} levels={CEFR_LEVELS} onSelect={onChangeLevel} />
        <Text className="mb-2 ml-1 text-sm font-bold text-ink-muted">Daily goal (minutes)</Text>
        <View className="mb-4 flex-row flex-wrap gap-2">
          {[5, 10, 15, 20].map(m => (
            <Pressable
              key={m}
              onPress={() => onChangeDailyGoal(m)}
              className="rounded-full px-5 py-2"
              style={{
                backgroundColor:
                  dailyGoal === m ? colors.secondaryContainer : colors.surfaceContainer,
              }}>
              <Text
                className="text-sm font-bold"
                style={{
                  color: dailyGoal === m ? colors.onSecondaryContainer : colors.inkMuted,
                }}>
                {m} min
              </Text>
            </Pressable>
          ))}
        </View>
      </SettingsSheet>
      <LanguagePickerModal
        visible={langOpen}
        languages={LANGUAGES}
        selectedCode={targetLanguage}
        onSelect={onChangeTarget}
        onClose={() => setLangOpen(false)}
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
