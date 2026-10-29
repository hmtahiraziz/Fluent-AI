import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../Button';
import { CefrLevelCard } from './CefrLevelCard';
import { DailyGoalOptionCard } from './DailyGoalOptionCard';
import { FloatingInput } from './FloatingInput';
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
import { bottomChromePadding } from '../../theme/safeArea';
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
  const sheetMaxHeight = Dimensions.get('window').height * 0.94;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-ink/40">
        <View
          className="rounded-t-[32px] bg-canvas px-5 pt-3"
          style={{
            maxHeight: sheetMaxHeight,
            paddingBottom: bottomChromePadding(insets.bottom),
          }}>
          <View className="shrink-0 pb-3">
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
          </View>

          <KeyboardAwareScrollView
            bottomOffset={24}
            showsVerticalScrollIndicator={false}
            style={{ flexGrow: 0, flexShrink: 1 }}
            contentContainerStyle={{ paddingBottom: footer ? 16 : 20 }}
            keyboardShouldPersistTaps="handled">
            {children}
          </KeyboardAwareScrollView>

          {footer ? (
            <View
              className="shrink-0 border-t pt-4"
              style={{ borderColor: colors.borderLight, backgroundColor: colors.canvas }}>
              {footer}
            </View>
          ) : null}
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
          <Button title="Apply Changes" variant="lavender" onPress={applyChanges} />
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
          <View className="gap-3 p-2">
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
                embedded
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
            Tap <Text className="font-bold">Apply Changes</Text> to save your name and
            learning preferences to this account.
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

type PrivacyModalProps = {
  visible: boolean;
  onClose: () => void;
  onOpenPrivacyPolicy?: () => void;
  onDeleteAccount?: () => void;
};

export function PrivacyModal({
  visible,
  onClose,
  onOpenPrivacyPolicy,
  onDeleteAccount,
}: PrivacyModalProps) {
  return (
    <SettingsSheet visible={visible} title="Privacy & Security" onClose={onClose}>
      <Text className="mb-4 text-base leading-6 text-ink-muted">
        Conversations and vocabulary are stored with your account and used to personalize tutoring.
        AI replies are generated by a third-party language model.
      </Text>
      {[
        {
          title: 'Data storage',
          body: 'Messages and saved words are sent over HTTPS and tied to your account on our servers.',
        },
        {
          title: 'AI processing',
          body: 'After you consent, chat content is sent to our language model to generate tutor replies and corrections. Safety filters may block unsafe content.',
        },
        {
          title: 'Your control',
          body: 'You can delete vocabulary, log out (ending refresh sessions), or permanently delete your account.',
        },
        {
          title: 'Age',
          body: 'FluentAI is intended for users 13 and older (or the minimum digital consent age in your country).',
        },
      ].map(item => (
        <View
          key={item.title}
          className="mb-3 rounded-2xl px-4 py-4"
          style={{ backgroundColor: colors.surfaceContainerLow }}>
          <Text className="text-base font-bold text-ink">{item.title}</Text>
          <Text className="mt-1 text-sm leading-5 text-ink-muted">{item.body}</Text>
        </View>
      ))}
      {onOpenPrivacyPolicy ? (
        <Button
          title="View Privacy Policy"
          variant="outline"
          className="mt-2"
          onPress={onOpenPrivacyPolicy}
        />
      ) : null}
      <Button title="Got it" variant="lavender" className="mt-2" onPress={onClose} />
      {onDeleteAccount ? (
        <Button
          title="Delete account"
          variant="danger"
          className="mt-3"
          onPress={onDeleteAccount}
        />
      ) : null}
    </SettingsSheet>
  );
}

type DeleteAccountModalProps = {
  visible: boolean;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onConfirm: (password: string) => void;
};

export function DeleteAccountModal({
  visible,
  loading,
  error,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const [password, setPassword] = useState('');

  return (
    <SettingsSheet
      visible={visible}
      title="Delete account"
      onClose={() => {
        setPassword('');
        onClose();
      }}>
      <Text className="mb-4 text-base leading-6 text-ink-muted">
        This permanently deletes your account, chats, vocabulary, and sessions. This cannot be
        undone.
      </Text>
      {error ? (
        <Text className="mb-3 text-sm font-medium text-coral">{error}</Text>
      ) : null}
      <FloatingInput
        label="Password"
        secureTextEntry
        textContentType="password"
        autoComplete="password"
        value={password}
        onChangeText={setPassword}
        placeholder="Confirm with your password"
      />
      <Button
        title="Delete forever"
        variant="danger"
        loading={loading}
        disabled={!password || loading}
        className="mt-2"
        onPress={() => onConfirm(password)}
      />
    </SettingsSheet>
  );
}
