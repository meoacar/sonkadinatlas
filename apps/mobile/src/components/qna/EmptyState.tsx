import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

export type EmptyStateType = 'questions' | 'answers' | 'comments' | 'favorites' | 'following' | 'search' | 'generic';

interface EmptyStateProps {
    type?: EmptyStateType;
    title?: string;
    message?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    actionLabel?: string;
    onAction?: () => void;
    showAction?: boolean;
}

const EMPTY_STATE_CONFIGS: Record<
    EmptyStateType,
    { icon: keyof typeof Ionicons.glyphMap; title: string; message: string }
> = {
    questions: {
        icon: 'chatbubbles-outline',
        title: 'Henüz Soru Yok',
        message: 'İlk soruyu sorarak topluluk sohbetini başlatabilirsiniz.',
    },
    answers: {
        icon: 'chatbubble-ellipses-outline',
        title: 'Henüz Cevap Yok',
        message: 'İlk cevabı siz verin ve topluluğa katkıda bulunun!',
    },
    comments: {
        icon: 'chatbox-outline',
        title: 'Henüz Yorum Yok',
        message: 'İlk yorumu siz yapın.',
    },
    favorites: {
        icon: 'heart-outline',
        title: 'Favori Sorunuz Yok',
        message: 'İlginizi çeken soruları favorilerinize ekleyin.',
    },
    following: {
        icon: 'notifications-outline',
        title: 'Takip Ettiğiniz Soru Yok',
        message: 'Soruları takip ederek güncellemelerden haberdar olun.',
    },
    search: {
        icon: 'search-outline',
        title: 'Sonuç Bulunamadı',
        message: 'Arama kriterlerinizi değiştirerek tekrar deneyin.',
    },
    generic: {
        icon: 'document-text-outline',
        title: 'İçerik Yok',
        message: 'Henüz gösterilecek içerik bulunmuyor.',
    },
};

export function EmptyState({
    type = 'generic',
    title,
    message,
    icon,
    actionLabel,
    onAction,
    showAction = true,
}: EmptyStateProps) {
    const theme = useTheme();
    const styles = createStyles(theme);

    const config = EMPTY_STATE_CONFIGS[type];
    const displayTitle = title || config.title;
    const displayMessage = message || config.message;
    const displayIcon = icon || config.icon;

    return (
        <View style={styles.container}>
            <View style={styles.iconCircle}>
                <Ionicons name={displayIcon} size={32} color={theme.colors.primary} />
            </View>
            <Text style={styles.title}>{displayTitle}</Text>
            <Text style={styles.message}>{displayMessage}</Text>
            {showAction && onAction && actionLabel && (
                <TouchableOpacity style={styles.actionButton} onPress={onAction} activeOpacity={0.85}>
                    <Ionicons name="add" size={18} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>{actionLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            padding: 28,
            minHeight: 260,
        },
        iconCircle: {
            width: 68,
            height: 68,
            borderRadius: 34,
            backgroundColor: theme.colors.backgroundSecondary,
            borderWidth: 1,
            borderColor: theme.colors.border,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 14,
        },
        title: {
            fontSize: 17,
            fontWeight: '700',
            color: theme.colors.text,
            marginBottom: 6,
            textAlign: 'center',
        },
        message: {
            fontSize: 13.5,
            color: theme.colors.textSecondary,
            textAlign: 'center',
            lineHeight: 20,
            marginBottom: 18,
            paddingHorizontal: 12,
        },
        actionButton: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: theme.colors.primary,
            paddingHorizontal: 18,
            paddingVertical: 11,
            borderRadius: 16,
        },
        actionButtonText: {
            fontSize: 14,
            fontWeight: '700',
            color: '#fff',
        },
    });
