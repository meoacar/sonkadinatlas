import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { VoteType } from '@/types/qna';
import { haptics } from '@/utils/haptics';
import { memo } from 'react';

interface VoteButtonProps {
    answerId: string;
    currentVote: VoteType | null;
    voteCount: number;
    onVote: (type: VoteType) => void;
    disabled?: boolean;
    isOwnAnswer?: boolean;
}

export const VoteButton = memo(function VoteButton({
    currentVote,
    voteCount,
    onVote,
    disabled = false,
    isOwnAnswer = false,
}: VoteButtonProps) {
    const theme = useTheme();
    const styles = createStyles(theme);

    const isUpvoted = currentVote === VoteType.UPVOTE;
    const isDownvoted = currentVote === VoteType.DOWNVOTE;

    const handlePress = (type: VoteType) => {
        haptics.selection();
        onVote(type);
    };

    return (
        <View style={[styles.container, isOwnAnswer && styles.ownContainer]}>
            <TouchableOpacity
                style={[styles.voteButton, isUpvoted && styles.upvotedButton]}
                onPress={() => handlePress(VoteType.UPVOTE)}
                disabled={disabled}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 4 }}
                accessibilityRole="button"
                accessibilityLabel="Olumlu oy ver"
                accessibilityState={{ selected: isUpvoted, disabled }}
            >
                <Ionicons
                    name={isUpvoted ? 'thumbs-up' : 'thumbs-up-outline'}
                    size={17}
                    color={isUpvoted ? theme.colors.success : theme.colors.textSecondary}
                />
            </TouchableOpacity>

            <Text
                style={[
                    styles.voteCount,
                    voteCount > 0 && styles.positiveCount,
                    voteCount < 0 && styles.negativeCount,
                ]}
            >
                {voteCount > 0 ? `+${voteCount}` : voteCount}
            </Text>

            <TouchableOpacity
                style={[styles.voteButton, isDownvoted && styles.downvotedButton]}
                onPress={() => handlePress(VoteType.DOWNVOTE)}
                disabled={disabled}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 4, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel="Olumsuz oy ver"
                accessibilityState={{ selected: isDownvoted, disabled }}
            >
                <Ionicons
                    name={isDownvoted ? 'thumbs-down' : 'thumbs-down-outline'}
                    size={17}
                    color={isDownvoted ? theme.colors.error : theme.colors.textSecondary}
                />
            </TouchableOpacity>
        </View>
    );
});

const createStyles = (theme: ReturnType<typeof useTheme>) =>
    StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: theme.colors.background,
            borderRadius: 12,
            padding: 4,
            borderWidth: 1,
            borderColor: theme.colors.border,
        },
        ownContainer: {
            opacity: 0.75,
        },
        voteButton: {
            width: 34,
            height: 34,
            borderRadius: 9,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'transparent',
        },
        upvotedButton: {
            backgroundColor: 'rgba(34, 197, 94, 0.16)',
        },
        downvotedButton: {
            backgroundColor: 'rgba(239, 68, 68, 0.16)',
        },
        voteCount: {
            fontSize: 14,
            fontWeight: '700',
            color: theme.colors.text,
            minWidth: 28,
            textAlign: 'center',
        },
        positiveCount: {
            color: theme.colors.success,
        },
        negativeCount: {
            color: theme.colors.error,
        },
    });
