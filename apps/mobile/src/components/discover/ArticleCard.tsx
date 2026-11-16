import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/hooks/useTheme';
import { Ionicons } from '@expo/vector-icons';
import { CategoryBadge } from './CategoryBadge';
import { memo, useState } from 'react';

interface ArticleCardProps {
    article: {
        id: string;
        title: string;
        excerpt: string;
        category: string;
        imageUrl?: string;
        thumbnailUrl?: string;
        readTimeMin: number;
        isSaved: boolean;
    };
    onPress: () => void;
    onSave: () => void;
    variant?: 'horizontal' | 'vertical' | 'grid' | 'featured';
}

export const ArticleCard = memo(function ArticleCard({
    article,
    onPress,
    onSave,
    variant = 'vertical'
}: ArticleCardProps) {
    const theme = useTheme();
    const styles = createStyles(theme, variant);
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);

    // Prefer thumbnail for list views, full image for detail
    const imageSource = article.thumbnailUrl || article.imageUrl;

    // Kategori bazlı gradient renkleri
    const getCategoryGradient = () => {
        const category = article.category.toLowerCase();
        if (category.includes('regl') || category.includes('adet') || category.includes('menstrual') || category.includes('pms')) {
            return ['#FF6B9D', '#C44569'] as const;
        }
        if (category.includes('hamile') || category.includes('gebelik') || category.includes('pregnancy')) {
            return ['#E879F9', '#A855F7'] as const;
        }
        if (category.includes('fertility') || category.includes('doğurgan')) {
            return ['#F472B6', '#DB2777'] as const;
        }
        if (category.includes('beslenme') || category.includes('diyet') || category.includes('nutrition')) {
            return ['#34D399', '#059669'] as const;
        }
        if (category.includes('egzersiz') || category.includes('spor') || category.includes('exercise')) {
            return ['#60A5FA', '#2563EB'] as const;
        }
        if (category.includes('ruh') || category.includes('mental') || category.includes('sleep')) {
            return ['#A78BFA', '#7C3AED'] as const;
        }
        return ['#EC4899', '#8B5CF6'] as const; // default
    };

    const gradientColors = getCategoryGradient();

    if (variant === 'featured') {
        const featuredSource = article.imageUrl || article.thumbnailUrl;
        return (
            <TouchableOpacity
                style={styles.featuredContainer}
                onPress={onPress}
                activeOpacity={0.9}
            >
                <View style={styles.featuredMedia}>
                    {featuredSource && !imageError ? (
                        <>
                            {!imageLoaded && (
                                <View style={[styles.featuredImage, styles.imagePlaceholder]} />
                            )}
                            <Image
                                source={{ uri: featuredSource }}
                                style={[styles.featuredImage, !imageLoaded && styles.imageHidden]}
                                resizeMode="cover"
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
                                fadeDuration={200}
                                progressiveRenderingEnabled={true}
                            />
                            <LinearGradient
                                colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.45)']}
                                style={styles.featuredScrim}
                            />
                        </>
                    ) : (
                        <LinearGradient
                            colors={gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.featuredFallback}
                        >
                            <Ionicons name="sparkles" size={36} color="rgba(255,255,255,0.85)" />
                        </LinearGradient>
                    )}

                    <View style={styles.featuredTopRow}>
                        <CategoryBadge category={article.category} size="small" />
                        <TouchableOpacity
                            style={styles.featuredSaveButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                onSave();
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons
                                name={article.isSaved ? 'heart' : 'heart-outline'}
                                size={18}
                                color={article.isSaved ? '#FF4D6D' : '#FFFFFF'}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.featuredContent}>
                    <Text style={styles.featuredTitle} numberOfLines={2}>
                        {article.title}
                    </Text>
                    {!!article.excerpt && (
                        <Text style={styles.featuredExcerpt} numberOfLines={2}>
                            {article.excerpt}
                        </Text>
                    )}
                    <View style={styles.featuredFooter}>
                        <View style={styles.readTimeRow}>
                            <Ionicons name="time-outline" size={14} color={theme.colors.textLight} />
                            <Text style={styles.readTime}>{article.readTimeMin} dk okuma</Text>
                        </View>
                        <View style={styles.readMoreRow}>
                            <Text style={styles.readMoreText}>Oku</Text>
                            <Ionicons name="arrow-forward" size={14} color={theme.colors.primary} />
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    if (variant === 'horizontal') {
        return (
            <TouchableOpacity
                style={styles.horizontalContainer}
                onPress={onPress}
                activeOpacity={0.8}
            >
                <View style={styles.horizontalMedia}>
                    {imageSource && !imageError ? (
                        <>
                            {!imageLoaded && (
                                <View style={[styles.horizontalImage, styles.imagePlaceholder]} />
                            )}
                            <Image
                                source={{ uri: imageSource }}
                                style={[styles.horizontalImage, !imageLoaded && styles.imageHidden]}
                                resizeMode="cover"
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
                                fadeDuration={200}
                                progressiveRenderingEnabled={true}
                                defaultSource={undefined}
                            />
                        </>
                    ) : (
                        <LinearGradient
                            colors={gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.horizontalFallback}
                        >
                            <Ionicons name="book-outline" size={26} color="rgba(255,255,255,0.9)" />
                        </LinearGradient>
                    )}
                </View>

                <View style={styles.horizontalContent}>
                    <View style={styles.horizontalHeader}>
                        <CategoryBadge category={article.category} size="small" />
                        <TouchableOpacity
                            style={styles.horizontalSaveButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                onSave();
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons
                                name={article.isSaved ? 'heart' : 'heart-outline'}
                                size={18}
                                color={article.isSaved ? theme.colors.error : theme.colors.textLight}
                            />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.horizontalTitle} numberOfLines={2}>
                        {article.title}
                    </Text>

                    <View style={styles.horizontalFooter}>
                        <View style={styles.readTimeRow}>
                            <Ionicons name="time-outline" size={13} color={theme.colors.textLight} />
                            <Text style={styles.readTime}>{article.readTimeMin} dk okuma</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // Grid variant - Pinterest/Instagram style
    if (variant === 'grid') {
        return (
            <TouchableOpacity
                style={styles.gridContainer}
                onPress={onPress}
                activeOpacity={0.9}
            >
                {imageSource && !imageError && (
                    <View style={styles.gridImageContainer}>
                        {!imageLoaded && (
                            <View style={[styles.gridImage, styles.imagePlaceholder]} />
                        )}
                        <Image
                            source={{ uri: imageSource }}
                            style={[styles.gridImage, !imageLoaded && styles.imageHidden]}
                            resizeMode="cover"
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageError(true)}
                            fadeDuration={150}
                            progressiveRenderingEnabled={true}
                        />
                        <TouchableOpacity
                            style={styles.gridSaveButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                onSave();
                            }}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                            <Ionicons
                                name={article.isSaved ? 'heart' : 'heart-outline'}
                                size={18}
                                color={article.isSaved ? theme.colors.error : '#fff'}
                            />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.gridContent}>
                    <CategoryBadge category={article.category} size="small" />
                    <Text style={styles.gridTitle} numberOfLines={2}>
                        {article.title}
                    </Text>
                    <Text style={styles.gridReadTime}>{article.readTimeMin} dk okuma</Text>
                </View>
            </TouchableOpacity>
        );
    }

    // Vertical variant
    return (
        <TouchableOpacity
            style={styles.verticalContainer}
            onPress={onPress}
            activeOpacity={0.85}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.verticalGradient}
            >
                {imageSource && !imageError && (
                    <View style={styles.imageContainer}>
                        {!imageLoaded && (
                            <View style={[styles.verticalImage, styles.imagePlaceholder]} />
                        )}
                        <Image
                            source={{ uri: imageSource }}
                            style={[styles.verticalImage, !imageLoaded && styles.imageHidden]}
                            resizeMode="cover"
                            onLoad={() => setImageLoaded(true)}
                            onError={() => setImageError(true)}
                            fadeDuration={200}
                            progressiveRenderingEnabled={true}
                            defaultSource={undefined}
                        />
                        {/* Gradient overlay on image */}
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.3)']}
                            style={styles.imageOverlay}
                        />
                    </View>
                )}
                <View style={styles.verticalContent}>
                    <View style={styles.verticalHeader}>
                        <View style={styles.categoryBadgeContainer}>
                            <CategoryBadge category={article.category} />
                        </View>
                        <View style={styles.metaRow}>
                            <Text style={styles.readTimeWhite}>{article.readTimeMin} dk</Text>
                            <TouchableOpacity
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onSave();
                                }}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                style={styles.saveButtonWhite}
                            >
                                <Ionicons
                                    name={article.isSaved ? 'heart' : 'heart-outline'}
                                    size={20}
                                    color="#FFFFFF"
                                />
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text style={styles.verticalTitleWhite} numberOfLines={2}>
                        {article.title}
                    </Text>
                    <Text style={styles.verticalExcerptWhite} numberOfLines={2}>
                        {article.excerpt}
                    </Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
});

