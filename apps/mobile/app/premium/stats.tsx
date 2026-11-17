import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { subscriptionService, quotaService, qnaService } from '@/services/api';
import { useTheme } from '@/hooks/useTheme';
import type { QnaQuota } from '@/types/qna';
import type { Quota } from '@/types/subscription';

const FEATURE_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
    advanced_ai: { label: 'Gelişmiş AI (NOVA)', icon: 'sparkles', color: '#8B5CF6' },
    priority_response: { label: 'Öncelikli Yanıt Hızı', icon: 'flash', color: '#F59E0B' },
    insights: { label: 'Kişisel İçgörüler', icon: 'bulb', color: '#EC4899' },
    advanced_analytics: { label: 'Gelişmiş Analizler', icon: 'analytics', color: '#3B82F6' },
    customization: { label: 'Kişiselleştirme', icon: 'color-wand', color: '#10B981' },
};

export default function UsageStatsScreen() {
    const router = useRouter();
    const theme = useTheme();
    const { colors } = theme;
    const [refreshing, setRefreshing] = useState(false);

    const {
        data: stats,
        isLoading,
        error,
        refetch: refetchStats,
    } = useQuery({
        queryKey: ['usage-stats'],
        queryFn: () => subscriptionService.getUsageStats(),
    });

    const { data: subscription, refetch: refetchSubscription } = useQuery({
        queryKey: ['subscription'],
        queryFn: () => subscriptionService.getStatus(),
    });

    const { data: novaQuota, refetch: refetchNovaQuota } = useQuery<Quota>({
        queryKey: ['nova', 'quota'],
        queryFn: () => quotaService.getStatus() as Promise<Quota>,
    });

    const { data: qnaQuota, refetch: refetchQnaQuota } = useQuery<QnaQuota>({
        queryKey: ['qna', 'quota'],
        queryFn: () => qnaService.getQuota(),
    });

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await Promise.all([
            refetchStats(),
            refetchSubscription(),
            refetchNovaQuota(),
            refetchQnaQuota(),
        ]);
        setRefreshing(false);
    }, [refetchStats, refetchSubscription, refetchNovaQuota, refetchQnaQuota]);

    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} dk`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours} sa ${mins} dk` : `${hours} sa`;
    };

    const getMembershipDuration = () => {
        if (!stats?.memberSince) return 'Yeni Üye';
        const start = new Date(stats.memberSince);
        const now = new Date();
        const diffDays = Math.max(
            1,
            Math.ceil(Math.abs(now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
        );

        if (diffDays < 30) return `${diffDays} gün`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} ay`;
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        return months > 0 ? `${years} yıl ${months} ay` : `${years} yıl`;
    };

    const isPremium =
        subscription?.status === 'ACTIVE' ||
        subscription?.status === 'TRIAL' ||
        subscription?.status === 'GRACE_PERIOD';

    const planTitle =
        subscription?.status === 'TRIAL'
            ? 'Premium Deneme'
            : subscription?.tier === 'YEARLY'
              ? 'Yıllık Premium'
              : subscription?.tier === 'MONTHLY'
                ? 'Aylık Premium'
                : isPremium
                  ? 'Premium Üyelik'
                  : 'Ücretsiz Plan';

    const maxFeatureCount = useMemo(() => {
        if (!stats?.premiumFeaturesUsed?.length) return 1;
        return Math.max(...stats.premiumFeaturesUsed.map((f) => f.count), 1);
    }, [stats?.premiumFeaturesUsed]);

    const novaUsed = novaQuota?.used ?? 0;
    const novaLimit = novaQuota?.limit ?? 100;
    const novaPct = novaLimit > 0 ? Math.min(Math.round((novaUsed / novaLimit) * 100), 100) : 0;

    const qnaUsed = qnaQuota?.questionsAsked ?? 0;
    const qnaLimit = qnaQuota?.limit ?? 5;
    const qnaPct = qnaLimit > 0 ? Math.min(Math.round((qnaUsed / qnaLimit) * 100), 100) : 0;

    const styles = createStyles(colors);

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <Ionicons name="chevron-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Kullanım İstatistikleri</Text>
                    <View style={styles.iconPlaceholder} />
                </View>
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={styles.loadingText}>İstatistikler hazırlanıyor...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error || !stats) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
                        <Ionicons name="chevron-back" size={22} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Kullanım İstatistikleri</Text>
                    <View style={styles.iconPlaceholder} />
                </View>
                <View style={styles.centerState}>
                    <Ionicons name="cloud-offline-outline" size={56} color={colors.textSecondary} />
                    <Text style={styles.errorTitle}>İstatistikler Yüklenemedi</Text>
                    <Text style={styles.errorSubtext}>
                        Bağlantınızı kontrol edip tekrar deneyin.
                    </Text>
                    <TouchableOpacity style={styles.retryBtn} onPress={handleRefresh}>
                        <Ionicons name="refresh" size={16} color="#FFFFFF" />
                        <Text style={styles.retryBtnText}>Tekrar Dene</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={22} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Kullanım İstatistikleri</Text>
                <TouchableOpacity onPress={handleRefresh} style={styles.iconBtn} activeOpacity={0.7}>
                    <Ionicons name="refresh-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Hero Membership Card */}
                <LinearGradient
                    colors={
                        isPremium
                            ? [colors.primary, colors.primaryDark || '#6D28D9']
                            : ['#334155', '#1E293B']
                    }
                    style={styles.heroCard}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.heroTopRow}>
                        <View style={styles.planPill}>
                            <Ionicons
                                name={isPremium ? 'sparkles' : 'person-outline'}
                                size={13}
                                color="#FDE047"
                            />
                            <Text style={styles.planPillText}>
                                {isPremium ? 'AKTİF PREMIUM' : 'STANDART PLAN'}
                            </Text>
                        </View>
                        <Text style={styles.heroDuration}>{getMembershipDuration()}</Text>
                    </View>

                    <Text style={styles.heroTitle}>{planTitle}</Text>
                    <Text style={styles.heroSubtitle}>
                        {formatDate(stats.memberSince)} tarihinden beri üyesiniz
                        {subscription?.endDate && isPremium
                            ? ` • Bitiş: ${formatDate(subscription.endDate)}`
                            : ''}
                    </Text>

                    {!isPremium && (
                        <TouchableOpacity
                            style={styles.upgradeBtn}
                            onPress={() => router.push('/premium' as any)}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="diamond-outline" size={16} color="#7C3AED" />
                            <Text style={styles.upgradeBtnText}>Premium Avantajlarını Aç</Text>
                        </TouchableOpacity>
                    )}
                </LinearGradient>

                {/* 2x2 Main Stats Grid */}
                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.statIconBox, { backgroundColor: 'rgba(139, 92, 246, 0.14)' }]}>
                            <Ionicons name="chatbubbles" size={20} color="#8B5CF6" />
                        </View>
                        <Text style={styles.statValue}>
                            {stats.totalMessages.toLocaleString('tr-TR')}
                        </Text>
                        <Text style={styles.statLabel}>Toplam NOVA Mesajı</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.14)' }]}>
                            <Ionicons name="time" size={20} color="#10B981" />
                        </View>
                        <Text style={styles.statValue}>{formatDuration(stats.timeSaved)}</Text>
                        <Text style={styles.statLabel}>Tasarruf Edilen Süre</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
                            <Ionicons name="bulb" size={20} color="#F59E0B" />
                        </View>
                        <Text style={styles.statValue}>{stats.insightsGenerated}</Text>
                        <Text style={styles.statLabel}>Kişisel İçgörü</Text>
                    </View>

                    <View style={styles.statCard}>
                        <View style={[styles.statIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.14)' }]}>
                            <Ionicons name="flame" size={20} color="#EF4444" />
                        </View>
                        <Text style={styles.statValue}>{stats.currentStreak} gün</Text>
                        <Text style={styles.statLabel}>
                            Günlük Seri{stats.longestStreak ? ` (Rekor ${stats.longestStreak})` : ''}
                        </Text>
                    </View>
                </View>

                {/* Live Quotas Card */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="speedometer-outline" size={19} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Aylık Kota Kullanımı</Text>
                    </View>

                    <View style={styles.quotaBlock}>
                        <View style={styles.quotaLabelRow}>
                            <Text style={styles.quotaName}>NOVA AI Mesajları</Text>
                            <Text style={styles.quotaNumbers}>
                                {novaUsed} / {novaLimit}
                            </Text>
                        </View>
                        <View style={styles.progressTrack}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${novaPct}%`,
                                        backgroundColor: novaPct > 85 ? '#EF4444' : colors.primary,
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.quotaHint}>
                            Kalan: {novaQuota?.remaining ?? Math.max(0, novaLimit - novaUsed)} mesaj
                            {novaQuota?.resetDate ? ` • Yenileme: ${formatDate(novaQuota.resetDate)}` : ''}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.quotaBlock}>
                        <View style={styles.quotaLabelRow}>
                            <Text style={styles.quotaName}>Topluluk Soru Hakkı</Text>
                            <Text style={styles.quotaNumbers}>
                                {qnaUsed} / {qnaLimit}
                            </Text>
                        </View>
                        <View style={styles.progressTrack}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${qnaPct}%`,
                                        backgroundColor: '#EC4899',
                                    },
                                ]}
                            />
                        </View>
                        <Text style={styles.quotaHint}>
                            Kalan: {qnaQuota?.remaining ?? Math.max(0, qnaLimit - qnaUsed)} soru
                        </Text>
                    </View>
                </View>

                {/* Premium Features Breakdown */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="bar-chart-outline" size={19} color={colors.primary} />
                        <Text style={styles.sectionTitle}>Özellik Kullanım Dağılımı</Text>
                    </View>

                    {stats.premiumFeaturesUsed.length > 0 ? (
                        <View style={{ gap: 14 }}>
                            {stats.premiumFeaturesUsed.map((feature, index) => {
                                const meta = FEATURE_META[feature.feature] || {
                                    label: feature.feature,
                                    icon: 'star-outline' as const,
                                    color: colors.primary,
                                };
                                const pct = Math.max(
                                    8,
                                    Math.round((feature.count / maxFeatureCount) * 100),
                                );
                                return (
                                    <View key={index} style={styles.featureRow}>
                                        <View style={[styles.featureIconCircle, { backgroundColor: `${meta.color}18` }]}>
                                            <Ionicons name={meta.icon} size={17} color={meta.color} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={styles.quotaLabelRow}>
                                                <Text style={styles.featureName}>{meta.label}</Text>
                                                <Text style={[styles.featureCountText, { color: meta.color }]}>
                                                    {feature.count} kez
                                                </Text>
                                            </View>
                                            <View style={styles.progressTrack}>
                                                <View
                                                    style={[
                                                        styles.progressFill,
                                                        { width: `${pct}%`, backgroundColor: meta.color },
                                                    ]}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    ) : (
                        <Text style={styles.emptyFeaturesText}>
                            Henüz kayıtlı özellik kullanımı yok. NOVA sohbet veya kişisel içgörüleri kullandıkça burada görünecek.
                        </Text>
                    )}
                </View>

                {/* Quick Navigation */}
                <View style={styles.quickRow}>
                    <TouchableOpacity
                        style={styles.quickTile}
                        onPress={() => router.push('/(tabs)/chat' as any)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="sparkles" size={18} color={colors.primary} />
                        <Text style={styles.quickTileText}>NOVA'ya Sor</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickTile}
                        onPress={() => router.push('/gamification?tab=insights' as any)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
                        <Text style={styles.quickTileText}>İçgörüler</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickTile}
                        onPress={() => router.push('/premium' as any)}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="diamond-outline" size={18} color="#EC4899" />
                        <Text style={styles.quickTileText}>Planım</Text>
                    </TouchableOpacity>
                </View>

                {/* Benefits Summary */}
                <View style={styles.sectionCard}>
                    <View style={styles.sectionHeader}>
                        <Ionicons name="shield-checkmark-outline" size={19} color="#10B981" />
                        <Text style={styles.sectionTitle}>Premium Avantajları</Text>
                    </View>
                    <View style={styles.benefitsList}>
                        {[
                            'Gelişmiş AI modeli ile derin sağlık yanıtları',
                            'Öncelikli yanıt hızı ve yüksek aylık kota',
                            'Kişiselleştirilmiş döngü ve wellness içgörüleri',
                            'Detaylı kullanım analizleri ve burç uyumu',
                            'Reklamsız ve kesintisiz deneyim',
                        ].map((text) => (
                            <View key={text} style={styles.benefitItem}>
                                <Ionicons
                                    name={isPremium ? 'checkmark-circle' : 'ellipse-outline'}
                                    size={18}
                                    color={isPremium ? '#10B981' : colors.textSecondary}
                                />
                                <Text style={styles.benefitText}>{text}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const createStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        iconBtn: {
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: colors.backgroundCard,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
        },
        iconPlaceholder: {
            width: 38,
        },
        headerTitle: {
            fontSize: 17,
            fontWeight: '700',
            color: colors.text,
        },
        centerState: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
            gap: 10,
        },
        loadingText: {
            fontSize: 14,
            color: colors.textSecondary,
        },
        errorTitle: {
            fontSize: 17,
            fontWeight: '700',
            color: colors.text,
        },
        errorSubtext: {
            fontSize: 13.5,
            color: colors.textSecondary,
            textAlign: 'center',
        },
        retryBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: colors.primary,
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 12,
            marginTop: 6,
        },
        retryBtnText: {
            color: '#FFFFFF',
            fontWeight: '700',
            fontSize: 14,
        },
        scrollView: {
            flex: 1,
        },
        scrollContent: {
            paddingHorizontal: 16,
            paddingBottom: 36,
            gap: 14,
        },
        heroCard: {
            borderRadius: 22,
            padding: 20,
        },
        heroTopRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
        },
        planPill: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 12,
        },
        planPillText: {
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.6,
        },
        heroDuration: {
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: 13,
            fontWeight: '700',
        },
        heroTitle: {
            fontSize: 23,
            fontWeight: '800',
            color: '#FFFFFF',
            marginBottom: 4,
        },
        heroSubtitle: {
            fontSize: 12.5,
            color: 'rgba(255, 255, 255, 0.85)',
            lineHeight: 18,
        },
        upgradeBtn: {
            marginTop: 14,
            backgroundColor: '#FFFFFF',
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
        },
        upgradeBtnText: {
            color: '#7C3AED',
            fontSize: 13.5,
            fontWeight: '700',
        },
        statsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            rowGap: 12,
        },
        statCard: {
            width: '48.3%',
            backgroundColor: colors.backgroundCard,
            borderRadius: 18,
            padding: 15,
            borderWidth: 1,
            borderColor: colors.border,
        },
        statIconBox: {
            width: 38,
            height: 38,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
        },
        statValue: {
            fontSize: 21,
            fontWeight: '800',
            color: colors.text,
            marginBottom: 2,
        },
        statLabel: {
            fontSize: 12.5,
            color: colors.textSecondary,
            fontWeight: '500',
        },
        sectionCard: {
            backgroundColor: colors.backgroundCard,
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
        },
        sectionHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 14,
        },
        sectionTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
        },
        quotaBlock: {
            gap: 7,
        },
        quotaLabelRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        quotaName: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
        },
        quotaNumbers: {
            fontSize: 13.5,
            fontWeight: '700',
            color: colors.primary,
        },
        progressTrack: {
            height: 7,
            backgroundColor: colors.background,
            borderRadius: 4,
            overflow: 'hidden',
        },
        progressFill: {
            height: '100%',
            borderRadius: 4,
        },
        quotaHint: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        divider: {
            height: 1,
            backgroundColor: colors.border,
            marginVertical: 14,
        },
        featureRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        featureIconCircle: {
            width: 36,
            height: 36,
            borderRadius: 11,
            alignItems: 'center',
            justifyContent: 'center',
        },
        featureName: {
            fontSize: 13.5,
            fontWeight: '600',
            color: colors.text,
        },
        featureCountText: {
            fontSize: 13,
            fontWeight: '700',
        },
        emptyFeaturesText: {
            fontSize: 13,
            color: colors.textSecondary,
            lineHeight: 19,
        },
        quickRow: {
            flexDirection: 'row',
            gap: 10,
        },
        quickTile: {
            flex: 1,
            backgroundColor: colors.backgroundCard,
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 8,
            alignItems: 'center',
            gap: 5,
            borderWidth: 1,
            borderColor: colors.border,
        },
        quickTileText: {
            fontSize: 12,
            fontWeight: '700',
            color: colors.text,
        },
        benefitsList: {
            gap: 10,
        },
        benefitItem: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        },
        benefitText: {
            flex: 1,
            fontSize: 13.5,
            color: colors.text,
            lineHeight: 19,
        },
    });
