import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { QuestionCategory } from '@/types/qna';
import { memo } from 'react';

interface CategoryPillProps {
    category: QuestionCategory;
    size?: 'small' | 'medium';
}

export const CategoryPill = memo(function CategoryPill({
    category,
    size = 'medium',
}: CategoryPillProps) {
    const theme = useTheme();
    const styles = createStyles(theme, size);
    const config = getCategoryConfig(category);

    return (
        <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
            <Ionicons
                name={config.icon}
                size={size === 'small' ? 11 : 13}
                color={config.color}
            />
            <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
        </View>
    );
});

interface CategoryConfig {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
    backgroundColor: string;
}

function getCategoryConfig(category: QuestionCategory): CategoryConfig {
    const configs: Record<QuestionCategory, CategoryConfig> = {
        [QuestionCategory.MENSTRUAL_HEALTH]: {
            label: 'Adet Sağlığı',
            icon: 'water-outline',
            color: '#E11D48',
            backgroundColor: 'rgba(225, 29, 72, 0.12)',
        },
        [QuestionCategory.PREGNANCY]: {
            label: 'Hamilelik',
            icon: 'heart-outline',
            color: '#DB2777',
            backgroundColor: 'rgba(219, 39, 119, 0.12)',
        },
        [QuestionCategory.FERTILITY]: {
            label: 'Doğurganlık',
            icon: 'flower-outline',
            color: '#D97706',
            backgroundColor: 'rgba(217, 119, 6, 0.12)',
        },
        [QuestionCategory.NUTRITION]: {
            label: 'Beslenme',
            icon: 'nutrition-outline',
            color: '#059669',
            backgroundColor: 'rgba(5, 150, 105, 0.12)',
        },
        [QuestionCategory.EXERCISE]: {
            label: 'Egzersiz',
            icon: 'fitness-outline',
            color: '#2563EB',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
        },
        [QuestionCategory.MENTAL_HEALTH]: {
            label: 'Ruh Sağlığı',
            icon: 'leaf-outline',
            color: '#7C3AED',
            backgroundColor: 'rgba(124, 58, 237, 0.12)',
        },
        [QuestionCategory.SLEEP]: {
            label: 'Uyku',
            icon: 'moon-outline',
            color: '#4F46E5',
            backgroundColor: 'rgba(79, 70, 229, 0.12)',
        },
        [QuestionCategory.CONTRACEPTION]: {
            label: 'Doğum Kontrolü',
            icon: 'shield-checkmark-outline',
            color: '#0891B2',
            backgroundColor: 'rgba(8, 145, 178, 0.12)',
        },
        [QuestionCategory.PMS]: {
            label: 'PMS',
            icon: 'pulse-outline',
            color: '#DC2626',
            backgroundColor: 'rgba(220, 38, 38, 0.12)',
        },
        [QuestionCategory.MENOPAUSE]: {
            label: 'Menopoz',
            icon: 'sunny-outline',
            color: '#EA580C',
            backgroundColor: 'rgba(234, 88, 12, 0.12)',
        },
        [QuestionCategory.SEXUAL_HEALTH]: {
            label: 'Cinsel Sağlık',
            icon: 'sparkles-outline',
            color: '#BE185D',
            backgroundColor: 'rgba(190, 24, 93, 0.12)',
        },
        [QuestionCategory.GENERAL]: {
            label: 'Genel',
            icon: 'chatbubbles-outline',
            color: '#475569',
            backgroundColor: 'rgba(100, 116, 139, 0.14)',
        },
    };

    return configs[category] || configs[QuestionCategory.GENERAL];
}

const createStyles = (theme: ReturnType<typeof useTheme>, size: 'small' | 'medium') => {
    const isSmall = size === 'small';

    return StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: isSmall ? 4 : 5,
            paddingHorizontal: isSmall ? 8 : 10,
            paddingVertical: isSmall ? 3.5 : 5,
            borderRadius: 12,
        },
        text: {
            fontSize: isSmall ? 11 : 11.5,
            fontWeight: '700',
        },
    });
};
