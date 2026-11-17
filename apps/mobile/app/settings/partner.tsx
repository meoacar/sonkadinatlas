import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { usePremium } from '@/hooks/usePremium';
import { UpgradePrompt } from '@/components/premium/UpgradePrompt';
import { partnerService } from '@/services/api';

export default function PartnerModeScreen() {
  const theme = useTheme();
  const { flags } = useFeatureFlags();
  const { isPremium } = usePremium();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [joinCode, setJoinCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ['partnerStatus'],
    queryFn: () => partnerService.getStatus(),
  });

  const inviteMutation = useMutation({
    mutationFn: () => partnerService.createInvite(),
    onSuccess: (res) => {
      setGeneratedCode(res.code);
    },
    onError: (e: any) => {
      Alert.alert('Hata', e?.message || 'Davet kodu oluşturulamadı');
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (code: string) => partnerService.acceptInvite(code),
    onSuccess: () => {
      setJoinCode('');
      queryClient.invalidateQueries({ queryKey: ['partnerStatus'] });
      Alert.alert('Bağlantı Kuruldu 🤍', 'Partner bağlantınız başarıyla etkinleştirildi.');
    },
    onError: (e: any) => {
      Alert.alert('Bağlanamadı', e?.message || 'Kod geçersiz veya süresi dolmuş.');
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: () => partnerService.unlink(),
    onSuccess: () => {
      setGeneratedCode(null);
      queryClient.invalidateQueries({ queryKey: ['partnerStatus'] });
      Alert.alert('Bilgi', 'Partner bağlantısı kaldırıldı.');
    },
  });

  const styles = createStyles(theme);

  if (flags.partner_mode_enabled === false) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Partner Modu</Text>
          <View style={{ width: 32 }} />
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 12 }}>
          <Ionicons name="heart-half-outline" size={48} color={theme.colors.primary} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text, textAlign: 'center' }}>
            Partner Modu Geçici Olarak Kapalı
          </Text>
          <Text style={{ fontSize: 14, color: theme.colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
            Partner Modu özelliği yönetici tarafından geçici olarak devre dışı bırakıldı.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleShareCode = async (code: string) => {
    try {
      await Share.share({
        message: `Kadın Atlası Partner Bağlantı Kodum: ${code}\nAyarlar -> Partner Modu ekranından bu kodu girerek döngü fazım hakkında nazik destek ipuçları görebilirsin. 💕`,
      });
    } catch {
      // Ignore cancel
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Partner Modu</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient
          colors={['#EC4899', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <Text style={styles.heroEmoji}>🤝</Text>
          <Text style={styles.heroTitle}>Partnerinle Gizlilik Korumalı Bağlan</Text>
          <Text style={styles.heroDesc}>
            Eşin veya partnerin yalnızca genel döngü fazını ve sana nasıl destek olabileceğini
            görür. Günlük semptomların, özel notların ve kişisel kayıtların her zaman gizli kalır.
          </Text>
        </LinearGradient>

        {isLoading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 30 }} />
        ) : status?.connected && status.link ? (
          <View style={styles.card}>
            <View style={styles.connectedBadge}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.connectedBadgeText}>Bağlantı Aktif</Text>
            </View>

            <Text style={styles.cardTitle}>
              {status.link.role === 'partner'
                ? `${status.link.partnerDisplayName} ile Bağlısın`
                : `Partnerin (${status.link.partnerDisplayName}) Bağlı`}
            </Text>

            {status.partnerSummary ? (
              <View style={styles.summaryBox}>
                <Text style={styles.summaryPhase}>{status.partnerSummary.phaseTitle}</Text>
                {status.partnerSummary.cycleDay && (
                  <Text style={styles.summaryDay}>
                    Döngü {status.partnerSummary.cycleDay}. Gün
                    {status.partnerSummary.daysUntilNextPeriod !== null
                      ? ` · Sonraki döneme ~${status.partnerSummary.daysUntilNextPeriod} gün`
                      : ''}
                  </Text>
                )}
                <View style={styles.tipBox}>
                  <Text style={styles.tipLabel}>💡 Bugünün Destek Önerisi</Text>
                  <Text style={styles.tipText}>{status.partnerSummary.supportTip}</Text>
                </View>
                <Text style={styles.privacyNote}>{status.partnerSummary.privacyNote}</Text>
              </View>
            ) : (
              <Text style={styles.helperText}>
                Partnerin yalnızca mevcut döngü fazını ve destek önerilerini görebilir; günlük
                semptom, akıntı ve özel notların tamamen gizlidir.
              </Text>
            )}

            <TouchableOpacity
              style={styles.unlinkBtn}
              onPress={() =>
                Alert.alert(
                  'Bağlantıyı Kes',
                  'Partner paylaşımını sonlandırmak istediğine emin misin?',
                  [
                    { text: 'Vazgeç', style: 'cancel' },
                    { text: 'Bağlantıyı Kes', style: 'destructive', onPress: () => unlinkMutation.mutate() },
                  ],
                )
              }
            >
              <Text style={styles.unlinkBtnText}>Bağlantıyı Sonlandır</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>1. Partnerini Davet Et</Text>
              <Text style={styles.helperText}>
                Tek kullanımlık 6 haneli davet kodu üret ve partnerinle paylaş.
              </Text>

              {generatedCode ? (
                <View style={styles.codeBox}>
                  <Text style={styles.codeText}>{generatedCode}</Text>
                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={() => handleShareCode(generatedCode)}
                  >
                    <Ionicons name="share-social-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.shareBtnText}>Paylaş</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => {
                    if (!isPremium) {
                      setShowUpgradePrompt(true);
                      return;
                    }
                    inviteMutation.mutate();
                  }}
                  disabled={inviteMutation.isPending}
                >
                  <Text style={styles.primaryBtnText}>
                    {inviteMutation.isPending
                      ? 'Oluşturuluyor...'
                      : isPremium
                      ? 'Davet Kodu Oluştur'
                      : '👑 Premium ile Davet Kodu Oluştur'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>2. Davet Kodu ile Bağlan</Text>
              <Text style={styles.helperText}>
                Partnerinin paylaştığı 6 haneli kodu aşağıya gir.
              </Text>
              <TextInput
                style={styles.input}
                placeholder="Örn: K8M4P2"
                placeholderTextColor={theme.colors.textLight}
                value={joinCode}
                onChangeText={setJoinCode}
                autoCapitalize="characters"
                maxLength={8}
              />
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() => acceptMutation.mutate(joinCode)}
                disabled={acceptMutation.isPending || joinCode.trim().length < 4}
              >
                <Text style={styles.secondaryBtnText}>
                  {acceptMutation.isPending ? 'Bağlanılıyor...' : 'Kodu Onayla & Bağlan'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <UpgradePrompt
        visible={showUpgradePrompt}
        onClose={() => setShowUpgradePrompt(false)}
        feature="Partner Modu (Eş Paylaşımı)"
        description="Partnerine tek kullanımlık davet kodu göndererek genel döngü fazını ve destek önerilerini paylaşmak için 7 gün ücretsiz Premium dene. (Davet alan partner kodu ücretsiz girebilir.)"
      />
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    backBtn: { padding: 4 },
    headerTitle: { fontSize: 17, fontWeight: '700', color: theme.colors.text },
    content: { padding: 16, gap: 16 },
    hero: { borderRadius: 22, padding: 20, gap: 8 },
    heroEmoji: { fontSize: 32 },
    heroTitle: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
    heroDesc: { fontSize: 13, color: 'rgba(255,255,255,0.92)', lineHeight: 19 },
    card: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      gap: 12,
    },
    cardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text },
    helperText: { fontSize: 13, color: theme.colors.textSecondary, lineHeight: 19 },
    primaryBtn: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center',
    },
    primaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14.5 },
    codeBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: `${theme.colors.primary}12`,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: `${theme.colors.primary}40`,
    },
    codeText: {
      fontSize: 24,
      fontWeight: '800',
      letterSpacing: 4,
      color: theme.colors.primary,
    },
    shareBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
    },
    shareBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
    input: {
      backgroundColor: theme.colors.background,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      letterSpacing: 2,
    },
    secondaryBtn: {
      backgroundColor: '#8B5CF6',
      borderRadius: 12,
      paddingVertical: 13,
      alignItems: 'center',
    },
    secondaryBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14.5 },
    connectedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      backgroundColor: 'rgba(16,185,129,0.12)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    connectedBadgeText: { color: '#059669', fontWeight: '700', fontSize: 12 },
    summaryBox: { gap: 8 },
    summaryPhase: { fontSize: 16, fontWeight: '800', color: theme.colors.primary },
    summaryDay: { fontSize: 13, color: theme.colors.textSecondary },
    tipBox: {
      backgroundColor: `${theme.colors.primary}12`,
      borderRadius: 12,
      padding: 12,
      gap: 4,
    },
    tipLabel: { fontSize: 12.5, fontWeight: '700', color: theme.colors.primary },
    tipText: { fontSize: 13.5, color: theme.colors.text, lineHeight: 19 },
    privacyNote: { fontSize: 11.5, color: theme.colors.textSecondary, fontStyle: 'italic' },
    unlinkBtn: {
      borderWidth: 1,
      borderColor: '#EF4444',
      borderRadius: 12,
      paddingVertical: 11,
      alignItems: 'center',
      marginTop: 4,
    },
    unlinkBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 13.5 },
  });
