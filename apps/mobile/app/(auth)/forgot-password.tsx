import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { authService } from '@/services/api';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleForgotPassword = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Eksik Bilgi', 'Lütfen e-posta adresini gir.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      Alert.alert('Geçersiz E-posta', 'Lütfen geçerli bir e-posta adresi gir.');
      return;
    }

    setLoading(true);
    try {
      await authService.forgotPassword({ email: trimmed });
      setEmailSent(true);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const styles = createStyles(theme);
  const canSubmit = Boolean(email.trim()) && !loading;

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
          {/* Top Bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.75}
              accessibilityLabel="Geri dön"
            >
              <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
            </TouchableOpacity>

            <View style={styles.pillBadge}>
              <Text style={styles.pillBadgeText}>ŞİFRE YENİLEME</Text>
            </View>

            <View style={styles.topSpacer} />
          </View>

          {emailSent ? (
            <View style={styles.stateWrap}>
              <LinearGradient
                colors={
                  theme.isDark ? ['#1D2E2A', '#171C24'] : ['#ECFDF5', '#F5F3FF']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.successHalo}>
                  <Ionicons
                    name="mail-open-outline"
                    size={34}
                    color={theme.colors.success}
                  />
                </View>
                <Text style={styles.title}>E-posta Gönderildi</Text>
                <Text style={styles.subtitle}>
                  <Text style={styles.emailHighlight}>{email.trim()}</Text> adresine
                  kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı birkaç
                  dakika içinde ulaşacaktır.
                </Text>
              </LinearGradient>

              <View style={styles.hintCard}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={styles.hintText}>
                  E-postayı gelen kutusunda göremiyorsan spam veya gereksiz
                  klasörünü kontrol etmeyi unutma.
                </Text>
              </View>

              <View style={styles.ctaSection}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => router.back()}
                  style={styles.ctaWrap}
                >
                  <LinearGradient
                    colors={['#EC4899', '#9333EA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                  >
                    <Text style={styles.ctaText}>Giriş Sayfasına Dön</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setEmailSent(false);
                    setEmail('');
                  }}
                  style={styles.secondaryLinkRow}
                >
                  <Text style={styles.secondaryLinkText}>
                    E-postayı almadın mı?{' '}
                    <Text style={styles.secondaryLinkBold}>Tekrar gönder</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.stateWrap}>
              <LinearGradient
                colors={
                  theme.isDark ? ['#2A1836', '#1B1429'] : ['#FFF0F7', '#F5EEFF']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.iconHalo}>
                  <Ionicons
                    name="key-outline"
                    size={32}
                    color={theme.colors.primary}
                  />
                </View>
                <Text style={styles.title}>Şifreni mi Unuttun?</Text>
                <Text style={styles.subtitle}>
                  Endişelenme. Kayıtlı e-posta adresini gir, sana güvenli bir
                  şifre sıfırlama bağlantısı gönderelim.
                </Text>
              </LinearGradient>

              <View style={styles.formCard}>
                <Text style={styles.label}>E-posta Adresi</Text>
                <View
                  style={[
                    styles.inputShell,
                    focused && styles.inputShellFocused,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={
                      focused ? theme.colors.primary : theme.colors.textLight
                    }
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="ornek@email.com"
                    placeholderTextColor={theme.colors.textLight}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    editable={!loading}
                    returnKeyType="send"
                    onSubmitEditing={handleForgotPassword}
                  />
                </View>
              </View>

              <View style={styles.ctaSection}>
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={handleForgotPassword}
                  disabled={!canSubmit}
                  style={[styles.ctaWrap, !canSubmit && styles.ctaWrapDisabled]}
                >
                  <LinearGradient
                    colors={
                      canSubmit
                        ? ['#EC4899', '#9333EA']
                        : theme.isDark
                        ? ['#2B2B30', '#2B2B30']
                        : ['#E5E7EB', '#E5E7EB']
                    }
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.ctaGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Text
                          style={[
                            styles.ctaText,
                            !canSubmit && styles.ctaTextDisabled,
                          ]}
                        >
                          Sıfırlama Bağlantısı Gönder
                        </Text>
                        <Ionicons
                          name="send-outline"
                          size={17}
                          color={
                            canSubmit ? '#FFFFFF' : theme.colors.textLight
                          }
                        />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.back()}
                  disabled={loading}
                  style={styles.secondaryLinkRow}
                >
                  <Text style={styles.secondaryLinkText}>
                    Şifreni hatırladın mı?{' '}
                    <Text style={styles.secondaryLinkBold}>Giriş yap</Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
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
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 24,
      gap: 16,
    },
    topBar: {
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
    pillBadge: {
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 20,
      backgroundColor: theme.colors.backgroundCard,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    pillBadgeText: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.8,
      color: theme.colors.primary,
    },
    topSpacer: {
      width: 40,
    },
    stateWrap: {
      flex: 1,
      justifyContent: 'center',
      gap: 16,
    },
    heroCard: {
      borderRadius: 26,
      paddingVertical: 26,
      paddingHorizontal: 20,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    iconHalo: {
      width: 74,
      height: 74,
      borderRadius: 26,
      backgroundColor: theme.colors.backgroundCard,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    successHalo: {
      width: 74,
      height: 74,
      borderRadius: 26,
      backgroundColor: theme.colors.backgroundCard,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 14,
      borderWidth: 1,
      borderColor: 'rgba(16, 185, 129, 0.35)',
    },
    title: {
      fontSize: 24,
      fontWeight: '800',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
    },
    emailHighlight: {
      color: theme.colors.text,
      fontWeight: '700',
    },
    formCard: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 22,
      padding: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 8,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    inputShell: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: theme.isDark ? '#121215' : '#F9FAFB',
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: 15,
      paddingHorizontal: 13,
      minHeight: 52,
    },
    inputShellFocused: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.backgroundCard,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.text,
      paddingVertical: 12,
    },
    hintCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 16,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    hintText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 19,
    },
    ctaSection: {
      gap: 12,
    },
    ctaWrap: {
      borderRadius: 18,
      overflow: 'hidden',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 12,
      elevation: 6,
    },
    ctaWrapDisabled: {
      shadowOpacity: 0,
      elevation: 0,
    },
    ctaGradient: {
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    ctaText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
    },
    ctaTextDisabled: {
      color: theme.colors.textLight,
    },
    secondaryLinkRow: {
      alignItems: 'center',
      paddingVertical: 6,
    },
    secondaryLinkText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    secondaryLinkBold: {
      color: theme.colors.primary,
      fontWeight: '700',
    },
  });
