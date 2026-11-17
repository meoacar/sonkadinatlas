import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { publicSupportService } from '@/services/api';

export type AccountStatusModalView = 'suspended' | 'support' | 'sent';

interface AccountStatusModalProps {
  visible: boolean;
  initialView?: 'suspended' | 'support';
  reasonMessage?: string | null;
  prefillEmail?: string | null;
  prefillName?: string | null;
  onClose: () => void;
}

const SUPPORT_CATEGORIES = [
  'Askıya Alınan Hesap İtirazı',
  'Giriş Sorunu',
  'Şifre / PIN Kilidi',
  'Diğer',
];

export function AccountStatusModal({
  visible,
  initialView = 'suspended',
  reasonMessage,
  prefillEmail,
  prefillName,
  onClose,
}: AccountStatusModalProps) {
  const theme = useTheme();
  const [view, setView] = useState<AccountStatusModalView>(initialView);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState(
    initialView === 'suspended' ? SUPPORT_CATEGORIES[0] : SUPPORT_CATEGORIES[1],
  );
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [ticketCode, setTicketCode] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setView(initialView);
    setFormError(null);
    setTicketCode(null);

    if (prefillEmail && prefillEmail.includes('@')) {
      setEmail(prefillEmail.trim());
    } else {
      setEmail('');
    }
    setName(prefillName?.trim() || '');
    setCategory(initialView === 'suspended' ? SUPPORT_CATEGORIES[0] : SUPPORT_CATEGORIES[1]);
    setSubject(
      initialView === 'suspended' ? 'Askıya Alınan Hesap İnceleme Talebi' : '',
    );
    setMessageText('');
  }, [visible, initialView, prefillEmail, prefillName]);

  const handleSubmitSupport = async () => {
    setFormError(null);
    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanSubject = subject.trim();
    const cleanMessage = messageText.trim();

    if (cleanName.length < 2) {
      setFormError('Lütfen adını soyadını gir.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setFormError('Yanıt alabilmen için geçerli bir e-posta adresi gir.');
      return;
    }
    if (cleanSubject.length < 3) {
      setFormError('Konu başlığı en az 3 karakter olmalıdır.');
      return;
    }
    if (cleanMessage.length < 10) {
      setFormError('Lütfen durumunu en az 10 karakter ile açıkla.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await publicSupportService.submitTicket({
        name: cleanName,
        email: cleanEmail,
        category,
        subject: cleanSubject,
        message: cleanMessage,
      });
      setTicketCode(res.ticketCode || res.id.slice(-6).toUpperCase());
      setView('sent');
    } catch (err: any) {
      setFormError(err?.message || 'Talebin şu an gönderilemedi. Lütfen tekrar dene.');
    } finally {
      setSubmitting(false);
    }
  };

  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.backdrop}
      >
        <View style={styles.card}>
          {view === 'suspended' && (
            <>
              <LinearGradient
                colors={
                  theme.isDark ? ['#3D1827', '#24142E'] : ['#FFF1F2', '#FEF3C7']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroHeader}
              >
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <View style={styles.iconRingOuter}>
                  <LinearGradient
                    colors={['#F43F5E', '#F59E0B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconBadge}
                  >
                    <Ionicons name="shield-outline" size={28} color="#FFFFFF" />
                  </LinearGradient>
                </View>

                <View style={styles.statusPill}>
                  <View style={styles.statusDot} />
                  <Text style={styles.statusPillText}>HESAP ERİŞİMİ KISITLANDI</Text>
                </View>

                <Text style={styles.heroTitle}>Hesabın Geçici Olarak Askıya Alındı</Text>
                <Text style={styles.heroSubtitle}>
                  {reasonMessage ||
                    'Güvenlik veya hesap politikası incelemesi nedeniyle bu hesaba erişim geçici olarak durduruldu.'}
                </Text>
              </LinearGradient>

              <View style={styles.cardBody}>
                <View style={styles.infoBox}>
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color={theme.colors.primary}
                    style={{ marginTop: 1 }}
                  />
                  <Text style={styles.infoBoxText}>
                    Bir hata olduğunu düşünüyorsan veya hesabını yeniden açtırmak istiyorsan
                    giriş yapmadan doğrudan destek ekibimize mesaj gönderebilirsin.
                  </Text>
                </View>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setView('support')}
                  style={styles.primaryCtaWrap}
                >
                  <LinearGradient
                    colors={['#EC4899', '#9333EA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryCta}
                  >
                    <Ionicons name="chatbubble-ellipses-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryCtaText}>Destek Ekibine Ulaş</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={onClose}
                  style={styles.secondaryBtn}
                >
                  <Text style={styles.secondaryBtnText}>Giriş Ekranına Dön</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {view === 'support' && (
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <LinearGradient
                colors={
                  theme.isDark ? ['#2A1836', '#1B1429'] : ['#FDF2F8', '#F3E8FF']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.supportHeader}
              >
                <View style={styles.supportHeaderRow}>
                  {initialView === 'suspended' ? (
                    <TouchableOpacity
                      onPress={() => setView('suspended')}
                      style={styles.headerActionBtn}
                    >
                      <Ionicons name="chevron-back" size={18} color={theme.colors.text} />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.headerSpacer} />
                  )}

                  <View style={styles.supportBadge}>
                    <Ionicons name="headset-outline" size={14} color={theme.colors.primary} />
                    <Text style={styles.supportBadgeText}>DESTEK EKİBİ</Text>
                  </View>

                  <TouchableOpacity onPress={onClose} style={styles.headerActionBtn}>
                    <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.supportTitle}>Giriş Yapmadan Destek Al</Text>
                <Text style={styles.supportSubtitle}>
                  Mesajın doğrudan destek ekibimize ulaşır, inceleme sonucu e-posta ile iletilir.
                </Text>
              </LinearGradient>

              <View style={styles.cardBody}>
                <Text style={styles.fieldLabel}>Konu Kategorisi</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                >
                  {SUPPORT_CATEGORIES.map((item) => {
                    const active = category === item;
                    return (
                      <TouchableOpacity
                        key={item}
                        onPress={() => {
                          setCategory(item);
                          if (!subject || SUPPORT_CATEGORIES.some((c) => subject.includes(c))) {
                            setSubject(
                              item === 'Askıya Alınan Hesap İtirazı'
                                ? 'Askıya Alınan Hesap İnceleme Talebi'
                                : item,
                            );
                          }
                        }}
                        style={[styles.chip, active && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={styles.fieldLabel}>Ad Soyad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Adın ve soyadın"
                  placeholderTextColor={theme.colors.textLight}
                  value={name}
                  onChangeText={setName}
                  editable={!submitting}
                />

                <Text style={styles.fieldLabel}>E-posta Adresi (Yanıt İçin)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="ornek@email.com"
                  placeholderTextColor={theme.colors.textLight}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!submitting}
                />

                <Text style={styles.fieldLabel}>Konu</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: Hesabımın incelenmesini istiyorum"
                  placeholderTextColor={theme.colors.textLight}
                  value={subject}
                  onChangeText={setSubject}
                  editable={!submitting}
                />

                <Text style={styles.fieldLabel}>Mesajın</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Durumunu kısaca açıkla (hesabının e-postası veya kullanıcı adını da belirtebilirsin)..."
                  placeholderTextColor={theme.colors.textLight}
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  textAlignVertical="top"
                  editable={!submitting}
                />

                {formError && (
                  <View style={styles.errorBanner}>
                    <Ionicons name="alert-circle" size={16} color="#DC2626" />
                    <Text style={styles.errorText}>{formError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={handleSubmitSupport}
                  disabled={submitting}
                  style={styles.primaryCtaWrap}
                >
                  <LinearGradient
                    colors={['#EC4899', '#9333EA']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryCta}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="send" size={16} color="#FFFFFF" />
                        <Text style={styles.primaryCtaText}>Destek Talebi Gönder</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}

          {view === 'sent' && (
            <View style={styles.sentWrap}>
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.sentIconCircle}
              >
                <Ionicons name="checkmark" size={34} color="#FFFFFF" />
              </LinearGradient>

              <Text style={styles.sentTitle}>Talebin Alındı</Text>
              {ticketCode && (
                <View style={styles.ticketPill}>
                  <Text style={styles.ticketPillText}>Talep Kodu: #{ticketCode}</Text>
                </View>
              )}
              <Text style={styles.sentDesc}>
                Mesajın destek ekibimize iletildi. İnceleme tamamlandığında{' '}
                <Text style={{ fontWeight: '700', color: theme.colors.text }}>{email}</Text>{' '}
                adresine dönüş yapacağız.
              </Text>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={onClose}
                style={[styles.primaryCtaWrap, { width: '100%', marginTop: 8 }]}
              >
                <LinearGradient
                  colors={['#EC4899', '#9333EA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primaryCta}
                >
                  <Text style={styles.primaryCtaText}>Tamam</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(15, 10, 25, 0.65)',
      justifyContent: 'center',
      paddingHorizontal: 18,
      paddingVertical: 24,
    },
    card: {
      maxHeight: '90%',
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 28,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOpacity: 0.25,
      shadowRadius: 24,
      shadowOffset: { width: 0, height: 12 },
      elevation: 14,
    },
    heroHeader: {
      paddingTop: 22,
      paddingBottom: 20,
      paddingHorizontal: 20,
      alignItems: 'center',
      position: 'relative',
    },
    closeBtn: {
      position: 'absolute',
      top: 14,
      right: 14,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconRingOuter: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: theme.isDark ? 'rgba(244,63,94,0.18)' : 'rgba(244,63,94,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    iconBadge: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: theme.isDark ? 'rgba(244,63,94,0.22)' : 'rgba(244,63,94,0.12)',
      marginBottom: 8,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#F43F5E',
    },
    statusPillText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.7,
      color: theme.isDark ? '#FDA4AF' : '#BE123C',
    },
    heroTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: 6,
    },
    heroSubtitle: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    cardBody: {
      padding: 20,
      gap: 10,
    },
    infoBox: {
      flexDirection: 'row',
      gap: 10,
      padding: 12,
      borderRadius: 16,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 4,
    },
    infoBoxText: {
      flex: 1,
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.colors.textSecondary,
    },
    primaryCtaWrap: {
      borderRadius: 16,
      overflow: 'hidden',
      marginTop: 4,
    },
    primaryCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 18,
    },
    primaryCtaText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    secondaryBtn: {
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 14,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
    },
    secondaryBtnText: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
    supportHeader: {
      padding: 18,
      alignItems: 'center',
    },
    supportHeaderRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    headerActionBtn: {
      width: 32,
      height: 32,
      borderRadius: 12,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.85)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerSpacer: {
      width: 32,
      height: 32,
    },
    supportBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: theme.colors.backgroundCard,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    supportBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.7,
      color: theme.colors.primary,
    },
    supportTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.text,
      marginBottom: 4,
      textAlign: 'center',
    },
    supportSubtitle: {
      fontSize: 12.5,
      lineHeight: 18,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    fieldLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    chipsRow: {
      gap: 8,
      paddingVertical: 2,
    },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
    },
    chipActive: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.isDark ? 'rgba(236,72,153,0.18)' : '#FDF2F8',
    },
    chipText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    chipTextActive: {
      color: theme.colors.primary,
    },
    input: {
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 11,
      fontSize: 14,
      color: theme.colors.text,
    },
    textArea: {
      minHeight: 88,
      paddingTop: 11,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      padding: 10,
      borderRadius: 12,
      backgroundColor: theme.isDark ? 'rgba(220,38,38,0.18)' : '#FEF2F2',
    },
    errorText: {
      flex: 1,
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.isDark ? '#FCA5A5' : '#B91C1C',
    },
    sentWrap: {
      padding: 26,
      alignItems: 'center',
      gap: 12,
    },
    sentIconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sentTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: theme.colors.text,
    },
    ticketPill: {
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: 999,
      backgroundColor: theme.isDark ? 'rgba(16,185,129,0.2)' : '#ECFDF5',
    },
    ticketPillText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.isDark ? '#6EE7B7' : '#047857',
    },
    sentDesc: {
      fontSize: 13.5,
      lineHeight: 20,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
  });
