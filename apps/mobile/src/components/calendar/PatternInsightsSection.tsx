import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { usePremium } from '@/hooks/usePremium';
import { UpgradePrompt } from '@/components/premium/UpgradePrompt';

interface PatternInsightsSectionProps {
  patterns?: {
    totalLogsAnalyzed: number;
    cycleHistory: Array<{
      startDate: string;
      cycleLength: number;
      periodLength: number | null;
    }>;
    upcoming3Cycles?: Array<{
      cycleNumber: number;
      startDate: string;
      endDate: string;
      ovulationDate: string;
      fertileStart: string;
      fertileEnd: string;
    }>;
    topPrePeriodSymptoms: Array<{ name: string; count: number }>;
    insights: Array<{
      id: string;
      icon: string;
      title: string;
      description: string;
      tone: 'pink' | 'purple' | 'teal' | 'amber';
    }>;
  };
}

const TONE_MAP = {
  pink: { bg: 'rgba(236, 72, 153, 0.1)', fg: '#DB2777' },
  purple: { bg: 'rgba(139, 92, 246, 0.1)', fg: '#7C3AED' },
  teal: { bg: 'rgba(16, 185, 129, 0.1)', fg: '#059669' },
  amber: { bg: 'rgba(245, 158, 11, 0.1)', fg: '#D97706' },
};

const formatShort = (ymd: string) =>
  new Date(ymd).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

