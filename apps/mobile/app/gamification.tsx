import { useState, useMemo, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { gamificationService } from '@/services/gamification';
import type {
    GamificationStats,
    UserAchievement,
    UserInsight,
} from '@/types/gamification';

type TabKey = 'stats' | 'achievements' | 'insights';
type BadgeFilter = 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'STREAK' | 'DATA_ENTRY' | 'WELLNESS' | 'COMMUNITY';
type InsightFilter = 'ALL' | 'UNREAD' | 'cycle' | 'wellness' | 'mood' | 'symptoms' | 'streak';

const RARITY_META: Record<string, { label: string; color: string; gradient: [string, string] }> = {
    COMMON: { label: 'Yaygın', color: '#64748B', gradient: ['#94A3B8', '#64748B'] },
    RARE: { label: 'Nadir', color: '#3B82F6', gradient: ['#3B82F6', '#2563EB'] },
    EPIC: { label: 'Epik', color: '#9333EA', gradient: ['#A855F7', '#7E22CE'] },
    LEGENDARY: { label: 'Efsanevi', color: '#D97706', gradient: ['#F59E0B', '#D97706'] },
};

const INSIGHT_TYPE_META: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; label: string }> = {
    positive: { icon: 'trending-up', color: '#10B981', bg: 'rgba(16, 185, 129, 0.14)', label: 'Olumlu Gelişme' },
    achievement: { icon: 'trophy', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.14)', label: 'Başarım' },
    tip: { icon: 'bulb', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.14)', label: 'Kişisel İpucu' },
    warning: { icon: 'alert-circle', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.14)', label: 'Dikkat' },
    neutral: { icon: 'analytics', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.14)', label: 'Analiz' },
};

const INSIGHT_CATEGORY_LABELS: Record<string, string> = {
    cycle: 'Döngü',
    wellness: 'Wellness',
    mood: 'Ruh Hali',
    symptoms: 'Semptom',
    streak: 'Seri',
    general: 'Genel',
};

function getTarget(item: UserAchievement): number {
    if (item.target && item.target > 0) return item.target;
    const req = (item.achievement?.requirementJson as any) || {};
    return Math.max(Number(req.count || req.days || req.level || 1), 1);
}

function getRequirementLabel(item: UserAchievement): string {
    const req = (item.achievement?.requirementJson as any) || {};
    const target = getTarget(item);
    switch (req.type) {
        case 'streak':
            return `${target} gün üst üste kayıt tut`;
        case 'data_entry':
            return `${target} toplam veri girişi yap`;
        case 'water_logs':
            return `${target} kez su kaydı ekle`;
        case 'wellness':
            return `${target} wellness kaydı oluştur`;
        case 'symptoms':
            return `${target} semptom kaydet`;
        case 'cycles':
            return `${target} adet döngüsü kaydet`;
        case 'community_answers':
            return `Toplulukta ${target} cevap paylaş`;
        case 'community_questions':
            return `Toplulukta ${target} soru sor`;
        case 'level':
            return `${target}. seviyeye ulaş`;
        case 'manual':
            return 'Editör / Admin tarafından verilir';
        default:
            return item.achievement.descriptionTr;
    }
}

