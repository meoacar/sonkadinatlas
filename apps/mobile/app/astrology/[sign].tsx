import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ZODIAC_SIGNS, ZodiacSign } from '@/utils/astrology';
import { astrologyApi } from '@/services/astrologyApi';

type Period = 'daily' | 'weekly' | 'monthly';

export default function ZodiacDetailScreen() {
    const theme = useTheme();
    const router = useRouter();
    const { sign } = useLocalSearchParams<{ sign: string }>();
    const [selectedPeriod, setSelectedPeriod] = useState<Period>('daily');

    const zodiacSign = (sign || 'aries').toLowerCase() as ZodiacSign;
    const zodiacInfo = ZODIAC_SIGNS[zodiacSign];

    const { data: signData, isLoading } = useQuery({
        queryKey: ['astrology', 'sign', zodiacSign],
        queryFn: () => astrologyApi.getSignHoroscopes(zodiacSign),
        enabled: !!zodiacInfo,
        staleTime: 5 * 60 * 1000,
    });

    if (!zodiacInfo) {
        return null;
    }

    const activeEntry = signData?.[selectedPeriod];
    const styles = createStyles(theme, zodiacInfo.color);

    const elementLabel =
        zodiacInfo.element === 'fire'
            ? 'Ateş Elementi'
            : zodiacInfo.element === 'earth'
              ? 'Toprak Elementi'
              : zodiacInfo.element === 'air'
                ? 'Hava Elementi'
                : 'Su Elementi';

    const renderScoreBar = (label: string, score: number, icon: keyof typeof Ionicons.glyphMap, color: string) => (
        <View style={styles.metricRow}>
            <View style={styles.metricLabelGroup}>
                <Ionicons name={icon} size={15} color={color} />
                <Text style={styles.metricLabel}>{label}</Text>
            </View>
            <View style={styles.metricBarTrack}>
                <View style={[styles.metricBarFill, { width: `${(score / 5) * 100}%`, backgroundColor: color }]} />
            </View>
            <Text style={styles.metricValue}>{score}/5</Text>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.title}>{zodiacInfo.nameTr}</Text>
                    <TouchableOpacity
                        style={styles.compatShortcut}
                        onPress={() => router.push('/astrology/compatibility')}
                    >
                        <Ionicons name="heart-outline" size={18} color={theme.colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Celestial Gradient Header Card */}
                <LinearGradient
                    colors={theme.isDark ? ['#312E81', '#6B21A8'] : [zodiacInfo.color, '#7C3AED']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.emblemCircle}>
                        <Text style={styles.zodiacEmoji}>{zodiacInfo.emoji}</Text>
                    </View>
                    <Text style={styles.zodiacName}>{zodiacInfo.nameTr}</Text>
                    <Text style={styles.zodiacDates}>{zodiacInfo.dates}</Text>
                    <View style={styles.metaPillsRow}>
                        <View style={styles.metaPill}>
                            <Text style={styles.metaPillText}>{elementLabel}</Text>
                        </View>
                        <View style={styles.metaPill}>
                            <Text style={styles.metaPillText}>Yönetici: {zodiacInfo.rulingPlanet}</Text>
                        </View>
                    </View>
                </LinearGradient>

                {/* Period Segmented Switch */}
                <View style={styles.periodSegmented}>
                    {(['daily', 'weekly', 'monthly'] as const).map((period) => {
                        const active = selectedPeriod === period;
                        const label =
                            period === 'daily' ? 'Günlük' : period === 'weekly' ? 'Haftalık' : 'Aylık';
                        return (
                            <TouchableOpacity
                                key={period}
                                style={[styles.periodButton, active && styles.periodButtonActive]}
                                onPress={() => setSelectedPeriod(period)}
                                activeOpacity={0.8}
                            >
                                <Text
                                    style={[
                                        styles.periodButtonText,
                                        active && styles.periodButtonTextActive,
                                    ]}
                                >
                                    {label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {isLoading ? (
                    <View style={styles.loaderBox}>
                        <ActivityIndicator size="small" color={theme.colors.primary} />
                    </View>
                ) : (
                    <>
                        {/* Main Horoscope Card */}
                        <View style={styles.card}>
                            {activeEntry?.title && (
                                <Text style={styles.horoscopeTitle}>{activeEntry.title}</Text>
                            )}
                            <Text style={styles.horoscopeText}>
                                {activeEntry?.summary ||
                                    'Bu dönem için iç sesinize güvenmek ve kendi ritminize özen göstermek öne çıkıyor.'}
                            </Text>

                            {activeEntry?.affirmation && (
                                <View style={styles.affirmationBox}>
                                    <Ionicons name="sparkles" size={14} color={theme.colors.primary} />
                                    <Text style={styles.affirmationText}>
                                        “{activeEntry.affirmation}”
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Scores & Life Areas */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Yaşam Alanları ve Puanlar</Text>
                            <View style={styles.metricsStack}>
                                {renderScoreBar('Aşk', activeEntry?.loveScore ?? 4, 'heart', '#EC4899')}
                                {renderScoreBar('Kariyer', activeEntry?.careerScore ?? 4, 'briefcase', '#3B82F6')}
                                {renderScoreBar('Sağlık', activeEntry?.healthScore ?? 4, 'fitness', '#10B981')}
                            </View>

                            {activeEntry?.loveText && (
                                <View style={styles.areaBlock}>
                                    <Text style={styles.areaTitle}>💕 Aşk & İlişkiler</Text>
                                    <Text style={styles.areaBody}>{activeEntry.loveText}</Text>
                                </View>
                            )}
                            {activeEntry?.careerText && (
                                <View style={styles.areaBlock}>
                                    <Text style={styles.areaTitle}>💼 Kariyer & Odak</Text>
                                    <Text style={styles.areaBody}>{activeEntry.careerText}</Text>
                                </View>
                            )}
                            {activeEntry?.healthText && (
                                <View style={styles.areaBlock}>
                                    <Text style={styles.areaTitle}>🌿 Sağlık & Beden</Text>
                                    <Text style={styles.areaBody}>{activeEntry.healthText}</Text>
                                </View>
                            )}
                        </View>

                        {/* Lucky Guide */}
                        <View style={styles.card}>
                            <Text style={styles.cardTitle}>Şans Rehberi</Text>
                            <View style={styles.luckyGrid}>
                                <View style={styles.luckyTile}>
                                    <Text style={styles.luckyLabel}>Şanslı Sayı</Text>
                                    <Text style={styles.luckyValue}>{activeEntry?.luckyNumber ?? 7}</Text>
                                </View>
                                <View style={styles.luckyTile}>
                                    <Text style={styles.luckyLabel}>Renk</Text>
                                    <Text style={styles.luckyValue} numberOfLines={1}>
                                        {activeEntry?.luckyColor ?? 'Gül Kurusu'}
                                    </Text>
                                </View>
                                <View style={styles.luckyTile}>
                                    <Text style={styles.luckyLabel}>Doğal Taş</Text>
                                    <Text style={styles.luckyValue} numberOfLines={1}>
                                        {activeEntry?.luckyStone ?? 'Ay Taşı'}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </>
                )}

                {/* Characteristics & Compatible Signs */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Burç Profili</Text>
                    <View style={styles.areaBlock}>
                        <Text style={styles.areaTitle}>Güçlü Yönler</Text>
                        <Text style={styles.areaBody}>{zodiacInfo.strengths}</Text>
                    </View>
                    <View style={styles.areaBlock}>
                        <Text style={styles.areaTitle}>Gelişim Alanları</Text>
                        <Text style={styles.areaBody}>{zodiacInfo.growthAreas}</Text>
                    </View>
                    <View style={styles.areaBlock}>
                        <Text style={styles.areaTitle}>Uyumlu Burçlar</Text>
                        <View style={styles.compatibleRow}>
                            {zodiacInfo.compatibleSigns.map((comp) => {
                                const cInfo = ZODIAC_SIGNS[comp];
                                return (
                                    <TouchableOpacity
                                        key={comp}
                                        style={styles.compatibleChip}
                                        onPress={() => router.replace(`/astrology/${comp}`)}
                                    >
                                        <Text style={styles.compatibleChipText}>
                                            {cInfo.emoji} {cInfo.nameTr}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (theme: ReturnType<typeof useTheme>, accentColor: string) =>
    StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        container: {
            flex: 1,
        },
        scrollContent: {
            paddingHorizontal: 16,
            paddingBottom: 40,
            gap: 14,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 6,
        },
        backButton: {
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: theme.colors.backgroundCard,
            borderWidth: 1,
            borderColor: theme.colors.border,
            justifyContent: 'center',
            alignItems: 'center',
        },
        title: {
            fontSize: 20,
            fontWeight: '800',
            color: theme.colors.text,
        },
        compatShortcut: {
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: theme.colors.backgroundCard,
            borderWidth: 1,
            borderColor: theme.colors.border,
            justifyContent: 'center',
            alignItems: 'center',
        },
        heroCard: {
            borderRadius: 24,
            padding: 22,
            alignItems: 'center',
            gap: 6,
        },
        emblemCircle: {
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: 'rgba(255,255,255,0.22)',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 4,
        },
        zodiacEmoji: {
            fontSize: 36,
        },
        zodiacName: {
            fontSize: 26,
            fontWeight: '800',
            color: '#FFFFFF',
        },
        zodiacDates: {
            fontSize: 13,
            color: 'rgba(255,255,255,0.88)',
        },
        metaPillsRow: {
            flexDirection: 'row',
            gap: 8,
            marginTop: 6,
        },
        metaPill: {
            backgroundColor: 'rgba(255,255,255,0.18)',
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: 12,
        },
        metaPillText: {
            fontSize: 12,
            fontWeight: '700',
            color: '#FFFFFF',
        },
        periodSegmented: {
            flexDirection: 'row',
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 16,
            padding: 4,
            borderWidth: 1,
            borderColor: theme.colors.border,
            gap: 4,
        },
        periodButton: {
            flex: 1,
            paddingVertical: 9,
            borderRadius: 12,
            alignItems: 'center',
        },
        periodButtonActive: {
            backgroundColor: accentColor,
        },
        periodButtonText: {
            fontSize: 13.5,
            fontWeight: '700',
            color: theme.colors.textSecondary,
        },
        periodButtonTextActive: {
            color: '#FFFFFF',
        },
        loaderBox: {
            paddingVertical: 32,
            alignItems: 'center',
        },
        card: {
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 20,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            gap: 12,
        },
        cardTitle: {
            fontSize: 16,
            fontWeight: '800',
            color: theme.colors.text,
        },
        horoscopeTitle: {
            fontSize: 17,
            fontWeight: '800',
            color: theme.colors.text,
        },
        horoscopeText: {
            fontSize: 14.5,
            color: theme.colors.textSecondary,
            lineHeight: 22,
        },
        affirmationBox: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            backgroundColor: theme.colors.backgroundSecondary,
            borderRadius: 12,
            padding: 12,
        },
        affirmationText: {
            flex: 1,
            fontSize: 13,
            fontStyle: 'italic',
            color: theme.colors.text,
            lineHeight: 19,
        },
        metricsStack: {
            gap: 10,
        },
        metricRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        },
        metricLabelGroup: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            width: 82,
        },
        metricLabel: {
            fontSize: 13,
            fontWeight: '600',
            color: theme.colors.text,
        },
        metricBarTrack: {
            flex: 1,
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.colors.background,
            overflow: 'hidden',
        },
        metricBarFill: {
            height: '100%',
            borderRadius: 4,
        },
        metricValue: {
            width: 30,
            textAlign: 'right',
            fontSize: 12.5,
            fontWeight: '700',
            color: theme.colors.textSecondary,
        },
        areaBlock: {
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            gap: 4,
        },
        areaTitle: {
            fontSize: 13.5,
            fontWeight: '700',
            color: theme.colors.text,
        },
        areaBody: {
            fontSize: 13.5,
            color: theme.colors.textSecondary,
            lineHeight: 20,
        },
        luckyGrid: {
            flexDirection: 'row',
            gap: 8,
        },
        luckyTile: {
            flex: 1,
            backgroundColor: theme.colors.background,
            borderRadius: 14,
            padding: 11,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
            gap: 4,
        },
        luckyLabel: {
            fontSize: 11,
            color: theme.colors.textLight,
            fontWeight: '600',
        },
        luckyValue: {
            fontSize: 13,
            fontWeight: '800',
            color: theme.colors.text,
        },
        compatibleRow: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: 4,
        },
        compatibleChip: {
            backgroundColor: theme.colors.background,
            borderWidth: 1,
            borderColor: theme.colors.border,
            paddingHorizontal: 11,
            paddingVertical: 6,
            borderRadius: 14,
        },
        compatibleChipText: {
            fontSize: 12.5,
            fontWeight: '600',
            color: theme.colors.text,
        },
    });
