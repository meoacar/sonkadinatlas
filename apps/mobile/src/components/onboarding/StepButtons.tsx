import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface StepButtonsProps {
  onNext: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  skipLabel?: string;
  backLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  hideNextIcon?: boolean;
}

export function StepButtons({
  onNext,
  onSkip,
  onBack,
  nextLabel = 'Devam Et',
  skipLabel = 'Şimdilik Atla',
  backLabel = 'Önceki Adım',
  nextDisabled = false,
  loading = false,
  hideNextIcon = false,
}: StepButtonsProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  const disabled = nextDisabled || loading;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onNext}
        disabled={disabled}
        style={[styles.primaryWrap, disabled && styles.primaryWrapDisabled]}
      >
        <LinearGradient
          colors={
            disabled
              ? theme.isDark
                ? ['#2B2B30', '#2B2B30']
                : ['#E5E7EB', '#E5E7EB']
              : ['#EC4899', '#9333EA']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryGradient}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text
                style={[styles.primaryText, disabled && styles.primaryTextDisabled]}
                numberOfLines={1}
              >
                {nextLabel}
              </Text>
              {!hideNextIcon && (
                <Ionicons
                  name="arrow-forward"
                  size={18}
                  color={disabled ? theme.colors.textLight : '#FFFFFF'}
                />
              )}
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {(onBack || onSkip) && (
        <View style={styles.secondaryRow}>
          {onBack ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onBack}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Ionicons
                name="chevron-back"
                size={15}
                color={theme.colors.textSecondary}
              />
              <Text style={styles.secondaryBackText}>{backLabel}</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}

          {onSkip ? (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={onSkip}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={styles.secondarySkipText}>{skipLabel}</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      marginTop: 'auto',
      paddingTop: 18,
      gap: 10,
    },
    primaryWrap: {
      borderRadius: 18,
      overflow: 'hidden',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    primaryWrapDisabled: {
      shadowOpacity: 0,
      elevation: 0,
    },
    primaryGradient: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 20,
    },
    primaryText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    primaryTextDisabled: {
      color: theme.colors.textLight,
    },
    secondaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    secondaryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      paddingVertical: 6,
      paddingHorizontal: 4,
    },
    secondaryBackText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    secondarySkipText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },
  });