export default function GamificationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ tab?: string }>();
    const theme = useTheme();
    const queryClient = useQueryClient();

    const initialTab: TabKey =
        params.tab === 'achievements' || params.tab === 'insights' || params.tab === 'stats'
            ? params.tab
            : 'stats';

    const [selectedTab, setSelectedTab] = useState<TabKey>(initialTab);
    const [badgeFilter, setBadgeFilter] = useState<BadgeFilter>('ALL');
    const [insightFilter, setInsightFilter] = useState<InsightFilter>('ALL');
    const [selectedBadge, setSelectedBadge] = useState<UserAchievement | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (params.tab === 'achievements' || params.tab === 'insights' || params.tab === 'stats') {
            setSelectedTab(params.tab);
        }
    }, [params.tab]);

    const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery<GamificationStats>({
        queryKey: ['gamification-stats'],
        queryFn: () => gamificationService.getStats(),
        retry: 1,
    });

    const { data: achievements = [], isLoading: achievementsLoading, refetch: refetchAchievements } = useQuery<UserAchievement[]>({
        queryKey: ['gamification-achievements'],
        queryFn: () => gamificationService.getAchievements(),
    });

    const { data: insights = [], isLoading: insightsLoading, refetch: refetchInsights } = useQuery<UserInsight[]>({
        queryKey: ['gamification-insights'],
        queryFn: () => gamificationService.getInsights(true),
    });

    const generateInsightsMutation = useMutation({
        mutationFn: () => gamificationService.generateInsights(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gamification-insights'] });
            queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
        },
        onError: () => {
            Alert.alert('Hata', 'Yeni içgörüler oluşturulurken bir sorun oluştu.');
        },
    });

    const markReadMutation = useMutation({
        mutationFn: (id: string) => gamificationService.markInsightAsRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gamification-insights'] });
            queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => gamificationService.markAllInsightsAsRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gamification-insights'] });
            queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
        },
    });

    const resetMutation = useMutation({
        mutationFn: () => gamificationService.resetGamification(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gamification-stats'] });
            queryClient.invalidateQueries({ queryKey: ['gamification-achievements'] });
            queryClient.invalidateQueries({ queryKey: ['gamification-insights'] });
            Alert.alert('Başarılı', 'İlerleme verileri sıfırlandı.');
        },
        onError: () => {
            Alert.alert('Hata', 'Veriler sıfırlanırken bir hata oluştu.');
        },
    });

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                gamificationService.checkAchievements().catch(() => []),
                refetchStats(),
                refetchAchievements(),
                refetchInsights(),
            ]);
        } finally {
            setRefreshing(false);
        }
    }, [refetchStats, refetchAchievements, refetchInsights]);

    const handleReset = () => {
        Alert.alert(
            'İlerlemeyi Sıfırla',
            'Seviye, XP, seri ve kazanılan rozet kayıtlarınız sıfırlanacak. Emin misiniz?',
            [
                { text: 'İptal', style: 'cancel' },
                { text: 'Sıfırla', style: 'destructive', onPress: () => resetMutation.mutate() },
            ],
        );
    };

    const completedBadgesCount = useMemo(
        () => achievements.filter((a) => a.isCompleted).length,
        [achievements],
    );

    const unreadInsightsCount = useMemo(
        () => insights.filter((i) => !i.isRead).length,
        [insights],
    );

    const nextBadges = useMemo(() => {
        return achievements
            .filter((a) => !a.isCompleted)
            .sort((a, b) => {
                const pctA = a.progress / getTarget(a);
                const pctB = b.progress / getTarget(b);
                return pctB - pctA;
            })
            .slice(0, 2);
    }, [achievements]);

    const filteredAchievements = useMemo(() => {
        return achievements.filter((item) => {
            if (badgeFilter === 'COMPLETED') return item.isCompleted;
            if (badgeFilter === 'IN_PROGRESS') return !item.isCompleted;
            if (badgeFilter === 'STREAK' || badgeFilter === 'DATA_ENTRY' || badgeFilter === 'WELLNESS' || badgeFilter === 'COMMUNITY') {
                return item.achievement.category === badgeFilter;
            }
            return true;
        });
    }, [achievements, badgeFilter]);

    const filteredInsights = useMemo(() => {
        return insights.filter((item) => {
            if (insightFilter === 'UNREAD') return !item.isRead;
            if (insightFilter !== 'ALL') return item.category === insightFilter;
            return true;
        });
    }, [insights, insightFilter]);

    const styles = createStyles(theme);

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Top Bar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.headerIconBtn} activeOpacity={0.7}>
                    <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Başarılar & İçgörüler</Text>
                <TouchableOpacity onPress={handleReset} style={styles.headerIconBtn} activeOpacity={0.7}>
                    <Ionicons name="refresh-outline" size={20} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>

            {/* Segmented Pill Tabs */}
            <View style={styles.tabWrapper}>
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'stats' && styles.tabActive]}
                        onPress={() => setSelectedTab('stats')}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="stats-chart"
                            size={15}
                            color={selectedTab === 'stats' ? '#FFFFFF' : theme.colors.textSecondary}
                        />
                        <Text style={[styles.tabText, selectedTab === 'stats' && styles.tabTextActive]}>
                            Özet
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'achievements' && styles.tabActive]}
                        onPress={() => setSelectedTab('achievements')}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="trophy"
                            size={15}
                            color={selectedTab === 'achievements' ? '#FFFFFF' : theme.colors.textSecondary}
                        />
                        <Text style={[styles.tabText, selectedTab === 'achievements' && styles.tabTextActive]}>
                            Rozetler
                        </Text>
                        {achievements.length > 0 && (
                            <View style={[styles.tabBadge, selectedTab === 'achievements' && styles.tabBadgeActive]}>
                                <Text style={[styles.tabBadgeText, selectedTab === 'achievements' && styles.tabBadgeTextActive]}>
                                    {completedBadgesCount}/{achievements.length}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, selectedTab === 'insights' && styles.tabActive]}
                        onPress={() => setSelectedTab('insights')}
                        activeOpacity={0.8}
                    >
                        <Ionicons
                            name="bulb"
                            size={15}
                            color={selectedTab === 'insights' ? '#FFFFFF' : theme.colors.textSecondary}
                        />
                        <Text style={[styles.tabText, selectedTab === 'insights' && styles.tabTextActive]}>
                            İçgörüler
                        </Text>
                        {unreadInsightsCount > 0 && (
                            <View style={[styles.tabBadge, { backgroundColor: '#F43F5E' }]}>
                                <Text style={[styles.tabBadgeText, { color: '#FFFFFF' }]}>
                                    {unreadInsightsCount}
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={theme.colors.primary}
                    />
                }
            >
                {/* TAB 1: OVERVIEW / STATS */}
                {selectedTab === 'stats' && (
                    <>
                        {statsLoading ? (
                            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
                        ) : !stats ? (
                            <View style={styles.emptyCard}>
                                <Ionicons name="sparkles-outline" size={44} color={theme.colors.primary} />
                                <Text style={styles.emptyTitle}>Henüz İlerleme Yok</Text>
                                <Text style={styles.emptySubtext}>
                                    Takvime su, semptom veya ruh hali ekleyerek XP ve rozet kazanmaya başla!
                                </Text>
                                <TouchableOpacity
                                    style={styles.primaryCtaBtn}
                                    onPress={() => router.push('/(tabs)/calendar' as any)}
                                >
                                    <Text style={styles.primaryCtaText}>Takvime Git</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                {/* Level Hero */}
                                <LinearGradient
                                    colors={[theme.colors.primary, theme.colors.primaryDark]}
                                    style={styles.levelCard}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <View style={styles.levelTopRow}>
                                        <View>
                                            <Text style={styles.levelEyebrow}>SAĞLIK SEVİYEN</Text>
                                            <Text style={styles.levelNumber}>Seviye {stats.level}</Text>
                                        </View>
                                        <View style={styles.totalXpPill}>
                                            <Ionicons name="sparkles" size={14} color="#FDE047" />
                                            <Text style={styles.totalXpPillText}>{stats.totalXp} Toplam XP</Text>
                                        </View>
                                    </View>

                                    <View style={styles.xpBar}>
                                        <View
                                            style={[
                                                styles.xpProgress,
                                                { width: `${Math.min(Math.max(stats.levelProgress, 4), 100)}%` },
                                            ]}
                                        />
                                    </View>

                                    <View style={styles.xpFooterRow}>
                                        <Text style={styles.xpText}>
                                            {stats.xpProgress} / {stats.xpTotal} XP
                                        </Text>
                                        <Text style={styles.xpNeeded}>
                                            Sonraki seviyeye {stats.xpNeeded} XP
                                        </Text>
                                    </View>
                                </LinearGradient>

                                {/* Streak Card */}
                                <View style={styles.card}>
                                    <View style={styles.cardHeaderRow}>
                                        <View style={styles.cardTitleGroup}>
                                            <View style={[styles.iconBadge, { backgroundColor: 'rgba(249, 115, 22, 0.14)' }]}>
                                                <Ionicons name="flame" size={18} color="#F97316" />
                                            </View>
                                            <View>
                                                <Text style={styles.cardTitle}>Düzenli Takip Serisi</Text>
                                                <Text style={styles.cardSubtitle}>
                                                    Seri koruma: {(stats.streakFreezeLimit ?? 1) - (stats.streakFreezeUsed ?? 0)} / {stats.streakFreezeLimit ?? 1} hak
                                                </Text>
                                            </View>
                                        </View>
                                    </View>

                                    <View style={styles.streakContainer}>
                                        <View style={styles.streakItem}>
                                            <Text style={styles.streakNumber}>{stats.currentStreak}</Text>
                                            <Text style={styles.streakLabel}>Güncel Seri (Gün)</Text>
                                        </View>
                                        <View style={styles.streakDivider} />
                                        <View style={styles.streakItem}>
                                            <Text style={[styles.streakNumber, { color: '#F59E0B' }]}>
                                                {stats.longestStreak}
                                            </Text>
                                            <Text style={styles.streakLabel}>En Uzun Rekor</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* 2x2 Metrics Grid */}
                                <View style={styles.statsGrid}>
                                    <View style={styles.statCard}>
                                        <View style={[styles.iconBadge, { backgroundColor: 'rgba(99, 102, 241, 0.14)' }]}>
                                            <Ionicons name="calendar-outline" size={18} color="#6366F1" />
                                        </View>
                                        <Text style={styles.statNumber}>{stats.totalDataEntries}</Text>
                                        <Text style={styles.statLabel}>Veri Girişi</Text>
                                    </View>

                                    <View style={styles.statCard}>
                                        <View style={[styles.iconBadge, { backgroundColor: 'rgba(14, 165, 233, 0.14)' }]}>
                                            <Ionicons name="water-outline" size={18} color="#0EA5E9" />
                                        </View>
                                        <Text style={styles.statNumber}>{stats.totalWellnessLogs ?? 0}</Text>
                                        <Text style={styles.statLabel}>Wellness Kaydı</Text>
                                    </View>

                                    <View style={styles.statCard}>
                                        <View style={[styles.iconBadge, { backgroundColor: 'rgba(245, 158, 11, 0.14)' }]}>
                                            <Ionicons name="trophy-outline" size={18} color="#F59E0B" />
                                        </View>
                                        <Text style={styles.statNumber}>
                                            {completedBadgesCount}
                                            <Text style={styles.statDenominator}>/{achievements.length || stats.totalBadges || 0}</Text>
                                        </Text>
                                        <Text style={styles.statLabel}>Kazanılan Rozet</Text>
                                    </View>

                                    <TouchableOpacity
                                        style={styles.statCard}
                                        onPress={() => setSelectedTab('insights')}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[styles.iconBadge, { backgroundColor: 'rgba(236, 72, 153, 0.14)' }]}>
                                            <Ionicons name="bulb-outline" size={18} color="#EC4899" />
                                        </View>
                                        <Text style={styles.statNumber}>{insights.length}</Text>
                                        <Text style={styles.statLabel}>
                                            İçgörü {unreadInsightsCount > 0 ? `(${unreadInsightsCount} yeni)` : ''}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Upcoming / Closest Badges Preview */}
                                {nextBadges.length > 0 && (
                                    <View style={styles.card}>
                                        <View style={styles.sectionHeaderRow}>
                                            <Text style={styles.cardTitle}>Yaklaşan Rozetler</Text>
                                            <TouchableOpacity onPress={() => setSelectedTab('achievements')}>
                                                <Text style={styles.linkText}>Tümünü Gör →</Text>
                                            </TouchableOpacity>
                                        </View>

                                        <View style={{ gap: 12, marginTop: 10 }}>
                                            {nextBadges.map((item) => {
                                                const target = getTarget(item);
                                                const pct = Math.min((item.progress / target) * 100, 100);
                                                return (
                                                    <TouchableOpacity
                                                        key={item.id}
                                                        style={styles.upcomingRow}
                                                        onPress={() => setSelectedBadge(item)}
                                                        activeOpacity={0.8}
                                                    >
                                                        <View style={styles.upcomingEmojiBox}>
                                                            <Text style={{ fontSize: 22 }}>{item.achievement.iconEmoji || '🏆'}</Text>
                                                        </View>
                                                        <View style={{ flex: 1 }}>
                                                            <View style={styles.upcomingTitleLine}>
                                                                <Text style={styles.upcomingTitle}>{item.achievement.nameTr}</Text>
                                                                <Text style={styles.upcomingProgressText}>
                                                                    {item.progress}/{target}
                                                                </Text>
                                                            </View>
                                                            <View style={styles.progressBar}>
                                                                <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: theme.colors.primary }]} />
                                                            </View>
                                                        </View>
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}

                                {/* Quick Action Buttons */}
                                <View style={styles.quickActionsRow}>
                                    <TouchableOpacity
                                        style={styles.quickActionBtn}
                                        onPress={() => router.push('/(tabs)/calendar' as any)}
                                        activeOpacity={0.85}
                                    >
                                        <Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />
                                        <Text style={styles.quickActionText}>Takvime Veri Gir</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.quickActionBtn, { backgroundColor: theme.colors.primary }]}
                                        onPress={() => setSelectedTab('insights')}
                                        activeOpacity={0.85}
                                    >
                                        <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                                        <Text style={[styles.quickActionText, { color: '#FFFFFF' }]}>İçgörüleri Aç</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </>
                )}

                {/* TAB 2: ACHIEVEMENTS / BADGES */}
                {selectedTab === 'achievements' && (
                    <>
                        {/* Completion Banner */}
                        <View style={styles.summaryBanner}>
                            <View style={styles.summaryBannerTop}>
                                <View>
                                    <Text style={styles.summaryTitle}>Rozet Koleksiyonun</Text>
                                    <Text style={styles.summarySub}>
                                        {completedBadgesCount} / {achievements.length} rozet tamamlandı
                                    </Text>
                                </View>
                                <View style={styles.summaryPctPill}>
                                    <Text style={styles.summaryPctText}>
                                        %{achievements.length > 0 ? Math.round((completedBadgesCount / achievements.length) * 100) : 0}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.summaryBarTrack}>
                                <View
                                    style={[
                                        styles.summaryBarFill,
                                        {
                                            width: `${
                                                achievements.length > 0
                                                    ? Math.round((completedBadgesCount / achievements.length) * 100)
                                                    : 0
                                            }%`,
                                        },
                                    ]}
                                />
                            </View>
                        </View>

                        {/* Filter Chips */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterRow}
                        >
                            {[
                                { key: 'ALL', label: 'Tümü' },
                                { key: 'COMPLETED', label: 'Kazanılan' },
                                { key: 'IN_PROGRESS', label: 'Devam Eden' },
                                { key: 'STREAK', label: 'Seri' },
                                { key: 'DATA_ENTRY', label: 'Veri Girişi' },
                                { key: 'WELLNESS', label: 'Wellness' },
                                { key: 'COMMUNITY', label: 'Topluluk' },
                            ].map((f) => {
                                const active = badgeFilter === f.key;
                                return (
                                    <TouchableOpacity
                                        key={f.key}
                                        style={[styles.filterChip, active && styles.filterChipActive]}
                                        onPress={() => setBadgeFilter(f.key as BadgeFilter)}
                                    >
                                        <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                                            {f.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {achievementsLoading ? (
                            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
                        ) : filteredAchievements.length > 0 ? (
                            <View style={styles.achievementsList}>
                                {filteredAchievements.map((item) => {
                                    const rarity = RARITY_META[item.achievement.rarity] || RARITY_META.COMMON;
                                    const target = getTarget(item);
                                    const pct = Math.min((item.progress / target) * 100, 100);

                                    return (
                                        <TouchableOpacity
                                            key={item.id}
                                            activeOpacity={0.85}
                                            onPress={() => setSelectedBadge(item)}
                                            style={[
                                                styles.achievementCard,
                                                !item.isCompleted && styles.achievementCardLocked,
                                            ]}
                                        >
                                            <LinearGradient
                                                colors={item.isCompleted ? rarity.gradient : ['#94A3B8', '#64748B']}
                                                style={[
                                                    styles.achievementIconContainer,
                                                    !item.isCompleted && { opacity: 0.65 },
                                                ]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            >
                                                <Text style={styles.achievementIcon}>
                                                    {item.achievement.iconEmoji || '🏆'}
                                                </Text>
                                                {!item.isCompleted && (
                                                    <View style={styles.lockOverlay}>
                                                        <Ionicons name="lock-closed" size={10} color="#FFFFFF" />
                                                    </View>
                                                )}
                                            </LinearGradient>

                                            <View style={styles.achievementContent}>
                                                <View style={styles.achievementHeader}>
                                                    <Text style={styles.achievementName} numberOfLines={1}>
                                                        {item.achievement.nameTr}
                                                    </Text>
                                                    {item.isCompleted && (
                                                        <View style={styles.completedPill}>
                                                            <Ionicons name="checkmark" size={12} color="#10B981" />
                                                            <Text style={styles.completedPillText}>Kazanıldı</Text>
                                                        </View>
                                                    )}
                                                </View>

                                                <Text style={styles.achievementDescription}>
                                                    {item.achievement.descriptionTr}
                                                </Text>

                                                <View style={styles.progressContainer}>
                                                    <View style={styles.progressBar}>
                                                        <View
                                                            style={[
                                                                styles.progressFill,
                                                                {
                                                                    width: `${item.isCompleted ? 100 : pct}%`,
                                                                    backgroundColor: item.isCompleted ? '#10B981' : theme.colors.primary,
                                                                },
                                                            ]}
                                                        />
                                                    </View>
                                                    <Text style={styles.progressText}>
                                                        {Math.min(item.progress, target)} / {target}
                                                    </Text>
                                                </View>

                                                <View style={styles.achievementFooter}>
                                                    <View style={[styles.rarityPill, { backgroundColor: `${rarity.color}18` }]}>
                                                        <Text style={[styles.rarityBadge, { color: rarity.color }]}>
                                                            {rarity.label}
                                                        </Text>
                                                    </View>
                                                    <Text style={styles.pointsBadge}>+{item.achievement.points} XP</Text>
                                                </View>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={styles.emptyCard}>
                                <Ionicons name="trophy-outline" size={44} color={theme.colors.textLight} />
                                <Text style={styles.emptyTitle}>Bu filtrede rozet yok</Text>
                                <Text style={styles.emptySubtext}>
                                    Farklı bir kategori seçerek diğer rozetleri görebilirsin.
                                </Text>
                            </View>
                        )}
                    </>
                )}

                {/* TAB 3: INSIGHTS */}
                {selectedTab === 'insights' && (
                    <>
                        {/* Insights Toolbar */}
                        <View style={styles.insightsToolbar}>
                            <TouchableOpacity
                                style={styles.generateBtn}
                                onPress={() => generateInsightsMutation.mutate()}
                                disabled={generateInsightsMutation.isPending}
                                activeOpacity={0.85}
                            >
                                {generateInsightsMutation.isPending ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                                )}
                                <Text style={styles.generateBtnText}>Yeni Analiz Üret</Text>
                            </TouchableOpacity>

                            {unreadInsightsCount > 0 && (
                                <TouchableOpacity
                                    style={styles.markAllBtn}
                                    onPress={() => markAllReadMutation.mutate()}
                                    disabled={markAllReadMutation.isPending}
                                    activeOpacity={0.8}
                                >
                                    <Ionicons name="checkmark-done" size={16} color={theme.colors.primary} />
                                    <Text style={styles.markAllBtnText}>Tümünü Oku</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Insight Filter Chips */}
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.filterRow}
                        >
                            {[
                                { key: 'ALL', label: `Tümü (${insights.length})` },
                                { key: 'UNREAD', label: `Okunmamış (${unreadInsightsCount})` },
                                { key: 'wellness', label: 'Wellness' },
                                { key: 'cycle', label: 'Döngü' },
                                { key: 'symptoms', label: 'Semptom' },
                                { key: 'mood', label: 'Ruh Hali' },
                                { key: 'streak', label: 'Seri' },
                            ].map((f) => {
                                const active = insightFilter === f.key;
                                return (
                                    <TouchableOpacity
                                        key={f.key}
                                        style={[styles.filterChip, active && styles.filterChipActive]}
                                        onPress={() => setInsightFilter(f.key as InsightFilter)}
                                    >
                                        <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                                            {f.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {insightsLoading ? (
                            <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
                        ) : filteredInsights.length > 0 ? (
                            <View style={styles.insightsList}>
                                {filteredInsights.map((insight) => {
                                    const meta = INSIGHT_TYPE_META[insight.type] || INSIGHT_TYPE_META.neutral;
                                    const catLabel = INSIGHT_CATEGORY_LABELS[insight.category] || insight.category;
                                    return (
                                        <View
                                            key={insight.id}
                                            style={[
                                                styles.insightCard,
                                                !insight.isRead && styles.insightCardUnread,
                                            ]}
                                        >
                                            <View style={styles.insightTopRow}>
                                                <View style={[styles.insightIconCircle, { backgroundColor: meta.bg }]}>
                                                    <Ionicons name={meta.icon} size={18} color={meta.color} />
                                                </View>
                                                <View style={styles.insightMetaChips}>
                                                    <View style={[styles.categoryChip, { backgroundColor: meta.bg }]}>
                                                        <Text style={[styles.categoryChipText, { color: meta.color }]}>
                                                            {catLabel}
                                                        </Text>
                                                    </View>
                                                    {!insight.isRead && <View style={styles.unreadDot} />}
                                                </View>
                                            </View>

                                            <Text style={styles.insightTitle}>{insight.titleTr}</Text>
                                            <Text style={styles.insightMessage}>{insight.messageTr}</Text>

                                            <View style={styles.insightFooterRow}>
                                                <Text style={styles.insightDate}>
                                                    {new Date(insight.createdAt).toLocaleDateString('tr-TR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                    })}
                                                </Text>

                                                {!insight.isRead ? (
                                                    <TouchableOpacity
                                                        style={styles.markReadPill}
                                                        onPress={() => markReadMutation.mutate(insight.id)}
                                                    >
                                                        <Ionicons name="checkmark" size={14} color={theme.colors.primary} />
                                                        <Text style={styles.markReadText}>Okundu İşaretle</Text>
                                                    </TouchableOpacity>
                                                ) : (
                                                    <Text style={styles.readStatusText}>Okundu</Text>
                                                )}
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={styles.emptyCard}>
                                <Ionicons name="bulb-outline" size={44} color={theme.colors.primary} />
                                <Text style={styles.emptyTitle}>İçgörü Bulunamadı</Text>
                                <Text style={styles.emptySubtext}>
                                    Yeni Analiz Üret butonuna basarak mevcut verilerinden kişisel öneriler oluşturabilirsin.
                                </Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Badge Detail Modal */}
            <Modal
                visible={!!selectedBadge}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedBadge(null)}
            >
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setSelectedBadge(null)}
                >
                    {selectedBadge && (
                        <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
                            <LinearGradient
                                colors={
                                    selectedBadge.isCompleted
                                        ? (RARITY_META[selectedBadge.achievement.rarity]?.gradient || [theme.colors.primary, theme.colors.primaryDark])
                                        : ['#94A3B8', '#64748B']
                                }
                                style={styles.modalEmojiCircle}
                            >
                                <Text style={{ fontSize: 38 }}>
                                    {selectedBadge.achievement.iconEmoji || '🏆'}
                                </Text>
                            </LinearGradient>

                            <Text style={styles.modalTitle}>{selectedBadge.achievement.nameTr}</Text>
                            <Text style={styles.modalDesc}>{selectedBadge.achievement.descriptionTr}</Text>

                            <View style={styles.modalInfoBox}>
                                <Text style={styles.modalInfoLabel}>Kazanım Koşulu</Text>
                                <Text style={styles.modalInfoValue}>{getRequirementLabel(selectedBadge)}</Text>
                                <Text style={styles.modalInfoProgress}>
                                    İlerleme: {Math.min(selectedBadge.progress, getTarget(selectedBadge))} / {getTarget(selectedBadge)} • +{selectedBadge.achievement.points} XP
                                </Text>
                            </View>

                            {selectedBadge.isCompleted && selectedBadge.completedAt && (
                                <Text style={styles.modalCompletedDate}>
                                    {new Date(selectedBadge.completedAt).toLocaleDateString('tr-TR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}{' '}
                                    tarihinde kazanıldı
                                </Text>
                            )}

                            <TouchableOpacity
                                style={styles.modalCloseBtn}
                                onPress={() => setSelectedBadge(null)}
                            >
                                <Text style={styles.modalCloseBtnText}>Kapat</Text>
                            </TouchableOpacity>
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
            </Modal>
        </SafeAreaView>
    );
}

const createStyles = (theme: any) =>
    StyleSheet.create({
        safeArea: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
        },
        headerIconBtn: {
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: theme.colors.backgroundCard,
            borderWidth: 1,
            borderColor: theme.colors.border,
            alignItems: 'center',
            justifyContent: 'center',
        },
        headerTitle: {
            fontSize: 17,
            fontWeight: '700',
            color: theme.colors.text,
        },
        tabWrapper: {
            paddingHorizontal: 16,
            paddingBottom: 12,
        },
        tabs: {
            flexDirection: 'row',
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 16,
            padding: 4,
            borderWidth: 1,
            borderColor: theme.colors.border,
            gap: 4,
        },
        tab: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            paddingVertical: 10,
            borderRadius: 12,
        },
        tabActive: {
            backgroundColor: theme.colors.primary,
        },
        tabText: {
            fontSize: 13,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        tabTextActive: {
            color: '#FFFFFF',
        },
        tabBadge: {
            paddingHorizontal: 6,
            paddingVertical: 1,
            borderRadius: 8,
            backgroundColor: theme.colors.background,
        },
        tabBadgeActive: {
            backgroundColor: 'rgba(255,255,255,0.22)',
        },
        tabBadgeText: {
            fontSize: 10.5,
            fontWeight: '700',
            color: theme.colors.textSecondary,
        },
        tabBadgeTextActive: {
            color: '#FFFFFF',
        },
        container: {
            flex: 1,
        },
        contentContainer: {
            paddingHorizontal: 16,
            paddingBottom: 40,
        },
        loader: {
            marginVertical: 48,
        },
        levelCard: {
            borderRadius: 22,
            padding: 20,
            marginBottom: 14,
        },
        levelTopRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 16,
        },
        levelEyebrow: {
            fontSize: 11,
            fontWeight: '700',
            letterSpacing: 0.8,
            color: 'rgba(255, 255, 255, 0.78)',
            marginBottom: 2,
        },
        levelNumber: {
            fontSize: 28,
            fontWeight: '800',
            color: '#FFFFFF',
        },
        totalXpPill: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: 'rgba(255, 255, 255, 0.18)',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 14,
        },
        totalXpPillText: {
            fontSize: 12,
            fontWeight: '700',
            color: '#FFFFFF',
        },
        xpBar: {
            height: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 8,
        },
        xpProgress: {
            height: '100%',
            backgroundColor: '#FFFFFF',
            borderRadius: 4,
        },
        xpFooterRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        xpText: {
            fontSize: 12.5,
            fontWeight: '700',
            color: '#FFFFFF',
        },
        xpNeeded: {
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.85)',
        },
        card: {
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 18,
            padding: 16,
            marginBottom: 14,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        cardHeaderRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
        },
        cardTitleGroup: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
        },
        iconBadge: {
            width: 36,
            height: 36,
            borderRadius: 11,
            alignItems: 'center',
            justifyContent: 'center',
        },
        cardTitle: {
            fontSize: 15.5,
            fontWeight: '700',
            color: theme.colors.text,
        },
        cardSubtitle: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            marginTop: 1,
        },
        streakContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: theme.colors.background,
            borderRadius: 14,
            paddingVertical: 14,
        },
        streakItem: {
            flex: 1,
            alignItems: 'center',
        },
        streakNumber: {
            fontSize: 26,
            fontWeight: '800',
            color: '#F97316',
        },
        streakLabel: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            marginTop: 2,
            fontWeight: '500',
        },
        streakDivider: {
            width: 1,
            height: 36,
            backgroundColor: theme.colors.border,
        },
        statsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 14,
        },
        statCard: {
            width: '48%',
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 18,
            padding: 15,
            borderWidth: 1,
            borderColor: theme.colors.border,
            gap: 8,
        },
        statNumber: {
            fontSize: 22,
            fontWeight: '800',
            color: theme.colors.text,
        },
        statDenominator: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        statLabel: {
            fontSize: 12.5,
            fontWeight: '500',
            color: theme.colors.textSecondary,
        },
        sectionHeaderRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        linkText: {
            fontSize: 13,
            fontWeight: '600',
            color: theme.colors.primary,
        },
        upcomingRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            padding: 10,
            borderRadius: 14,
            backgroundColor: theme.colors.background,
        },
        upcomingEmojiBox: {
            width: 42,
            height: 42,
            borderRadius: 12,
            backgroundColor: theme.colors.backgroundCard,
            alignItems: 'center',
            justifyContent: 'center',
        },
        upcomingTitleLine: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 6,
        },
        upcomingTitle: {
            fontSize: 14,
            fontWeight: '600',
            color: theme.colors.text,
        },
        upcomingProgressText: {
            fontSize: 12,
            fontWeight: '700',
            color: theme.colors.primary,
        },
        quickActionsRow: {
            flexDirection: 'row',
            gap: 12,
            marginTop: 4,
        },
        quickActionBtn: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 13,
            borderRadius: 14,
            backgroundColor: theme.colors.backgroundCard,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        quickActionText: {
            fontSize: 13.5,
            fontWeight: '700',
            color: theme.colors.primary,
        },
        summaryBanner: {
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginBottom: 12,
        },
        summaryBannerTop: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
        },
        summaryTitle: {
            fontSize: 15.5,
            fontWeight: '700',
            color: theme.colors.text,
        },
        summarySub: {
            fontSize: 12.5,
            color: theme.colors.textSecondary,
            marginTop: 2,
        },
        summaryPctPill: {
            backgroundColor: 'rgba(139, 92, 246, 0.14)',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 12,
        },
        summaryPctText: {
            fontSize: 13,
            fontWeight: '800',
            color: theme.colors.primary,
        },
        summaryBarTrack: {
            height: 7,
            backgroundColor: theme.colors.background,
            borderRadius: 4,
            overflow: 'hidden',
        },
        summaryBarFill: {
            height: '100%',
            backgroundColor: theme.colors.primary,
            borderRadius: 4,
        },
        filterRow: {
            gap: 8,
            paddingBottom: 12,
        },
        filterChip: {
            paddingHorizontal: 13,
            paddingVertical: 7,
            borderRadius: 18,
            backgroundColor: theme.colors.backgroundCard,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        filterChipActive: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
        },
        filterChipText: {
            fontSize: 12.5,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        filterChipTextActive: {
            color: '#FFFFFF',
        },
        achievementsList: {
            gap: 10,
        },
        achievementCard: {
            flexDirection: 'row',
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 18,
            padding: 14,
            borderWidth: 1,
            borderColor: theme.colors.border,
            gap: 12,
            alignItems: 'center',
        },
        achievementCardLocked: {
            opacity: 0.9,
        },
        achievementIconContainer: {
            width: 56,
            height: 56,
            borderRadius: 18,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
        },
        achievementIcon: {
            fontSize: 27,
        },
        lockOverlay: {
            position: 'absolute',
            bottom: -3,
            right: -3,
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: '#475569',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: '#FFFFFF',
        },
        achievementContent: {
            flex: 1,
        },
        achievementHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginBottom: 3,
        },
        achievementName: {
            fontSize: 15,
            fontWeight: '700',
            color: theme.colors.text,
            flex: 1,
        },
        completedPill: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 3,
            backgroundColor: 'rgba(16, 185, 129, 0.14)',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 10,
        },
        completedPillText: {
            fontSize: 11,
            fontWeight: '700',
            color: '#10B981',
        },
        achievementDescription: {
            fontSize: 12.5,
            color: theme.colors.textSecondary,
            lineHeight: 17,
            marginBottom: 8,
        },
        progressContainer: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 8,
        },
        progressBar: {
            flex: 1,
            height: 6,
            backgroundColor: theme.colors.background,
            borderRadius: 3,
            overflow: 'hidden',
        },
        progressFill: {
            height: '100%',
            borderRadius: 3,
        },
        progressText: {
            fontSize: 11.5,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        achievementFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        rarityPill: {
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 8,
        },
        rarityBadge: {
            fontSize: 11,
            fontWeight: '700',
        },
        pointsBadge: {
            fontSize: 12,
            fontWeight: '700',
            color: theme.colors.primary,
        },
        insightsToolbar: {
            flexDirection: 'row',
            gap: 10,
            marginBottom: 12,
        },
        generateBtn: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 7,
            backgroundColor: theme.colors.primary,
            paddingVertical: 11,
            borderRadius: 14,
        },
        generateBtnText: {
            fontSize: 13.5,
            fontWeight: '700',
            color: '#FFFFFF',
        },
        markAllBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingHorizontal: 14,
            paddingVertical: 11,
            borderRadius: 14,
            backgroundColor: theme.colors.backgroundCard,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        markAllBtnText: {
            fontSize: 13,
            fontWeight: '600',
            color: theme.colors.primary,
        },
        insightsList: {
            gap: 12,
        },
        insightCard: {
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 18,
            padding: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        insightCardUnread: {
            borderColor: theme.colors.primary,
        },
        insightTopRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
        },
        insightIconCircle: {
            width: 36,
            height: 36,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
        },
        insightMetaChips: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        categoryChip: {
            paddingHorizontal: 9,
            paddingVertical: 4,
            borderRadius: 10,
        },
        categoryChipText: {
            fontSize: 11,
            fontWeight: '700',
        },
        unreadDot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#F43F5E',
        },
        insightTitle: {
            fontSize: 15.5,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 5,
        },
        insightMessage: {
            fontSize: 13.5,
            color: theme.colors.textSecondary,
            lineHeight: 20,
            marginBottom: 12,
        },
        insightFooterRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        insightDate: {
            fontSize: 12,
            color: theme.colors.textLight,
        },
        markReadPill: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 10,
            backgroundColor: 'rgba(139, 92, 246, 0.12)',
        },
        markReadText: {
            fontSize: 12,
            fontWeight: '600',
            color: theme.colors.primary,
        },
        readStatusText: {
            fontSize: 12,
            color: theme.colors.textLight,
            fontWeight: '500',
        },
        emptyCard: {
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 20,
            padding: 32,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: theme.colors.border,
            marginTop: 12,
        },
        emptyTitle: {
            fontSize: 17,
            fontWeight: '700',
            color: theme.colors.text,
            marginTop: 12,
            marginBottom: 6,
        },
        emptySubtext: {
            fontSize: 13.5,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 16,
        },
        primaryCtaBtn: {
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 20,
            paddingVertical: 11,
            borderRadius: 14,
        },
        primaryCtaText: {
            color: '#FFFFFF',
            fontSize: 14,
            fontWeight: '700',
        },
        modalBackdrop: {
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
        },
        modalCard: {
            width: '100%',
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 24,
            padding: 24,
            alignItems: 'center',
        },
        modalEmojiCircle: {
            width: 82,
            height: 82,
            borderRadius: 26,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
        },
        modalTitle: {
            fontSize: 20,
            fontWeight: '800',
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: 6,
        },
        modalDesc: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 16,
        },
        modalInfoBox: {
            width: '100%',
            backgroundColor: theme.colors.background,
            borderRadius: 16,
            padding: 14,
            marginBottom: 14,
            alignItems: 'center',
            gap: 4,
        },
        modalInfoLabel: {
            fontSize: 11,
            fontWeight: '700',
            color: theme.colors.textLight,
            textTransform: 'uppercase',
        },
        modalInfoValue: {
            fontSize: 14,
            fontWeight: '700',
            color: theme.colors.text,
            textAlign: 'center',
        },
        modalInfoProgress: {
            fontSize: 12.5,
            fontWeight: '600',
            color: theme.colors.primary,
            marginTop: 2,
        },
        modalCompletedDate: {
            fontSize: 12,
            color: '#10B981',
            fontWeight: '600',
            marginBottom: 14,
        },
        modalCloseBtn: {
            width: '100%',
            backgroundColor: theme.colors.primary,
            paddingVertical: 13,
            borderRadius: 14,
            alignItems: 'center',
        },
        modalCloseBtnText: {
            color: '#FFFFFF',
            fontSize: 14.5,
            fontWeight: '700',
        },
    });
