import React from 'react';
import { Text, View } from 'react-native';
import type { WeeklyProgress } from '../../api/types';
import { ErrorCard } from '../ui/ErrorCard';
import { colors } from '../../theme/tokens';
import { softShadow } from '../../theme/glass';

type Props = {
  data: WeeklyProgress | null;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
};

function dayLabel(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate.slice(5);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString(undefined, { weekday: 'narrow' });
}

function isToday(isoDate: string): boolean {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return isoDate === key;
}

function MetricChip({
  label,
  value,
  tone = 'default',
  accessibilityLabel,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'lavender' | 'gold';
  accessibilityLabel: string;
}) {
  const bg =
    tone === 'lavender'
      ? colors.primarySoft
      : tone === 'gold'
        ? colors.phraseCard
        : colors.surfaceContainerLow;

  return (
    <View
      className="min-w-0 flex-1 rounded-[16px] px-2.5 py-2.5"
      style={{ backgroundColor: bg }}
      accessibilityLabel={accessibilityLabel}>
      <Text className="text-[9px] font-bold uppercase tracking-wider text-ink-faint">
        {label}
      </Text>
      <Text className="mt-1 text-base font-extrabold text-ink" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

export function WeeklyProgressCard({ data, loading, error, onRetry }: Props) {
  if (error && !data) {
    return (
      <View className="mb-5">
        <ErrorCard message={error} onRetry={onRetry} />
      </View>
    );
  }

  const totals = data?.totals;
  const successRate =
    data?.reviewSuccessRate == null
      ? '—'
      : `${Math.round(data.reviewSuccessRate * 100)}%`;
  const maxBar = Math.max(
    1,
    ...(data?.days.map(d => d.practiceMinutes) ?? [1]),
  );
  const hasAnyPractice = (totals?.practiceMinutes ?? 0) > 0;

  return (
    <View
      className="mb-5 overflow-hidden rounded-[24px] p-4"
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderLight,
        },
        softShadow(1),
      ]}
      accessibilityLabel="Weekly learning progress">
      <View
        className="absolute -left-10 -top-12 h-36 w-36 rounded-full"
        style={{ backgroundColor: 'rgba(90, 77, 190, 0.05)' }}
        pointerEvents="none"
      />

      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-[10px] font-extrabold uppercase tracking-wider text-brand">
            Weekly Progress
          </Text>
          <Text className="mt-1 text-sm font-medium text-ink-muted">
            Last 7 days · synced to your account
          </Text>
        </View>
        <View
          className="h-9 w-9 items-center justify-center rounded-[14px]"
          style={{ backgroundColor: colors.primarySoft }}>
          <Text className="text-base">📊</Text>
        </View>
      </View>

      {loading && !data ? (
        <View
          className="mt-4 rounded-[16px] px-4 py-6"
          style={{ backgroundColor: colors.surfaceContainerLow }}>
          <Text className="text-center text-sm font-medium text-ink-muted">
            Loading your week…
          </Text>
        </View>
      ) : (
        <>
          <View className="mt-4 flex-row gap-2">
            <MetricChip
              label="Practice"
              value={`${totals?.practiceMinutes ?? 0}m`}
              tone="lavender"
              accessibilityLabel={`${totals?.practiceMinutes ?? 0} practice minutes this week`}
            />
            <MetricChip
              label="Learned"
              value={String(totals?.wordsLearned ?? 0)}
              accessibilityLabel={`${totals?.wordsLearned ?? 0} words learned this week`}
            />
            <MetricChip
              label="Reviewed"
              value={String(totals?.wordsReviewed ?? 0)}
              accessibilityLabel={`${totals?.wordsReviewed ?? 0} words reviewed this week`}
            />
            <MetricChip
              label="Success"
              value={successRate}
              tone="gold"
              accessibilityLabel={
                data?.reviewSuccessRate == null
                  ? 'Review success rate unavailable'
                  : `Review success rate ${successRate}`
              }
            />
          </View>

          <View
            className="mt-4 rounded-[18px] px-3 pb-3 pt-4"
            style={{ backgroundColor: colors.surfaceContainerLow }}>
            <View className="mb-3 flex-row items-center justify-between px-1">
              <Text className="text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                Practice minutes
              </Text>
              <Text className="text-[10px] font-semibold text-ink-muted">
                {hasAnyPractice ? `${totals?.practiceMinutes ?? 0}m total` : 'No practice yet'}
              </Text>
            </View>

            <View
              className="flex-row items-end justify-between gap-1.5"
              accessible
              accessibilityLabel="Seven day practice minutes chart"
              style={{ minHeight: 72 }}>
              {(data?.days ?? []).map(day => {
                const active = day.practiceMinutes > 0;
                const today = isToday(day.date);
                const height = Math.max(
                  active ? 10 : 6,
                  Math.round((day.practiceMinutes / maxBar) * 56),
                );
                return (
                  <View key={day.date} className="min-w-0 flex-1 items-center">
                    <View
                      className="w-full max-w-[26px] rounded-t-[8px]"
                      style={{
                        height,
                        backgroundColor: today
                          ? colors.secondary
                          : active
                            ? colors.lavender
                            : colors.borderLight,
                      }}
                      accessibilityLabel={`${dayLabel(day.date)}: ${day.practiceMinutes} minutes`}
                    />
                    <Text
                      className="mt-1.5 text-[10px] font-bold"
                      style={{
                        color: today ? colors.secondary : colors.inkMuted,
                      }}>
                      {dayLabel(day.date)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <Text className="mt-3 text-[10px] leading-4 text-ink-faint">
            Review Success Rate = Good or Easy ratings · not a proficiency score
          </Text>
        </>
      )}

      {error && data ? (
        <View className="mt-3">
          <ErrorCard message={error} onRetry={onRetry} />
        </View>
      ) : null}
    </View>
  );
}
