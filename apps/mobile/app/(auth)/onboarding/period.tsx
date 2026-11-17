import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/store/onboardingStore';
import { PeriodSchema, type PeriodInput } from '@/schemas/onboarding';
import { StepContainer } from '@/components/onboarding/StepContainer';
import { StepButtons } from '@/components/onboarding/StepButtons';

const TOTAL_STEPS = 6;
const DEFAULT_CYCLE_LENGTH = 28;

const QUICK_OFFSETS = [
  { label: 'Bugün', daysAgo: 0 },
  { label: 'Dün', daysAgo: 1 },
  { label: '3 gün önce', daysAgo: 3 },
  { label: '1 hafta önce', daysAgo: 7 },
  { label: '2 hafta önce', daysAgo: 14 },
];

function createOffsetDate(daysAgo: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function daysBetween(start: Date, end: Date): number {
  const s = new Date(start);
  const e = new Date(end);
  s.setHours(0, 0, 0, 0);
  e.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)));
}

function isSameDay(a?: Date | null, b?: Date | null): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function PeriodStep() {
  const router = useRouter();
  const theme = useTheme();
  const { data, updateData, completeStep, setCurrentStep } = useOnboardingStore();

  const [showDatePicker, setShowDatePicker] = useState(false);

  const initialPeriodDate = data.lastPeriodDate
    ? new Date(data.lastPeriodDate)
    : undefined;
  const validInitialPeriodDate =
    initialPeriodDate && !Number.isNaN(initialPeriodDate.getTime())
      ? initialPeriodDate
      : undefined;

  const {
    control,
    handleSubmit,
    watch,
    setValue,
  } = useForm<PeriodInput>({
    resolver: zodResolver(PeriodSchema),
    defaultValues: {
      lastPeriodDate: validInitialPeriodDate,
    },
  });

  const watchedDate = watch('lastPeriodDate');
  const selectedDate =
    watchedDate instanceof Date
      ? watchedDate
      : watchedDate
      ? new Date(watchedDate)
      : undefined;
  const hasValidDate = Boolean(
    selectedDate && !Number.isNaN(selectedDate.getTime())
  );

  useEffect(() => {
    setCurrentStep(2);
  }, []);

  const onSubmit = async (formData: PeriodInput) => {
    await updateData({
      lastPeriodDate: formData.lastPeriodDate,
    });

    completeStep(2);
    router.push('/(auth)/onboarding/privacy');
  };

  const handleSkip = async () => {
    await updateData({ lastPeriodDate: undefined });
    completeStep(2);
    router.push('/(auth)/onboarding/privacy');
  };

  const handleBack = () => {
    router.back();
  };

  const estimatedNextDate =
    hasValidDate && selectedDate
      ? (() => {
          const next = new Date(selectedDate);
          next.setDate(next.getDate() + DEFAULT_CYCLE_LENGTH);
          return next;
        })()
      : null;

  const cycleDay =
    hasValidDate && selectedDate ? daysBetween(selectedDate, new Date()) + 1 : null;

  const styles = createStyles(theme);

  return (
    <StepContainer
      currentStep={2}
      totalSteps={TOTAL_STEPS}
      headerIcon="calendar-outline"
      title="Adet Takibi"
      subtitle="Son adet başlangıç tarihini girerek takvim ve faz tahminlerini kişiselleştir."
      onBack={handleBack}
      onSkip={handleSkip}
      skipLabel="Atla"
    >
      <View style={styles.content}>
        {/* Quick Select Chips */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hızlı Seçim</Text>
          <Text style={styles.cardHint}>
            Hatırlıyorsan tek dokunuşla seçebilir veya takvimden tam günü belirleyebilirsin.
          </Text>

          <View style={styles.chipsWrap}>
            {QUICK_OFFSETS.map((item) => {
              const targetDate = createOffsetDate(item.daysAgo);
              const active = hasValidDate && isSameDay(selectedDate, targetDate);

              return (
                <TouchableOpacity
                  key={item.label}
                  activeOpacity={0.8}
                  onPress={() => {
                    setValue('lastPeriodDate', targetDate, { shouldValidate: true });
                    setShowDatePicker(false);
                  }}
                  style={[styles.quickChip, active && styles.quickChipActive]}
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      active && styles.quickChipTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Date Picker Field */}
          <Controller
            control={control}
            name="lastPeriodDate"
            render={({ field: { onChange, value } }) => {
              const dateObj =
                value instanceof Date
                  ? value
                  : value
                  ? new Date(value)
                  : undefined;
              const isValidDateObj = Boolean(
                dateObj && !Number.isNaN(dateObj.getTime())
              );

              return (
                <>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.dateShell,
                      isValidDateObj && styles.dateShellActive,
                    ]}
                    onPress={() =>
                      setShowDatePicker((prev) =>
                        Platform.OS === 'ios' ? !prev : true
                      )
                    }
                  >
                    <View style={styles.dateLeft}>
                      <View style={styles.dateIconBox}>
                        <Ionicons
                          name="calendar"
                          size={18}
                          color={
                            isValidDateObj
                              ? theme.colors.primary
                              : theme.colors.textSecondary
                          }
                        />
                      </View>
                      <View>
                        <Text style={styles.dateFieldCaption}>
                          Son Adet Başlangıcı
                        </Text>
                        <Text
                          style={
                            isValidDateObj
                              ? styles.dateValueText
                              : styles.datePlaceholder
                          }
                        >
                          {isValidDateObj && dateObj
                            ? dateObj.toLocaleDateString('tr-TR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })
                            : 'Takvimden tarih seç'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.dateActionPill}>
                      <Text style={styles.dateActionText}>
                        {isValidDateObj ? 'Değiştir' : 'Seç'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {showDatePicker && (
                    <View style={styles.datePickerContainer}>
                      <DateTimePicker
                        value={dateObj || new Date()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        themeVariant={theme.isDark ? 'dark' : 'light'}
                        textColor={theme.colors.text}
                        accentColor={theme.colors.primary}
                        locale="tr-TR"
                        maximumDate={new Date()}
                        onChange={(_event, selected) => {
                          if (Platform.OS !== 'ios') {
                            setShowDatePicker(false);
                          }
                          if (selected) {
                            onChange(selected);
                          }
                        }}
                      />
                    </View>
                  )}
                </>
              );
            }}
          />
        </View>

        {/* Live Cycle Prediction Card */}
        {hasValidDate && estimatedNextDate ? (
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <View style={styles.previewBadge}>
                <Ionicons name="sparkles" size={14} color={theme.colors.primary} />
                <Text style={styles.previewBadgeText}>İLK TAHMİN HAZIR</Text>
              </View>
              <TouchableOpacity
                onPress={() => setValue('lastPeriodDate', undefined)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.clearText}>Temizle</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.previewStatsRow}>
              <View style={styles.previewStat}>
                <Text style={styles.previewStatLabel}>Döngü Günü</Text>
                <Text style={styles.previewStatValue}>
                  {cycleDay}. Gün
                </Text>
              </View>
              <View style={styles.previewDivider} />
              <View style={styles.previewStat}>
                <Text style={styles.previewStatLabel}>Sonraki Tahmini</Text>
                <Text style={styles.previewStatValue}>
                  {estimatedNextDate.toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.infoBanner}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.infoBannerText}>
              Şimdi hatırlamıyorsan bu adımı atlayabilir, kayıt sonrasında Takvim
              ekranından istediğin zaman ekleyebilirsin.
            </Text>
          </View>
        )}
      </View>

      <StepButtons
        onNext={handleSubmit(onSubmit)}
        nextLabel={hasValidDate ? 'Kaydet ve Devam Et' : 'Atlayıp Devam Et'}
      />
    </StepContainer>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    content: {
      flex: 1,
      gap: 14,
    },
    card: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 22,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 4,
    },
    cardHint: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 17,
      marginBottom: 14,
    },
    chipsWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginBottom: 14,
    },
    quickChip: {
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: theme.isDark ? '#121215' : '#F9FAFB',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    quickChipActive: {
      backgroundColor: theme.isDark
        ? 'rgba(255, 105, 180, 0.2)'
        : '#FCE7F3',
      borderColor: theme.colors.primary,
    },
    quickChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    quickChipTextActive: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
    dateShell: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: theme.isDark ? '#121215' : '#F9FAFB',
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 11,
    },
    dateShellActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.backgroundCard,
    },
    dateLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
      flex: 1,
    },
    dateIconBox: {
      width: 36,
      height: 36,
      borderRadius: 11,
      backgroundColor: theme.isDark
        ? 'rgba(255, 105, 180, 0.14)'
        : 'rgba(236, 72, 153, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateFieldCaption: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    dateValueText: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
      marginTop: 1,
    },
    datePlaceholder: {
      fontSize: 15,
      color: theme.colors.textLight,
      marginTop: 1,
    },
    dateActionPill: {
      backgroundColor: theme.isDark ? '#27272A' : '#FCE7F3',
      paddingHorizontal: 11,
      paddingVertical: 6,
      borderRadius: 10,
    },
    dateActionText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    datePickerContainer: {
      marginTop: 10,
      backgroundColor: theme.isDark ? '#121215' : '#F9FAFB',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 16,
      padding: 8,
      overflow: 'hidden',
    },
    previewCard: {
      backgroundColor: theme.isDark
        ? 'rgba(139, 92, 246, 0.12)'
        : '#FDF4FF',
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.isDark ? '#4C1D95' : '#F5D0FE',
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    previewBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    previewBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.7,
      color: theme.colors.primary,
    },
    clearText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    previewStatsRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    previewStat: {
      flex: 1,
      alignItems: 'center',
    },
    previewDivider: {
      width: 1,
      height: 32,
      backgroundColor: theme.colors.border,
    },
    previewStatLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 2,
    },
    previewStatValue: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.text,
    },
    infoBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoBannerText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 19,
    },
  });
