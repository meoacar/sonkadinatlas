import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import type { PremiumBenefitItem } from '@/types/subscription';

const DEFAULT_BENEFITS: PremiumBenefitItem[] = [
    {
        id: 'b1',
        icon: 'hardware-chip-outline',
        color: '#8B5CF6',
        title: 'Gelişmiş Hafıza',
        description: 'NOVA seni ve döngü geçmişini hatırlayarak yanıt verir',
        isActive: true,
    },
    {
        id: 'b2',
        icon: 'flash-outline',
        color: '#F59E0B',
        title: 'Öncelikli Hız',
        description: 'Yoğun saatlerde bile anında ve detaylı yanıtlar al',
        isActive: true,
    },
    {
        id: 'b3',
        icon: 'bulb-outline',
        color: '#EC4899',
        title: 'Kişisel İçgörüler',
        description: 'Semptom, uyku ve ruh hali verilerine özel analizler',
        isActive: true,
    },
    {
        id: 'b4',
        icon: 'planet-outline',
        color: '#6366F1',
        title: 'Astroloji Uyumu',
        description: 'Doğum haritası ve günlük kozmik rehberlik',
        isActive: true,
    },
    {
        id: 'b5',
        icon: 'analytics-outline',
        color: '#3B82F6',
        title: 'Detaylı Raporlar',
        description: 'Döngü ve wellness trendlerini derinlemesine incele',
        isActive: true,
    },
    {
        id: 'b6',
        icon: 'chatbubbles-outline',
        color: '#10B981',
        title: 'Yüksek Mesaj Kotası',
        description: 'Aylık 1000+ mesaj ile kesintisiz AI desteği',
        isActive: true,
    },
];

export function BenefitsSection({ items }: { items?: PremiumBenefitItem[] }) {
    const theme = useTheme();
    const styles = createStyles(theme);
    const activeItems = (items && items.length > 0 ? items : DEFAULT_BENEFITS).filter(
        (b) => b.isActive !== false,
    );

    if (activeItems.length === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Neler Kazanacaksın?</Text>
            <View style={styles.benefitsGrid}>
                {activeItems.map((benefit) => (
                    <View key={benefit.id || benefit.title} style={styles.benefitCard}>
                        <View style={[styles.iconContainer, { backgroundColor: `${benefit.color || '#8B5CF6'}16` }]}>
                            <Ionicons
                                name={(benefit.icon as keyof typeof Ionicons.glyphMap) || 'sparkles'}
                                size={20}
                                color={benefit.color || '#8B5CF6'}
                            />
                        </View>
                        <Text style={styles.benefitTitle}>{benefit.title}</Text>
                        <Text style={styles.benefitDescription}>{benefit.description}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: {},
        title: {
            fontSize: 16.5,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 12,
        },
        benefitsGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            rowGap: 10,
        },
        benefitCard: {
            width: '48.5%',
            backgroundColor: theme.colors.backgroundCard,
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        iconContainer: {
            width: 38,
            height: 38,
            borderRadius: 12,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 10,
        },
        benefitTitle: {
            fontSize: 14,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 4,
        },
        benefitDescription: {
            fontSize: 12,
            color: theme.colors.textSecondary,
            lineHeight: 17,
        },
    });
