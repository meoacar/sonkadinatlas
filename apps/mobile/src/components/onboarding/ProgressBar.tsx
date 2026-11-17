import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}

export function ProgressBar({
  currentStep,
  totalSteps,
  onBack,
  onSkip,
  skipLabel = 'Atla',
}: ProgressBarProps) {
  const theme = useTheme();
  const progress = Math.min(100, Math.max(0, (currentStep / totalSteps) * 100));

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            style={styles.backButton}
            activeOpacity={0.75}
            accessibilityLabel="Geri dön"
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.sidePlaceholder} />
        )}

        <View style={styles.stepPill}>
          <Text style={styles.stepPillText}>
            ADIM {currentStep} / {totalSteps}
          </Text>
        </View>

        {onSkip ? (
          <TouchableOpacity
            onPress={onSkip}
            style={styles.skipButton}
            activeOpacity={0.75}
          >
            <Text style={styles.skipText}>{skipLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.sidePlaceholder} />
        )}
      </View>

      <View style={styles.barContainer}>
        <LinearGradient
          colors={['#EC4899', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.barFill, { width: `${progress}%` }]}
        />
      </View>
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    container: {
      gap: 12,
      marginBottom: 14,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: theme.colors.backgroundCard,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sidePlaceholder: {
      width: 40,
    },
    stepPill: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.colors.backgroundCard,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    stepPillText: {
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: theme.colors.primary,
    },
    skipButton: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 14,
      backgroundColor: theme.isDark ? '#1F1F24' : '#FCE7F3',
    },
    skipText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.primary,
    },
    barContainer: {
      height: 6,
      backgroundColor: theme.isDark ? '#27272A' : '#FCE7F3',
      borderRadius: 3,
      overflow: 'hidden',
    },
    barFill: {
      height: '100%',
      borderRadius: 3,
    },
  });
