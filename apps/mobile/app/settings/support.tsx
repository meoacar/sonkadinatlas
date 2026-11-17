import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { api } from '@/services/api';

interface SupportTicket {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  adminNote?: string | null;
  createdAt: string;
}

const CATEGORIES = [
  'Genel',
  'Teknik Sorun',
  'Abonelik',
  'Gizlilik',
  'Öneri',
];

const STATUS_META: Record<
  SupportTicket['status'],
  { label: string; color: string; bg: string }
> = {
  OPEN: {
    label: 'Açık',
    color: '#D97706',
    bg: 'rgba(245, 158, 11, 0.14)',
  },
  IN_PROGRESS: {
    label: 'İnceleniyor',
    color: '#2563EB',
    bg: 'rgba(59, 130, 246, 0.14)',
  },
  RESOLVED: {
    label: 'Çözüldü',
    color: '#059669',
    bg: 'rgba(16, 185, 129, 0.14)',
  },
};

export default function SupportScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [category, setCategory] = useState('Genel');
  const [subject, setSubject] = useState('');
  const [messageText, setMessageText] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await api.get<SupportTicket[]>('/support/my-tickets');
      if (Array.isArray(res)) {
        setTickets(res);
      }
    } catch {
      // Silently ignore if offline
    } finally {
      setLoadingTickets(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTickets();
    setRefreshing(false);
  };

  const handleSubmit = async () => {
    if (subject.trim().length < 3) {
      Alert.alert('Eksik Konu', 'Konu başlığı en az 3 karakter olmalıdır.');
      return;
    }
    if (messageText.trim().length < 10) {
      Alert.alert('Eksik Mesaj', 'Mesajınız en az 10 karakter olmalıdır.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.post<SupportTicket>('/support/tickets', {
        category,
        subject: subject.trim(),
        message: messageText.trim(),
      });
      setTickets((prev) => [created, ...prev]);
      setSubject('');
      setMessageText('');
      Alert.alert(
        'Mesajınız İletildi',
        'Destek ekibimiz talebinizi inceleyip yanıtını bu ekrandan paylaşacaktır.',
      );
    } catch (err: any) {
      Alert.alert(
        'Gönderilemedi',
        err?.message || 'Talebiniz gönderilirken bir hata oluştu.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit =
    subject.trim().length >= 3 && messageText.trim().length >= 10 && !submitting;

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            activeOpacity={0.75}
          >
            <Ionicons name="chevron-back" size={20} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Destek & İletişim</Text>
          <View style={styles.topSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }
        >
          {/* Hero Banner */}
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
                name="chatbubble-ellipses-outline"
                size={24}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.heroTextCol}>
              <Text style={styles.heroTitle}>Bize Ulaş</Text>
              <Text style={styles.heroSubtitle}>
                Sorun, öneri veya görüşünü doğrudan destek ekibimize ilet;
                yanıtları buradan takip et.
              </Text>
            </View>
          </LinearGradient>

          {/* Direct Contact Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Yeni Destek Mesajı</Text>

            <Text style={styles.label}>Konu Kategorisi</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              {CATEGORIES.map((cat) => {
                const selected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    activeOpacity={0.8}
                    onPress={() => setCategory(cat)}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected && styles.chipTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Konu</Text>
              <View
                style={[
                  styles.inputShell,
                  focusedField === 'subject' && styles.inputShellFocused,
                ]}
              >
                <Ionicons
                  name="create-outline"
                  size={17}
                  color={
                    focusedField === 'subject'
                      ? theme.colors.primary
                      : theme.colors.textLight
                  }
                />
                <TextInput
                  style={styles.input}
                  value={subject}
                  onChangeText={setSubject}
                  onFocus={() => setFocusedField('subject')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Örn: Hesap veya abonelik hakkında"
                  placeholderTextColor={theme.colors.textLight}
                  editable={!submitting}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Mesajın</Text>
              <View
                style={[
                  styles.inputShell,
                  styles.textAreaShell,
                  focusedField === 'message' && styles.inputShellFocused,
                ]}
              >
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={messageText}
                  onChangeText={setMessageText}
                  onFocus={() => setFocusedField('message')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Yaşadığın durumu veya önerini detaylı yaz..."
                  placeholderTextColor={theme.colors.textLight}
                  multiline
                  numberOfLines={4}
                  editable={!submitting}
                />
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSubmit}
              disabled={!canSubmit}
              style={[styles.submitWrap, !canSubmit && styles.submitWrapDisabled]}
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
                style={styles.submitGradient}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="send-outline"
                      size={17}
                      color={canSubmit ? '#FFFFFF' : theme.colors.textLight}
                    />
                    <Text
                      style={[
                        styles.submitText,
                        !canSubmit && styles.submitTextDisabled,
                      ]}
                    >
                      Destek Mesajı Gönder
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Past Tickets List */}
          <View style={styles.ticketsSection}>
            <View style={styles.ticketsHeader}>
              <Text style={styles.sectionTitle}>Destek Taleplerim</Text>
              <Text style={styles.ticketCount}>
                {tickets.length} talep
              </Text>
            </View>

            {loadingTickets ? (
              <View style={styles.emptyCard}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            ) : tickets.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons
                  name="mail-unread-outline"
                  size={28}
                  color={theme.colors.textLight}
                />
                <Text style={styles.emptyTitle}>Henüz destek talebin yok</Text>
                <Text style={styles.emptySub}>
                  Yukarıdaki formdan yazdığın mesajlar doğrudan admin destek
                  paneline ulaşır.
                </Text>
              </View>
            ) : (
              tickets.map((ticket) => {
                const statusInfo = STATUS_META[ticket.status] || STATUS_META.OPEN;
                return (
                  <View key={ticket.id} style={styles.ticketCard}>
                    <View style={styles.ticketTopRow}>
                      <Text style={styles.ticketSubject} numberOfLines={2}>
                        {ticket.subject}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: statusInfo.bg },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: statusInfo.color },
                          ]}
                        >
                          {statusInfo.label}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.ticketMeta}>
                      {ticket.category} •{' '}
                      {new Date(ticket.createdAt).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>

                    <Text style={styles.ticketBody}>{ticket.message}</Text>

                    {ticket.adminNote ? (
                      <View style={styles.replyBox}>
                        <View style={styles.replyHeader}>
                          <Ionicons
                            name="shield-checkmark-outline"
                            size={14}
                            color={theme.colors.primary}
                          />
                          <Text style={styles.replyTitle}>Destek Ekibi Yanıtı</Text>
                        </View>
                        <Text style={styles.replyBody}>{ticket.adminNote}</Text>
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
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
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 18,
      paddingVertical: 10,
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
    headerTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: theme.colors.text,
    },
    topSpacer: {
      width: 40,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingTop: 4,
      paddingBottom: 32,
      gap: 14,
    },
    heroCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      borderRadius: 22,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
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
      fontSize: 19,
      fontWeight: '800',
      color: theme.colors.text,
    },
    heroSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      lineHeight: 18,
    },
    card: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 22,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 12,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.text,
    },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    chipsRow: {
      gap: 8,
    },
    chip: {
      paddingHorizontal: 13,
      paddingVertical: 8,
      borderRadius: 14,
      backgroundColor: theme.isDark ? '#121215' : '#F3F4F6',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    chipSelected: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    chipTextSelected: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    fieldGroup: {
      gap: 6,
    },
    inputShell: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      backgroundColor: theme.isDark ? '#121215' : '#F9FAFB',
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: 15,
      paddingHorizontal: 13,
      minHeight: 48,
    },
    textAreaShell: {
      alignItems: 'flex-start',
      paddingVertical: 10,
    },
    inputShellFocused: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.backgroundCard,
    },
    input: {
      flex: 1,
      fontSize: 15,
      color: theme.colors.text,
      paddingVertical: 8,
    },
    textArea: {
      minHeight: 96,
      textAlignVertical: 'top',
      paddingVertical: 0,
    },
    submitWrap: {
      marginTop: 4,
      borderRadius: 16,
      overflow: 'hidden',
    },
    submitWrapDisabled: {
      opacity: 0.9,
    },
    submitGradient: {
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    submitText: {
      fontSize: 15,
      fontWeight: '800',
      color: '#FFFFFF',
    },
    submitTextDisabled: {
      color: theme.colors.textLight,
    },
    ticketsSection: {
      gap: 10,
    },
    ticketsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.text,
    },
    ticketCount: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    emptyCard: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 20,
      padding: 24,
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    emptyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: theme.colors.text,
    },
    emptySub: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
    },
    ticketCard: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 18,
      padding: 15,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 8,
    },
    ticketTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8,
    },
    ticketSubject: {
      flex: 1,
      fontSize: 15,
      fontWeight: '800',
      color: theme.colors.text,
    },
    statusBadge: {
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 8,
    },
    statusBadgeText: {
      fontSize: 11,
      fontWeight: '700',
    },
    ticketMeta: {
      fontSize: 12,
      color: theme.colors.textLight,
    },
    ticketBody: {
      fontSize: 13.5,
      color: theme.colors.textSecondary,
      lineHeight: 19,
    },
    replyBox: {
      marginTop: 4,
      backgroundColor: theme.isDark
        ? 'rgba(255, 105, 180, 0.08)'
        : '#FFF5F9',
      borderRadius: 12,
      padding: 11,
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.primary,
      gap: 4,
    },
    replyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    replyTitle: {
      fontSize: 12,
      fontWeight: '800',
      color: theme.colors.primary,
    },
    replyBody: {
      fontSize: 13,
      color: theme.colors.text,
      lineHeight: 18,
    },
  });