export function PatternInsightsSection({ patterns }: PatternInsightsSectionProps) {
  const theme = useTheme();
  const { isPremium } = usePremium();
  const [promptVisible, setPromptVisible] = useState(false);
  const [promptFeature, setPromptFeature] = useState({
    feature: '3 Aylık Döngü Projeksiyonu & Korelasyonlar',
    description:
      'Gelecek 3 ayın regl, ovulasyon ve verimli dönemlerini önceden gör; uyku-kramp korelasyonlarını aç.',
  });

  if (!patterns) return null;

  const styles = createStyles(theme);
  const maxCycle = Math.max(
    32,
    ...(patterns.cycleHistory || []).map((c) => c.cycleLength),
  );

  const visibleInsights = isPremium
    ? patterns.insights
    : patterns.insights.slice(0, 1);
  const lockedInsightsCount = Math.max(0, patterns.insights.length - visibleInsights.length);

  return (
    <View style={styles.container}>
      {patterns.cycleHistory && patterns.cycleHistory.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📈 Son Döngü Uzunluğu Trendi</Text>
          <Text style={styles.cardSub}>
            Son {patterns.cycleHistory.length} tamamlanan döngün
          </Text>
          <View style={styles.barsRow}>
            {patterns.cycleHistory.map((item) => {
              const heightPct = Math.max(24, Math.round((item.cycleLength / maxCycle) * 86));
              return (
                <View key={item.startDate} style={styles.barCol}>
                  <Text style={styles.barValue}>{item.cycleLength}g</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: heightPct }]} />
                  </View>
                  <Text style={styles.barDate}>{formatShort(item.startDate)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Upcoming 3 Cycles Projection — Premium Perk */}
      {patterns.upcoming3Cycles && patterns.upcoming3Cycles.length > 0 && (
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>🔮 Gelecek 3 Ay Döngü Projeksiyonu</Text>
              <Text style={styles.cardSub}>
                Tatil, seyahat ve özel günlerini önceden planla
              </Text>
            </View>
            <View style={styles.premiumBadge}>
              <Ionicons name="sparkles" size={11} color="#B45309" />
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          </View>

          {isPremium ? (
            <View style={{ gap: 8 }}>
              {patterns.upcoming3Cycles.map((c) => (
                <View key={c.cycleNumber} style={styles.forecastRow}>
                  <View style={styles.forecastNum}>
                    <Text style={styles.forecastNumText}>#{c.cycleNumber}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.forecastDates}>
                      Regl: {formatShort(c.startDate)} – {formatShort(c.endDate)}
                    </Text>
                    <Text style={styles.forecastSub}>
                      Ovulasyon: {formatShort(c.ovulationDate)} · Verimli: {formatShort(c.fertileStart)}–{formatShort(c.fertileEnd)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setPromptFeature({
                  feature: 'Gelecek 3 Ay Döngü Projeksiyonu',
                  description:
                    'Önümüzdeki 3 ayın regl başlangıç tarihlerini, yumurtlama ve verimli pencerelerini tek bakışta gör.',
                });
                setPromptVisible(true);
              }}
            >
              <LinearGradient
                colors={['rgba(236, 72, 153, 0.12)', 'rgba(139, 92, 246, 0.12)']}
                style={styles.lockedBox}
              >
                <Ionicons name="lock-closed" size={20} color={theme.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.lockedTitle}>
                    Önümüzdeki 3 döngü tahmini hazır ✨
                  </Text>
                  <Text style={styles.lockedDesc}>
                    İlk döngü: {formatShort(patterns.upcoming3Cycles[0].startDate)} · Diğer 2 ayı görmek için Premium&apos;a geç
                  </Text>
                </View>
                <View style={styles.unlockBtn}>
                  <Text style={styles.unlockBtnText}>Aç</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Personal Pattern & Correlation Insights */}
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>🧠 Kişisel Örüntü & Korelasyon Analizi</Text>
            <Text style={styles.cardSub}>
              Son 90 günde {patterns.totalLogsAnalyzed} semptom kaydından çıkarıldı
            </Text>
          </View>
        </View>

        <View style={styles.insightsList}>
          {visibleInsights.map((ins) => {
            const palette = TONE_MAP[ins.tone] || TONE_MAP.purple;
            return (
              <View
                key={ins.id}
                style={[styles.insightRow, { backgroundColor: palette.bg }]}
              >
                <View style={[styles.iconBox, { backgroundColor: '#FFFFFF' }]}>
                  <Ionicons name={(ins.icon as any) || 'sparkles'} size={18} color={palette.fg} />
                </View>
                <View style={styles.insightBody}>
                  <Text style={[styles.insightTitle, { color: palette.fg }]}>
                    {ins.title}
                  </Text>
                  <Text style={styles.insightDesc}>{ins.description}</Text>
                </View>
              </View>
            );
          })}

          {!isPremium && lockedInsightsCount > 0 && (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.lockedCorrelationBanner}
              onPress={() => {
                setPromptFeature({
                  feature: 'Uyku & Kramp Korelasyon Analizi',
                  description:
                    `${lockedInsightsCount} adet daha kişisel korelasyon içgörüsünü (uyku-kramp, PMS örüntüleri, hidrasyon etkisi) Premium ile aç.`,
                });
                setPromptVisible(true);
              }}
            >
              <Ionicons name="sparkles" size={18} color="#8B5CF6" />
              <View style={{ flex: 1 }}>
                <Text style={styles.lockedTitle}>
                  +{lockedInsightsCount} Kişisel Korelasyon İçgörüsü Kilitli
                </Text>
                <Text style={styles.lockedDesc}>
                  7 gün ücretsiz dene ve vücudunun tüm örüntülerini keşfet
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8B5CF6" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <UpgradePrompt
        visible={promptVisible}
        onClose={() => setPromptVisible(false)}
        feature={promptFeature.feature}
        description={promptFeature.description}
      />
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: { gap: 12 },
    card: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    },
    cardTitle: { fontSize: 15.5, fontWeight: '700', color: theme.colors.text },
    cardSub: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2, marginBottom: 14 },
    premiumBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
    },
    premiumBadgeText: { fontSize: 10, fontWeight: '800', color: '#B45309' },
    barsRow: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'flex-end',
      height: 126,
      paddingTop: 8,
    },
    barCol: { alignItems: 'center', gap: 4, flex: 1 },
    barValue: { fontSize: 11.5, fontWeight: '700', color: theme.colors.primary },
    barTrack: {
      width: 22,
      height: 86,
      backgroundColor: `${theme.colors.primary}15`,
      borderRadius: 10,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    barFill: { width: '100%', backgroundColor: theme.colors.primary, borderRadius: 10 },
    barDate: { fontSize: 10, color: theme.colors.textSecondary },
    forecastRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 10,
      borderRadius: 12,
      backgroundColor: theme.colors.background,
    },
    forecastNum: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: `${theme.colors.primary}18`,
      alignItems: 'center',
      justifyContent: 'center',
    },
    forecastNumText: { fontSize: 11.5, fontWeight: '800', color: theme.colors.primary },
    forecastDates: { fontSize: 13.5, fontWeight: '700', color: theme.colors.text },
    forecastSub: { fontSize: 11.5, color: theme.colors.textSecondary, marginTop: 2 },
    lockedBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}30`,
    },
    lockedCorrelationBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 12,
      borderRadius: 14,
      backgroundColor: 'rgba(139, 92, 246, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(139, 92, 246, 0.25)',
    },
    lockedTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
    lockedDesc: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },
    unlockBtn: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
    },
    unlockBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12.5 },
    insightsList: { gap: 10 },
    insightRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      padding: 12,
      borderRadius: 14,
    },
    iconBox: {
      width: 34,
      height: 34,
      borderRadius: 17,
      justifyContent: 'center',
      alignItems: 'center',
    },
    insightBody: { flex: 1 },
    insightTitle: { fontSize: 13.5, fontWeight: '700', marginBottom: 2 },
    insightDesc: { fontSize: 12.5, color: theme.colors.text, lineHeight: 18 },
  });
