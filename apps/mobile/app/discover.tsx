import { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
    useInfiniteArticles,
    useSavedArticles,
    useToggleSave,
} from '@/hooks/useDiscover';
import { ArticleCardDto } from '@/services/api';
import { ArticleCard } from '@/components/discover/ArticleCard';
import { SearchBar } from '@/components/discover/SearchBar';

const CATEGORIES = [
    { id: 'all', label: 'Tümü', icon: 'sparkles-outline' as const },
    { id: 'menstrual_health', label: 'Regl', icon: 'water-outline' as const },
    { id: 'pregnancy', label: 'Hamilelik', icon: 'heart-outline' as const },
    { id: 'fertility', label: 'Doğurganlık', icon: 'flower-outline' as const },
    { id: 'nutrition', label: 'Beslenme', icon: 'nutrition-outline' as const },
    { id: 'exercise', label: 'Egzersiz', icon: 'fitness-outline' as const },
    { id: 'mental_health', label: 'Mental', icon: 'leaf-outline' as const },
    { id: 'sleep', label: 'Uyku', icon: 'moon-outline' as const },
];

export default function DiscoverScreen() {
    const theme = useTheme();
    const router = useRouter();
    const styles = createStyles(theme);

    const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [search, setSearch] = useState<string>('');
    const [refreshing, setRefreshing] = useState(false);

    const {
        data: infiniteData,
        isLoading: articlesLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch: refetchArticles,
    } = useInfiniteArticles({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        search: search || undefined,
    });

    const {
        data: savedData,
        isLoading: savedLoading,
        refetch: refetchSaved,
    } = useSavedArticles();

    const toggleSaveMutation = useToggleSave();

    const articles = infiniteData?.pages.flatMap((page) => page.articles || []) || [];
    const savedArticles = savedData || [];
    const displayedArticles = activeTab === 'all' ? articles : savedArticles;
    const isLoading = activeTab === 'all' ? articlesLoading : savedLoading;

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await (activeTab === 'all' ? refetchArticles() : refetchSaved());
        setRefreshing(false);
    }, [activeTab, refetchArticles, refetchSaved]);

    const handleLoadMore = useCallback(() => {
        if (activeTab === 'all' && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [activeTab, hasNextPage, isFetchingNextPage, fetchNextPage]);

    const handleArticlePress = useCallback(
        (articleId: string) => {
            router.push(`/discover/article/${articleId}`);
        },
        [router]
    );

    const handleSaveToggle = useCallback(
        (article: ArticleCardDto) => {
            toggleSaveMutation.mutate(article.id);
        },
        [toggleSaveMutation]
    );

    const showFeatured = activeTab === 'all' && !search.trim() && displayedArticles.length > 0;

    const renderArticleItem = useCallback(
        ({ item, index }: { item: ArticleCardDto; index: number }) => (
            <ArticleCard
                article={item}
                variant={showFeatured && index === 0 ? 'featured' : 'horizontal'}
                onPress={() => handleArticlePress(item.id)}
                onSave={() => handleSaveToggle(item)}
            />
        ),
        [showFeatured, handleArticlePress, handleSaveToggle]
    );

    const renderFooter = () => {
        if (!isFetchingNextPage) return null;
        return (
            <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
        );
    };

    const renderEmpty = () => {
        if (isLoading) return null;

        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyIconBox}>
                    <Ionicons
                        name={activeTab === 'saved' ? 'bookmark-outline' : 'search-outline'}
                        size={32}
                        color={theme.colors.primary}
                    />
                </View>
                <Text style={styles.emptyTitle}>
                    {activeTab === 'saved'
                        ? 'Henüz kaydedilen makale yok'
                        : search
                          ? 'Sonuç bulunamadı'
                          : 'Bu kategoride makale yok'}
                </Text>
                <Text style={styles.emptyDescription}>
                    {activeTab === 'saved'
                        ? 'Beğendiğin rehberleri kalp ikonuna dokunarak burada saklayabilirsin.'
                        : search
                          ? 'Farklı bir anahtar kelime veya kategori deneyebilirsin.'
                          : 'Yakında bu konuda yeni içerikler eklenecek.'}
                </Text>
                {(search || selectedCategory !== 'all') && activeTab === 'all' && (
                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={() => {
                            setSearch('');
                            setSelectedCategory('all');
                        }}
                    >
                        <Text style={styles.resetButtonText}>Filtreleri Temizle</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Clean Compact Header */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <View style={styles.titleLeft}>
                        {router.canGoBack() && (
                            <TouchableOpacity
                                style={styles.backButton}
                                onPress={() => router.back()}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
                            </TouchableOpacity>
                        )}
                        <Text style={styles.headerTitle}>Bilgiler</Text>
                    </View>

                    {/* Segmented Pill Toggle */}
                    <View style={styles.segmentedControl}>
                        <TouchableOpacity
                            style={[styles.segment, activeTab === 'all' && styles.segmentActive]}
                            onPress={() => setActiveTab('all')}
                            activeOpacity={0.8}
                        >
                            <Text
                                style={[
                                    styles.segmentText,
                                    activeTab === 'all' && styles.segmentTextActive,
                                ]}
                            >
                                Tümü
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.segment, activeTab === 'saved' && styles.segmentActive]}
                            onPress={() => setActiveTab('saved')}
                            activeOpacity={0.8}
                        >
                            <Ionicons
                                name={activeTab === 'saved' ? 'heart' : 'heart-outline'}
                                size={13}
                                color={
                                    activeTab === 'saved'
                                        ? '#FFFFFF'
                                        : theme.colors.textSecondary
                                }
                            />
                            <Text
                                style={[
                                    styles.segmentText,
                                    activeTab === 'saved' && styles.segmentTextActive,
                                ]}
                            >
                                Kayıtlı{savedArticles.length > 0 ? ` (${savedArticles.length})` : ''}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {activeTab === 'all' && (
                    <SearchBar
                        value={search}
                        onChange={setSearch}
                        placeholder="Konu veya makale ara..."
                    />
                )}
            </View>

            {/* Compact Category Chips */}
            {activeTab === 'all' && (
                <View style={styles.categoriesContainer}>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.categoriesScroll}
                    >
                        {CATEGORIES.map((category) => {
                            const isSelected = selectedCategory === category.id;
                            return (
                                <TouchableOpacity
                                    key={category.id}
                                    style={[
                                        styles.categoryChip,
                                        isSelected && styles.categoryChipActive,
                                    ]}
                                    onPress={() => setSelectedCategory(category.id)}
                                    activeOpacity={0.75}
                                >
                                    <Ionicons
                                        name={category.icon}
                                        size={14}
                                        color={
                                            isSelected ? '#FFFFFF' : theme.colors.textSecondary
                                        }
                                    />
                                    <Text
                                        style={[
                                            styles.categoryChipText,
                                            isSelected && styles.categoryChipTextActive,
                                        ]}
                                    >
                                        {category.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            )}

            {/* Articles Feed */}
            {isLoading && displayedArticles.length === 0 ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={styles.loadingText}>İçerikler yükleniyor...</Text>
                </View>
            ) : (
                <FlatList
                    data={displayedArticles}
                    renderItem={renderArticleItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={theme.colors.primary}
                        />
                    }
                    onEndReached={handleLoadMore}
                    onEndReachedThreshold={0.4}
                    ListFooterComponent={renderFooter}
                    ListEmptyComponent={renderEmpty}
                    removeClippedSubviews={true}
                    maxToRenderPerBatch={10}
                    windowSize={7}
                    initialNumToRender={6}
                />
            )}
        </SafeAreaView>
    );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: theme.colors.background,
        },
        header: {
            paddingHorizontal: 16,
            paddingTop: 6,
            paddingBottom: 10,
            gap: 12,
        },
        titleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        titleLeft: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
        },
        backButton: {
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: theme.colors.backgroundCard,
            borderWidth: 1,
            borderColor: theme.colors.border,
            justifyContent: 'center',
            alignItems: 'center',
        },
        headerTitle: {
            fontSize: 26,
            fontWeight: '800',
            color: theme.colors.text,
            letterSpacing: -0.4,
        },
        segmentedControl: {
            flexDirection: 'row',
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 18,
            padding: 3,
            borderWidth: 1,
            borderColor: theme.colors.border,
            gap: 2,
        },
        segment: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 15,
        },
        segmentActive: {
            backgroundColor: theme.colors.primary,
        },
        segmentText: {
            fontSize: 13,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        segmentTextActive: {
            color: '#FFFFFF',
            fontWeight: '700',
        },
        categoriesContainer: {
            paddingBottom: 10,
        },
        categoriesScroll: {
            paddingHorizontal: 16,
            gap: 8,
        },
        categoryChip: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 13,
            paddingVertical: 7,
            borderRadius: 18,
            backgroundColor: theme.colors.backgroundCard,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        categoryChipActive: {
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
        },
        categoryChipText: {
            fontSize: 13,
            fontWeight: '600',
            color: theme.colors.textSecondary,
        },
        categoryChipTextActive: {
            color: '#FFFFFF',
            fontWeight: '700',
        },
        listContent: {
            paddingHorizontal: 16,
            paddingTop: 4,
            paddingBottom: 32,
            flexGrow: 1,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
        },
        loadingText: {
            fontSize: 14,
            color: theme.colors.textSecondary,
        },
        footerLoader: {
            paddingVertical: 16,
            alignItems: 'center',
        },
        emptyContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
            paddingVertical: 48,
        },
        emptyIconBox: {
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: theme.colors.backgroundCard,
            borderWidth: 1,
            borderColor: theme.colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 14,
        },
        emptyTitle: {
            fontSize: 17,
            fontWeight: '700',
            color: theme.colors.text,
            textAlign: 'center',
            marginBottom: 6,
        },
        emptyDescription: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
        },
        resetButton: {
            marginTop: 16,
            paddingHorizontal: 16,
            paddingVertical: 9,
            borderRadius: 18,
            backgroundColor: theme.colors.primary,
        },
        resetButtonText: {
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: '700',
        },
    });