const createStyles = (theme: ReturnType<typeof useTheme>, variant: 'horizontal' | 'vertical' | 'grid' | 'featured') =>
    StyleSheet.create({
        // Featured variant styles
        featuredContainer: {
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 20,
            overflow: 'hidden',
            marginBottom: 16,
            borderWidth: 1,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 12,
            elevation: 3,
        },
        featuredMedia: {
            position: 'relative',
            width: '100%',
            height: 184,
            backgroundColor: theme.colors.border,
        },
        featuredImage: {
            width: '100%',
            height: '100%',
        },
        featuredScrim: {
            ...StyleSheet.absoluteFillObject,
        },
        featuredFallback: {
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
        },
        featuredTopRow: {
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        featuredSaveButton: {
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: 'rgba(0, 0, 0, 0.42)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        featuredContent: {
            padding: 16,
        },
        featuredTitle: {
            fontSize: 18,
            fontWeight: '700',
            color: theme.colors.text,
            lineHeight: 24,
            marginBottom: 6,
        },
        featuredExcerpt: {
            fontSize: 13.5,
            color: theme.colors.textSecondary,
            lineHeight: 19,
            marginBottom: 12,
        },
        featuredFooter: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        readTimeRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        readMoreRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        readMoreText: {
            fontSize: 13,
            fontWeight: '600',
            color: theme.colors.primary,
        },

        // Grid variant styles - Pinterest/Instagram style
        gridContainer: {
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 16,
            overflow: 'hidden',
            marginBottom: theme.spacing.sm,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
        },
        gridImageContainer: {
            position: 'relative',
            width: '100%',
            aspectRatio: 0.75, // Portrait ratio like Pinterest
        },
        gridImage: {
            width: '100%',
            height: '100%',
            backgroundColor: theme.colors.border,
        },
        gridSaveButton: {
            position: 'absolute',
            top: theme.spacing.sm,
            right: theme.spacing.sm,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            backdropFilter: 'blur(10px)',
        },
        gridContent: {
            padding: theme.spacing.sm,
        },
        gridTitle: {
            fontSize: 14,
            fontWeight: '700',
            color: theme.colors.text,
            marginTop: theme.spacing.xs,
            marginBottom: theme.spacing.xs,
            lineHeight: 20,
        },
        gridReadTime: {
            fontSize: 11,
            color: theme.colors.textLight,
            fontWeight: '500',
        },

        // Vertical variant styles
        verticalContainer: {
            borderRadius: 24,
            overflow: 'hidden',
            width: 300,
            marginRight: theme.spacing.md,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 8,
        },
        verticalGradient: {
            borderRadius: 24,
        },
        verticalImage: {
            width: '100%',
            height: 180,
            backgroundColor: theme.colors.border,
        },
        imageOverlay: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
        },
        verticalContent: {
            padding: theme.spacing.lg,
        },
        verticalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing.md,
        },
        categoryBadgeContainer: {
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            borderRadius: 12,
            paddingHorizontal: 8,
            paddingVertical: 4,
        },
        metaRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.spacing.sm,
        },
        readTimeWhite: {
            fontSize: 12,
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '600',
        },
        saveButtonWhite: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            justifyContent: 'center',
            alignItems: 'center',
        },
        verticalTitle: {
            fontSize: 18,
            fontWeight: '800',
            color: theme.colors.text,
            marginBottom: theme.spacing.sm,
            lineHeight: 26,
        },
        verticalTitleWhite: {
            fontSize: 18,
            fontWeight: '800',
            color: '#FFFFFF',
            marginBottom: theme.spacing.sm,
            lineHeight: 26,
            textShadowColor: 'rgba(0, 0, 0, 0.15)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 3,
        },
        verticalExcerpt: {
            fontSize: 14,
            color: theme.colors.textSecondary,
            lineHeight: 21,
        },
        verticalExcerptWhite: {
            fontSize: 14,
            color: 'rgba(255, 255, 255, 0.95)',
            lineHeight: 21,
            fontWeight: '500',
        },

        // Horizontal variant styles
        horizontalContainer: {
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 16,
            overflow: 'hidden',
            flexDirection: 'row',
            alignItems: 'center',
            padding: 12,
            marginBottom: 12,
            borderWidth: 1,
            borderColor: theme.colors.border,
            shadowColor: theme.colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 8,
            elevation: 2,
            gap: 12,
        },
        horizontalMedia: {
            width: 96,
            height: 96,
            borderRadius: 12,
            overflow: 'hidden',
            backgroundColor: theme.colors.border,
        },
        horizontalImage: {
            width: '100%',
            height: '100%',
            backgroundColor: theme.colors.border,
        },
        horizontalFallback: {
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            alignItems: 'center',
        },
        horizontalContent: {
            flex: 1,
            minHeight: 92,
            justifyContent: 'space-between',
        },
        horizontalHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
        },
        horizontalTitle: {
            fontSize: 15,
            fontWeight: '700',
            color: theme.colors.text,
            lineHeight: 20,
            marginBottom: 6,
        },
        horizontalFooter: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        horizontalSaveButton: {
            padding: 4,
        },

        // Common styles
        readTime: {
            fontSize: 12,
            color: theme.colors.textLight,
            fontWeight: '500',
        },

        // Image loading states
        imageContainer: {
            position: 'relative',
        },
        imagePlaceholder: {
            backgroundColor: theme.colors.border,
        },
        imageHidden: {
            opacity: 0,
        },
    });
