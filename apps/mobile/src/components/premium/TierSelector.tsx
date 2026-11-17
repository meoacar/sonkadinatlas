import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import type { SubscriptionTier, PremiumPlanConfig } from '@/types/subscription';

interface TierOption {
    tier: SubscriptionTier;
    title: string;
    price: string;
    period: string;
    subtitle: string;
    savings?: string;
    badge?: string;
}

interface TierSelectorProps {
    selectedTier: SubscriptionTier;
    onSelectTier: (tier: SubscriptionTier) => void;
    monthlyPrice?: string;
    yearlyPrice?: string;
    yearlyPlan?: PremiumPlanConfig;
    monthlyPlan?: PremiumPlanConfig;
}

export function TierSelector({
    selectedTier,
    onSelectTier,
    monthlyPrice = '₺99',
    yearlyPrice = '₺999',
    yearlyPlan,
    monthlyPlan,
}: TierSelectorProps) {
    const theme = useTheme();
    const styles = createStyles(theme);

    const tiers: TierOption[] = [];

    if (!yearlyPlan || yearlyPlan.isActive !== false) {
        tiers.push({
            tier: 'YEARLY',
            title: yearlyPlan?.title || 'Yıllık Plan',
            price: yearlyPlan ? `${yearlyPlan.currencySymbol || '₺'}${yearlyPlan.price}` : yearlyPrice,
            period: 'yıl',
            subtitle: yearlyPlan?.subtitle || 'Aylık ~₺83 • En avantajlı seçenek',
            savings: yearlyPlan?.savingsText || (yearlyPlan ? undefined : '%17 Tasarruf'),
            badge: yearlyPlan?.badgeText || (yearlyPlan ? undefined : 'EN POPÜLER'),
        });
    }

    if (!monthlyPlan || monthlyPlan.isActive !== false) {
        tiers.push({
            tier: 'MONTHLY',
            title: monthlyPlan?.title || 'Aylık Plan',
            price: monthlyPlan ? `${monthlyPlan.currencySymbol || '₺'}${monthlyPlan.price}` : monthlyPrice,
            period: 'ay',
            subtitle: monthlyPlan?.subtitle || 'Esnek faturalandırma • İstediğin zaman iptal',
            savings: monthlyPlan?.savingsText || undefined,
            badge: monthlyPlan?.badgeText || undefined,
        });
    }

    return (
        <View style={styles.container}>
            {tiers.map((option) => {
                const selected = selectedTier === option.tier;
                return (
                    <TouchableOpacity
                        key={option.tier}
                        style={[styles.optionCard, selected && styles.optionCardSelected]}
                        onPress={() => onSelectTier(option.tier)}
                        activeOpacity={0.8}
                    >
                        {!!option.badge && (
                            <View style={styles.badge}>
                                <Ionicons name="sparkles" size={11} color="#FFFFFF" />
                                <Text style={styles.badgeText}>{option.badge}</Text>
                            </View>
                        )}

                        <View style={styles.leftRow}>
                            <View style={[styles.radio, selected && styles.radioSelected]}>
                                {selected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
                            </View>
                            <View style={{ flex: 1 }}>
                                <View style={styles.titleRow}>
                                    <Text style={[styles.tierTitle, selected && styles.tierTitleSelected]}>
                                        {option.title}
                                    </Text>
                                    {!!option.savings && (
                                        <View style={styles.savingsPill}>
                                            <Text style={styles.savingsText}>{option.savings}</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.subtitle}>{option.subtitle}</Text>
                            </View>
                        </View>

                        <View style={styles.priceBox}>
                            <Text style={[styles.price, selected && styles.priceSelected]}>
                                {option.price}
                            </Text>
                            <Text style={styles.period}>/{option.period}</Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: {
            gap: 12,
        },
        optionCard: {
            backgroundColor: theme.colors.backgroundCard,
            borderWidth: 1.5,
            borderColor: theme.colors.border,
            borderRadius: 18,
            paddingHorizontal: 16,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            gap: 12,
        },
        optionCardSelected: {
            borderColor: theme.colors.primary,
            borderWidth: 2,
            backgroundColor: 'rgba(139, 92, 246, 0.06)',
        },
        badge: {
            position: 'absolute',
            top: -10,
            right: 16,
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderRadius: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
        },
        badgeText: {
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '800',
            letterSpacing: 0.5,
        },
        leftRow: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
        },
        radio: {
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: theme.colors.border,
            justifyContent: 'center',
            alignItems: 'center',
        },
        radioSelected: {
            borderColor: theme.colors.primary,
            backgroundColor: theme.colors.primary,
        },
        titleRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            marginBottom: 2,
        },
        tierTitle: {
            fontSize: 15.5,
            fontWeight: '700',
            color: theme.colors.text,
        },
        tierTitleSelected: {
            color: theme.colors.primary,
        },
        savingsPill: {
            backgroundColor: 'rgba(16, 185, 129, 0.14)',
            paddingHorizontal: 7,
            paddingVertical: 2,
            borderRadius: 8,
        },
        savingsText: {
            fontSize: 10.5,
            fontWeight: '700',
            color: '#10B981',
        },
        subtitle: {
            fontSize: 12,
            color: theme.colors.textSecondary,
        },
        priceBox: {
            alignItems: 'flex-end',
        },
        price: {
            fontSize: 20,
            fontWeight: '800',
            color: theme.colors.text,
        },
        priceSelected: {
            color: theme.colors.primary,
        },
        period: {
            fontSize: 11.5,
            color: theme.colors.textSecondary,
            fontWeight: '600',
        },
    });
