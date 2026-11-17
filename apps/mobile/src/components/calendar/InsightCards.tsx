import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface InsightCardsProps {
  prediction?: {
    nextStart: Date;
    confidence: 'low' | 'medium' | 'high';
    averageCycleLength: number;
    fertile: {
      start: Date;
      end: Date;
    };
    ovulation: Date;
  };
  stats?: {
    averageCycleLength: number | null;
    averagePeriodLength: number | null;
    cycleVariance: number | null;
    last3Cycles: number[];
  };
}

export function InsightCards({ prediction, stats }: InsightCardsProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const getConfidenceLabel = (confidence: 'low' | 'medium' | 'high'): string => {
    switch (confidence) {
      case 'high':
        return 'Yüksek Güven';
      case 'medium':
        return 'Orta Güven';
      case 'low':
        return 'Düşük Güven';
    }
  };

  const formatDate = (date: Date, shortMonth = false): string => {
    return new Date(date).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: shortMonth ? 'short' : 'long',
    });
  };

  const getDaysUntil = (date: Date): number => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getCountdownText = (days: number): string => {
    if (days === 0) return 'Bugün bekleniyor';
    if (days === 1) return 'Yarın';
    if (days > 1) return `${days} gün kaldı`;
    return `${Math.abs(days)} gün gecikti`;
  };

  const getVarianceLabel = (variance: number | null): string => {
    if (variance === null || variance === undefined) return '—';
    if (variance < 2) return 'Çok düzenli';
    if (variance < 4) return 'Düzenli';
    if (variance < 7) return 'Değişken';
    return 'Düzensiz';
  };

  const daysUntilNext = prediction ? getDaysUntil(prediction.nextStart) : null;

  return (
    <View style={styles.container}>
      {/* Hero Next Period Prediction Card */}
      {prediction && (
        <LinearGradient
          colors={
            theme.isDark
              ? ['#831843', '#581C87']
              : ['#FF4D8D', '#D946EF']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.heroBadge}>
              <Ionicons name="water" size={13} color="#FFFFFF" />
              <Text style={styles.heroBadgeText}>Sonraki Regl Tahmini</Text>
            </View>
            <View style={styles.confidencePill}>
              <Text style={styles.confidencePillText}>
                {getConfidenceLabel(prediction.confidence)}
              </Text>
            </View>
          </View>

          <View style={styles.heroMainRow}>
            <View style={styles.heroDateBlock}>
              <Text style={styles.heroDate}>{formatDate(prediction.nextStart)}</Text>
              <Text style={styles.heroSub}>
                {prediction.averageCycleLength} günlük ortalama döngüye göre
              </Text>
            </View>

            {daysUntilNext !== null && (
              <View style={styles.countdownBox}>
                <Text style={styles.countdownNumber}>
                  {daysUntilNext === 0 ? '!' : Math.abs(daysUntilNext)}
                </Text>
                <Text style={styles.countdownLabel}>
                  {daysUntilNext === 0
                    ? 'Bugün'
                    : daysUntilNext > 0
                      ? 'gün kaldı'
                      : 'gün geçti'}
                </Text>
              </View>
            )}
          </View>

          {daysUntilNext !== null && (
            <View style={styles.heroFooterNote}>
              <Ionicons name="sparkles-outline" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroFooterText}>
                {getCountdownText(daysUntilNext)}
                {prediction.confidence === 'low'
                  ? ' • Daha fazla kayıt doğruluğu artırır'
                  : ''}
              </Text>
            </View>
          )}
        </LinearGradient>
      )}

      {/* Fertile Window & Ovulation Timeline */}
      {prediction && (
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Doğurganlık Takvimi</Text>
          </View>

          <View style={styles.phaseRow}>
            <View style={[styles.phaseTile, styles.fertileTile]}>
              <View style={[styles.phaseIconBox, { backgroundColor: 'rgba(168, 85, 247, 0.16)' }]}>
                <Ionicons name="flower-outline" size={18} color="#A855F7" />
              </View>
              <Text style={styles.phaseLabel}>Verimli Pencere</Text>
              <Text style={styles.phaseValue}>
                {formatDate(prediction.fertile.start, true)} –{' '}
                {formatDate(prediction.fertile.end, true)}
              </Text>
            </View>

            <View style={[styles.phaseTile, styles.ovulationTile]}>
              <View style={[styles.phaseIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.16)' }]}>
                <Ionicons name="sparkles" size={18} color="#F59E0B" />
              </View>
              <Text style={styles.phaseLabel}>Yumurtlama</Text>
              <Text style={styles.phaseValue}>
                {formatDate(prediction.ovulation, true)}
              </Text>
            </View>
          </View>

          <View style={styles.disclaimerRow}>
            <Ionicons
              name="information-circle-outline"
              size={14}
              color={theme.colors.textLight}
            />
            <Text style={styles.disclaimerText}>
              Tahminler ortalama döngünüze dayanır; kesin doğum kontrolü yerine geçmez.
            </Text>
          </View>
        </View>
      )}

      {/* Cycle Health Snapshot */}
      {stats && stats.averageCycleLength && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Döngü Sağlık Özeti</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{stats.averageCycleLength}g</Text>
              <Text style={styles.statLabel}>Ort. Döngü</Text>
            </View>

            {stats.averagePeriodLength && (
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{stats.averagePeriodLength}g</Text>
                <Text style={styles.statLabel}>Ort. Regl</Text>
              </View>
            )}

            <View style={styles.statTile}>
              <Text style={[styles.statValue, styles.statValueCompact]}>
                {getVarianceLabel(stats.cycleVariance)}
              </Text>
              <Text style={styles.statLabel}>Düzenlilik</Text>
            </View>
          </View>

          {stats.last3Cycles.length > 0 && (
            <View style={styles.recentCyclesBox}>
              <Text style={styles.subsectionTitle}>Son Döngüler</Text>
              <View style={styles.cyclesRow}>
                {stats.last3Cycles.map((length, index) => (
                  <View key={index} style={styles.cycleChip}>
                    <View style={styles.cycleChipDot} />
                    <Text style={styles.cycleChipText}>{length} gün</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* Recommendations */}
      {prediction && prediction.confidence !== 'high' && (
        <View style={styles.tipCard}>
          <View style={styles.tipHeader}>
            <View style={styles.tipIconBox}>
              <Ionicons name="bulb-outline" size={16} color={theme.colors.primary} />
            </View>
            <Text style={styles.tipTitle}>Tahmin Doğruluğunu Artır</Text>
          </View>
          <Text style={styles.tipItem}>• Regl başlangıçlarını düzenli olarak işaretle</Text>
          <Text style={styles.tipItem}>• Semptom ve ruh hali notlarını ekle</Text>
          <Text style={styles.tipItem}>• En az 3 döngü kaydı tahminleri netleştirir</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      gap: 12,
    },
    heroCard: {
      borderRadius: 22,
      padding: 18,
      shadowColor: '#FF4D8D',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.22,
      shadowRadius: 14,
      elevation: 6,
    },
    heroTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 14,
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    heroBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
    },
    confidencePill: {
      backgroundColor: 'rgba(255,255,255,0.16)',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 10,
    },
    confidencePillText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '600',
    },
    heroMainRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
    },
    heroDateBlock: {
      flex: 1,
    },
    heroDate: {
      fontSize: 26,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: -0.4,
      marginBottom: 4,
    },
    heroSub: {
      fontSize: 12.5,
      color: 'rgba(255,255,255,0.88)',
      lineHeight: 17,
    },
    countdownBox: {
      backgroundColor: 'rgba(255,255,255,0.22)',
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 10,
      alignItems: 'center',
      minWidth: 74,
    },
    countdownNumber: {
      fontSize: 22,
      fontWeight: '800',
      color: '#FFFFFF',
      lineHeight: 24,
    },
    countdownLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.92)',
      marginTop: 2,
    },
    heroFooterNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 14,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.2)',
    },
    heroFooterText: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.92)',
      fontWeight: '500',
    },
    card: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },
    phaseRow: {
      flexDirection: 'row',
      gap: 10,
    },
    phaseTile: {
      flex: 1,
      borderRadius: 14,
      padding: 12,
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    fertileTile: {},
    ovulationTile: {},
    phaseIconBox: {
      width: 32,
      height: 32,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    phaseLabel: {
      fontSize: 11.5,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      marginBottom: 3,
    },
    phaseValue: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.text,
    },
    disclaimerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 12,
    },
    disclaimerText: {
      flex: 1,
      fontSize: 11.5,
      color: theme.colors.textLight,
      lineHeight: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 8,
    },
    statTile: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      backgroundColor: theme.colors.background,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    statValue: {
      fontSize: 19,
      fontWeight: '800',
      color: theme.colors.primary,
      marginBottom: 3,
    },
    statValueCompact: {
      fontSize: 14,
    },
    statLabel: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '600',
      textAlign: 'center',
    },
    recentCyclesBox: {
      marginTop: 14,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    subsectionTitle: {
      fontSize: 12.5,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    cyclesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    cycleChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 6,
      backgroundColor: theme.colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cycleChipDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.colors.primary,
    },
    cycleChipText: {
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.colors.text,
    },
    tipCard: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 5,
    },
    tipHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    tipIconBox: {
      width: 28,
      height: 28,
      borderRadius: 9,
      backgroundColor: theme.colors.backgroundSecondary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    tipTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.text,
    },
    tipItem: {
      fontSize: 12.5,
      color: theme.colors.textSecondary,
      lineHeight: 19,
    },
  });
