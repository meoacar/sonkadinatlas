import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ProgressBar } from './ProgressBar';

interface StepContainerProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle?: string;
  headerIcon?: keyof typeof Ionicons.glyphMap;
  onBack?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  children: React.ReactNode;
}

export function StepContainer({
  currentStep,
  totalSteps,
  title,
  subtitle,
  headerIcon,
  onBack,
  onSkip,
  skipLabel,
  children,
}: StepContainerProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <ProgressBar
              currentStep={currentStep}
              totalSteps={totalSteps}
              onBack={onBack}
              onSkip={onSkip}
              skipLabel={skipLabel}
            />

            {headerIcon ? (
              <LinearGradient
                colors={
                  theme.isDark ? ['#2A1836', '#1B1429'] : ['#FFF0F7', '#F5EEFF']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroIconWrap}>
                  <Ionicons
                    name={headerIcon}
                    size={22}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.heroTextCol}>
                  <Text style={styles.heroTitle}>{title}</Text>
                  {subtitle ? (
                    <Text style={styles.heroSubtitle}>{subtitle}</Text>
                  ) : null}
                </View>
              </LinearGradient>
            ) : (
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? (
                  <Text style={styles.subtitle}>{subtitle}</Text>
                ) : null}
              </View>
            )}

            <View style={styles.content}>{children}</View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
    },
    container: {
      flex: 1,
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 24,
    },
    heroCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderRadius: 22,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 16,
    },
    heroIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: theme.colors.backgroundCard,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    heroTextCol: {
      flex: 1,
      gap: 3,
    },
    heroTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.colors.text,
      letterSpacing: -0.2,
    },
    heroSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    header: {
      marginBottom: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    content: {
      flex: 1,
    },
  });
