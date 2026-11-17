import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { cyclesService, pregnancyService } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { usePregnancyStore } from '@/store/pregnancyStore';
import { useTheme } from '@/hooks/useTheme';
import { router, useLocalSearchParams } from 'expo-router';
import { Legend } from '@/components/calendar/Legend';
import { DayMarkers } from '@/components/calendar/DayMarkers';
import { InsightCards } from '@/components/calendar/InsightCards';
import { PatternInsightsSection } from '@/components/calendar/PatternInsightsSection';
import { DayDetailsSheet } from '@/components/calendar/DayDetailsSheet';

const MONTH_NAMES = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

const toDateKey = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export default function CalendarScreen() {
  const theme = useTheme();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isPregnancyMode, setPregnancyMode, initializePregnancyMode } = usePregnancyStore();
  const { openToday } = useLocalSearchParams<{ openToday?: string }>();

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);

  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
  const [inspectedDateKey, setInspectedDateKey] = useState<string>(todayKey);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const [showDayDetails, setShowDayDetails] = useState(false);

  useEffect(() => {
    initializePregnancyMode();
  }, []);

  const { data: pregnancy } = useQuery({
    queryKey: ['pregnancy'],
    queryFn: () => pregnancyService.get(),
    enabled: isAuthenticated,
  });

  const { data: pregnancySummary } = useQuery({
    queryKey: ['pregnancy', 'summary'],
    queryFn: () => pregnancyService.getSummary(),
    enabled: isAuthenticated && isPregnancyMode && !!pregnancy,
  });

  const leadingPlaceholders = useMemo(() => {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    let offset = firstDay.getDay() - 1;
    if (offset < 0) offset = 6;
    return Array.from({ length: offset }, (_, index) => index);
  }, [selectedMonth, selectedYear]);

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', selectedYear, selectedMonth],
    queryFn: async () => {
      const data: any = await cyclesService.getCalendar(selectedYear, selectedMonth);
      if (data?.days) {
        data.days = data.days.map((day: any) => ({
          ...day,
          date: new Date(day.date),
        }));
      }
      return data;
    },
    enabled: isAuthenticated,
  });

  const { data: predictionData } = useQuery({
    queryKey: ['prediction'],
    queryFn: () => cyclesService.getPrediction(),
    enabled: isAuthenticated && !isPregnancyMode,
  });

  const { data: statsData } = useQuery({
    queryKey: ['stats'],
    queryFn: () => cyclesService.getStats(),
    enabled: isAuthenticated && !isPregnancyMode,
  });

  const { data: patternInsights } = useQuery({
    queryKey: ['patternInsights'],
    queryFn: () => cyclesService.getPatternInsights(),
    enabled: isAuthenticated && !isPregnancyMode,
  });

  const calendarDays: any[] = (calendarData as any)?.days || [];

  const inspectedDay = useMemo(() => {
    if (calendarDays.length === 0) return null;
    const match = calendarDays.find((day) => {
      const d = typeof day.date === 'string' ? new Date(day.date) : day.date;
      return toDateKey(d) === inspectedDateKey;
    });
    if (match) {
      return {
        ...match,
        date: typeof match.date === 'string' ? new Date(match.date) : match.date,
      };
    }
    const todayInMonth = calendarDays.find((day) => {
      const d = typeof day.date === 'string' ? new Date(day.date) : day.date;
      return toDateKey(d) === todayKey;
    });
    const fallback = todayInMonth || calendarDays[0];
    return {
      ...fallback,
      date: typeof fallback.date === 'string' ? new Date(fallback.date) : fallback.date,
    };
  }, [calendarDays, inspectedDateKey, todayKey]);

  useEffect(() => {
    if (openToday === 'true' && calendarDays.length > 0) {
      const todayDay = calendarDays.find((day) => {
        const d = typeof day.date === 'string' ? new Date(day.date) : day.date;
        return toDateKey(d) === todayKey;
      });
      if (todayDay) {
        setInspectedDateKey(todayKey);
        setShowDayDetails(true);
      }
    }
  }, [openToday, calendarDays, todayKey]);

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const goToToday = () => {
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth() + 1);
    setInspectedDateKey(todayKey);
  };

  const isViewingCurrentMonth =
    selectedYear === today.getFullYear() && selectedMonth === today.getMonth() + 1;

  const handleDayPress = (day: any) => {
    const dayDate = typeof day.date === 'string' ? new Date(day.date) : day.date;
    const key = toDateKey(dayDate);

    if (key === inspectedDateKey) {
      setShowDayDetails(true);
    } else {
      setInspectedDateKey(key);
    }
  };

  const logPeriodForDate = async (date: Date) => {
    try {
      await cyclesService.createCycle({
        startDate: date.toISOString(),
      });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['prediction'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['homeSnapshot'] });
      Alert.alert('Kaydedildi', `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} regl başlangıcı olarak eklendi.`);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Kaydedilemedi');
    }
  };

  const confirmLogPeriod = (date: Date) => {
    Alert.alert(
      'Regl Başlangıcı',
      `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} tarihini regl başlangıcı olarak kaydetmek istiyor musunuz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Evet, Kaydet',
          onPress: () => logPeriodForDate(date),
        },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Döngüyü Sıfırla',
      'Tüm regl kayıtları silinecek. Bu işlem geri alınamaz. Emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: async () => {
            try {
              await cyclesService.deleteAllCycles();
              queryClient.invalidateQueries({ queryKey: ['calendar'] });
              queryClient.invalidateQueries({ queryKey: ['prediction'] });
              queryClient.invalidateQueries({ queryKey: ['stats'] });
              queryClient.invalidateQueries({ queryKey: ['homeSnapshot'] });
              Alert.alert('Başarılı', 'Döngü verileri sıfırlandı');
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Sıfırlanamadı');
            }
          },
        },
      ]
    );
  };

  const handlePregnancyToggle = async (value: boolean) => {
    if (value && !pregnancy) {
      router.push('/pregnancy/setup');
      return;
    }

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 130,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    await setPregnancyMode(value);
  };

  const getInspectedPhaseBadge = (day: any) => {
    if (day.isPeriod) {
      return {
        label: day.cycleDay ? `Regl • ${day.cycleDay}. Gün` : 'Regl Günü',
        color: '#FF4D8D',
        bg: 'rgba(255, 77, 141, 0.14)',
        icon: 'water' as const,
      };
    }
    if (day.isOvulation) {
      return {
        label: 'Yumurtlama Günü',
        color: '#D97706',
        bg: 'rgba(245, 158, 11, 0.15)',
        icon: 'sparkles' as const,
      };
    }
    if (day.isFertile) {
      return {
        label: 'Verimli Pencere',
        color: '#A855F7',
        bg: 'rgba(168, 85, 247, 0.14)',
        icon: 'flower-outline' as const,
      };
    }
    if (day.isPredicted) {
      return {
        label: 'Tahmini Regl Başlangıcı',
        color: '#FF4D8D',
        bg: 'rgba(255, 77, 141, 0.12)',
        icon: 'calendar-outline' as const,
      };
    }
    return {
      label: day.cycleDay ? `Döngü ${day.cycleDay}. Gün` : 'Kayıt Günü',
      color: theme.colors.textSecondary,
      bg: theme.colors.background,
      icon: 'ellipse-outline' as const,
    };
  };

  const getFlowLabel = (flow?: string) => {
    if (flow === 'light') return 'Hafif akış';
    if (flow === 'moderate') return 'Orta akış';
    if (flow === 'heavy') return 'Yoğun akış';
    return null;
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Clean Header + Mode Segmented Pill */}
        <View style={styles.header}>
          <View>
            <Text style={styles.pageTitle}>Takvim</Text>
            <Text style={styles.pageSubtitle}>
              {today.toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                weekday: 'long',
              })}
            </Text>
          </View>

          <View style={styles.modeSegmented}>
            <TouchableOpacity
              style={[styles.modePill, !isPregnancyMode && styles.modePillActive]}
              onPress={() => isPregnancyMode && handlePregnancyToggle(false)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="calendar-outline"
                size={13}
                color={!isPregnancyMode ? '#FFFFFF' : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.modePillText,
                  !isPregnancyMode && styles.modePillTextActive,
                ]}
              >
                Döngü
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modePill, isPregnancyMode && styles.modePillActive]}
              onPress={() => !isPregnancyMode && handlePregnancyToggle(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="heart-outline"
                size={13}
                color={isPregnancyMode ? '#FFFFFF' : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.modePillText,
                  isPregnancyMode && styles.modePillTextActive,
                ]}
              >
                Hamilelik
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Unified Calendar Card */}
        <View style={styles.calendarCard}>
          {/* Month Navigation inside Card */}
          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={goToPreviousMonth}
              style={styles.monthNavButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.monthCenter}>
              <Text style={styles.monthTitle}>
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </Text>
              {(!isViewingCurrentMonth || inspectedDateKey !== todayKey) && (
                <TouchableOpacity onPress={goToToday} style={styles.todayChip}>
                  <Text style={styles.todayChipText}>Bugüne Dön</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={goToNextMonth}
              style={styles.monthNavButton}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={18} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map((day) => (
              <Text key={day} style={styles.dayHeader}>
                {day}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          {isLoading ? (
            <View style={styles.calendarLoader}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          ) : (
            <View style={styles.daysGrid}>
              {leadingPlaceholders.map((index) => (
                <View key={`empty-${index}`} style={styles.dayCell} />
              ))}

              {calendarDays.map((day: any, index: number) => {
                const dayDate = typeof day.date === 'string' ? new Date(day.date) : day.date;
                const key = toDateKey(dayDate);
                const isToday = key === todayKey;
                const isSelected = key === inspectedDateKey;

                const isPeriod = Boolean(day.isPeriod);
                const isPredicted = Boolean(day.isPredicted && !isPeriod);
                const isOvulation = Boolean(day.isOvulation && !isPeriod);
                const isFertile = Boolean(day.isFertile && !isPeriod && !isOvulation);

                return (
                  <TouchableOpacity
                    key={key || index}
                    style={styles.dayCell}
                    onPress={() => handleDayPress({ ...day, date: dayDate })}
                    activeOpacity={0.75}
                  >
                    <View
                      style={[
                        styles.dayCircle,
                        isFertile && styles.dayFertile,
                        isOvulation && styles.dayOvulation,
                        isPredicted && styles.dayPredicted,
                        isPeriod && styles.dayPeriod,
                        isToday && styles.dayToday,
                        isSelected && styles.daySelected,
                        isSelected && isPeriod && styles.daySelectedPeriod,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayNumber,
                          isFertile && styles.dayNumberFertile,
                          isOvulation && styles.dayNumberOvulation,
                          isPeriod && styles.dayNumberPeriod,
                          isToday && styles.dayNumberToday,
                          isSelected && styles.dayNumberSelected,
                        ]}
                      >
                        {dayDate.getDate()}
                      </Text>

                      {day.cycleDay ? (
                        <Text
                          style={[
                            styles.cycleDayBadge,
                            isSelected && styles.cycleDayBadgeSelected,
                          ]}
                        >
                          {day.cycleDay}g
                        </Text>
                      ) : null}
                    </View>

                    <DayMarkers
                      markers={day.markers || []}
                      isPredicted={day.isPredicted}
                      mood={day.dailyLog?.mood || []}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Integrated Legend at Footer of Calendar */}
          {!isPregnancyMode && (
            <View style={styles.legendDivider}>
              <Legend />
            </View>
          )}
        </View>

        {/* Inline Selected Day Quick Action Card */}
        {!isPregnancyMode && inspectedDay && (
          <View style={styles.selectedDayCard}>
            <View style={styles.selectedDayHeader}>
              <View style={styles.selectedDayTitleBlock}>
                <Text style={styles.selectedDayDate}>
                  {inspectedDay.date.toLocaleDateString('tr-TR', {
                    day: 'numeric',
                    month: 'long',
                    weekday: 'long',
                  })}
                </Text>
                {(() => {
                  const badge = getInspectedPhaseBadge(inspectedDay);
                  return (
                    <View style={[styles.phasePill, { backgroundColor: badge.bg }]}>
                      <Ionicons name={badge.icon} size={12} color={badge.color} />
                      <Text style={[styles.phasePillText, { color: badge.color }]}>
                        {badge.label}
                      </Text>
                    </View>
                  );
                })()}
              </View>
            </View>

            {/* Quick Summary of Logged Data */}
            {inspectedDay.dailyLog ? (
              <View style={styles.logSummaryRow}>
                {getFlowLabel(inspectedDay.dailyLog.flow) && (
                  <View style={styles.summaryTag}>
                    <Text style={styles.summaryTagText}>
                      🩸 {getFlowLabel(inspectedDay.dailyLog.flow)}
                    </Text>
                  </View>
                )}
                {inspectedDay.dailyLog.mood?.slice(0, 2).map((m: string) => (
                  <View key={m} style={styles.summaryTag}>
                    <Text style={styles.summaryTagText}>{m}</Text>
                  </View>
                ))}
                {inspectedDay.dailyLog.symptoms?.length > 0 && (
                  <View style={styles.summaryTag}>
                    <Text style={styles.summaryTagText}>
                      {inspectedDay.dailyLog.symptoms.length} semptom
                    </Text>
                  </View>
                )}
                {inspectedDay.dailyLog.medications?.length > 0 && (
                  <View style={styles.summaryTag}>
                    <Text style={styles.summaryTagText}>💊 İlaç</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.emptyLogHint}>
                Bu gün için semptom, ruh hali veya akış kaydı eklemek için dokun.
              </Text>
            )}

            {/* One-tap Actions */}
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.primaryActionButton}
                onPress={() => setShowDayDetails(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={16} color="#FFFFFF" />
                <Text style={styles.primaryActionText}>
                  {inspectedDay.dailyLog ? 'Kaydı Düzenle' : 'Günlük Ekle'}
                </Text>
              </TouchableOpacity>

              {!inspectedDay.isPeriod && (
                <TouchableOpacity
                  style={styles.secondaryActionButton}
                  onPress={() => confirmLogPeriod(inspectedDay.date)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="water-outline" size={16} color="#FF4D8D" />
                  <Text style={styles.secondaryActionText}>Regl Başlat</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Animated Insights / Pregnancy Section */}
        <Animated.View style={[styles.insightsSection, { opacity: fadeAnim }]}>
          {isPregnancyMode ? (
            pregnancySummary ? (
              <LinearGradient
                colors={
                  theme.isDark
                    ? ['#4C1D95', '#831843']
                    : ['#D946EF', '#FF4D8D']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pregnancyHero}
              >
                <View style={styles.pregnancyHeaderRow}>
                  <View style={styles.pregnancyBadge}>
                    <Ionicons name="heart" size={13} color="#FFFFFF" />
                    <Text style={styles.pregnancyBadgeText}>Hamilelik Takibi</Text>
                  </View>
                  <Text style={styles.trimesterPill}>
                    {pregnancySummary.trimester}. Trimester
                  </Text>
                </View>

                <Text style={styles.pregnancyWeekText}>
                  {pregnancySummary.gestationalAge.weeks} Hafta{' '}
                  {pregnancySummary.gestationalAge.days} Gün
                </Text>

                {pregnancySummary.dueDate && (
                  <Text style={styles.pregnancyDueText}>
                    Tahmini Doğum:{' '}
                    {new Date(pregnancySummary.dueDate).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                )}

                <TouchableOpacity
                  style={styles.pregnancyCta}
                  onPress={() => router.push('/pregnancy')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.pregnancyCtaText}>Hamilelik Paneline Git</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FF4D8D" />
                </TouchableOpacity>
              </LinearGradient>
            ) : null
          ) : (
            <>
              {predictionData && (predictionData as any).prediction && (
                <InsightCards
                  prediction={(predictionData as any).prediction}
                  stats={statsData as any}
                />
              )}

              {patternInsights && (
                <PatternInsightsSection patterns={patternInsights as any} />
              )}

              <TouchableOpacity
                style={styles.resetLinkButton}
                onPress={handleReset}
                activeOpacity={0.75}
              >
                <Ionicons name="refresh-outline" size={15} color={theme.colors.error} />
                <Text style={styles.resetLinkText}>Döngü Verilerini Sıfırla</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Day Details Sheet */}
      {inspectedDay && (
        <DayDetailsSheet
          visible={showDayDetails}
          onClose={() => setShowDayDetails(false)}
          date={inspectedDay.date}
          dayData={inspectedDay}
          isPeriod={inspectedDay.isPeriod}
          isFertile={inspectedDay.isFertile}
          isPredicted={inspectedDay.isPredicted}
          isOvulation={inspectedDay.isOvulation}
          onLogPeriodStart={() => {
            setShowDayDetails(false);
            confirmLogPeriod(inspectedDay.date);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    container: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: 16,
      paddingTop: 8,
      paddingBottom: 110,
      gap: 14,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
      gap: 12,
    },
    pageTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: theme.colors.text,
      letterSpacing: -0.5,
    },
    pageSubtitle: {
      fontSize: 12.5,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      marginTop: 2,
    },
    modeSegmented: {
      flexDirection: 'row',
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 18,
      padding: 3,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 2,
    },
    modePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 14,
    },
    modePillActive: {
      backgroundColor: theme.colors.primary,
    },
    modePillText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    modePillTextActive: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    calendarCard: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 22,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 3,
    },
    monthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    monthNavButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    monthCenter: {
      alignItems: 'center',
      gap: 4,
    },
    monthTitle: {
      fontSize: 17,
      fontWeight: '800',
      color: theme.colors.text,
      letterSpacing: -0.2,
    },
    todayChip: {
      backgroundColor: theme.colors.backgroundSecondary,
      paddingHorizontal: 10,
      paddingVertical: 2.5,
      borderRadius: 10,
    },
    todayChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    weekRow: {
      flexDirection: 'row',
      marginBottom: 8,
    },
    dayHeader: {
      flex: 1,
      textAlign: 'center',
      fontSize: 11.5,
      fontWeight: '700',
      color: theme.colors.textLight,
      textTransform: 'uppercase',
    },
    calendarLoader: {
      height: 240,
      justifyContent: 'center',
      alignItems: 'center',
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.285%',
      alignItems: 'center',
      paddingVertical: 3,
    },
    dayCircle: {
      width: 38,
      height: 38,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    dayPeriod: {
      backgroundColor: 'rgba(255, 77, 141, 0.18)',
    },
    dayPredicted: {
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: '#FF4D8D',
      backgroundColor: 'rgba(255, 77, 141, 0.06)',
    },
    dayFertile: {
      backgroundColor: 'rgba(168, 85, 247, 0.14)',
    },
    dayOvulation: {
      backgroundColor: 'rgba(245, 158, 11, 0.18)',
      borderWidth: 1.5,
      borderColor: '#F59E0B',
    },
    dayToday: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    daySelected: {
      backgroundColor: theme.colors.primary,
      borderWidth: 2,
      borderColor: theme.colors.primaryDark,
    },
    daySelectedPeriod: {
      backgroundColor: '#FF4D8D',
      borderColor: '#E11D48',
    },
    dayNumber: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
    },
    dayNumberPeriod: {
      color: theme.isDark ? '#FF85B3' : '#BE185D',
      fontWeight: '700',
    },
    dayNumberFertile: {
      color: theme.isDark ? '#D8B4FE' : '#7E22CE',
      fontWeight: '700',
    },
    dayNumberOvulation: {
      color: theme.isDark ? '#FCD34D' : '#B45309',
      fontWeight: '800',
    },
    dayNumberToday: {
      color: theme.colors.primary,
      fontWeight: '800',
    },
    dayNumberSelected: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    cycleDayBadge: {
      fontSize: 8,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      lineHeight: 9,
    },
    cycleDayBadgeSelected: {
      color: 'rgba(255,255,255,0.9)',
    },
    legendDivider: {
      marginTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    selectedDayCard: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 10,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    selectedDayHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    selectedDayTitleBlock: {
      flex: 1,
      gap: 6,
    },
    selectedDayDate: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.text,
    },
    phasePill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    phasePillText: {
      fontSize: 12,
      fontWeight: '700',
    },
    logSummaryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    summaryTag: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    summaryTagText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
    },
    emptyLogHint: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 2,
    },
    primaryActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      paddingVertical: 11,
    },
    primaryActionText: {
      color: '#FFFFFF',
      fontSize: 13.5,
      fontWeight: '700',
    },
    secondaryActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: 'rgba(255, 77, 141, 0.1)',
      borderWidth: 1,
      borderColor: 'rgba(255, 77, 141, 0.35)',
      borderRadius: 14,
      paddingVertical: 11,
    },
    secondaryActionText: {
      color: '#FF4D8D',
      fontSize: 13.5,
      fontWeight: '700',
    },
    insightsSection: {
      gap: 12,
    },
    pregnancyHero: {
      borderRadius: 22,
      padding: 20,
      gap: 10,
    },
    pregnancyHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    pregnancyBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    pregnancyBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    trimesterPill: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
      backgroundColor: 'rgba(255,255,255,0.16)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 10,
    },
    pregnancyWeekText: {
      fontSize: 28,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.4,
      marginTop: 4,
    },
    pregnancyDueText: {
      fontSize: 13.5,
      color: 'rgba(255,255,255,0.9)',
      fontWeight: '500',
    },
    pregnancyCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      paddingVertical: 12,
      marginTop: 6,
    },
    pregnancyCtaText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FF4D8D',
    },
    resetLinkButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 12,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.3)',
      backgroundColor: theme.colors.backgroundCard,
    },
    resetLinkText: {
      fontSize: 13.5,
      fontWeight: '600',
      color: theme.colors.error,
    },
  });
