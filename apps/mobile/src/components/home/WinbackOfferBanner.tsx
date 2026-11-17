import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { userService } from '@/services/api';

export interface WinbackBannerData {
  id: string;
  ruleId: string;
  title: string;
  body: string;
  incentive: 'none' | 'trial_offer' | 'nova_bonus' | 'quick_checkin';
  ctaScreen: 'home' | 'calendar' | 'chat' | 'premium';
  createdAt: string;
}

interface WinbackOfferBannerProps {
  banner: WinbackBannerData;
}

export function WinbackOfferBanner({ banner }: WinbackOfferBannerProps) {
  const theme = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();

  const ackMutation = useMutation({
    mutationFn: (action: 'dismiss' | 'claim') =>
      userService.ackRetentionOffer(action),
    onSuccess: (res, action) => {
      queryClient.setQueryData(['retentionOffer'], { banner: null });
      queryClient.invalidateQueries({ queryKey: ['nova', 'quota'] });

      if (action === 'claim') {
        if (res?.bonusGranted > 0) {
          Alert.alert(
            'Hediyen Tanımlandı 🎁',
            `+${res.bonusGranted} NOVA AI bonus mesaj hakkı hesabına eklendi!`,
          );
        }
        if (banner.ctaScreen === 'calendar') {
          router.push('/(tabs)/calendar?openToday=true' as any);
        } else if (banner.ctaScreen === 'chat') {
          router.push('/(tabs)/chat' as any);
        } else if (banner.ctaScreen === 'premium') {
          router.push('/premium' as any);
        }
      }
    },
  });

  const incentiveLabel =
    banner.incentive === 'nova_bonus'
      ? '🎁 +10 NOVA Bonus Mesaj'
      : banner.incentive === 'trial_offer'
      ? '👑 7 Gün Ücretsiz Premium'
      : banner.incentive === 'quick_checkin'
      ? '⚡ Hızlı Check-In'
      : '🤍 Sana Özel Mesaj';

  const ctaText =
    banner.incentive === 'nova_bonus'
      ? 'Hediyeyi Al & Başla'
      : banner.ctaScreen === 'premium'
      ? 'Ayrıcalıkları Gör'
      : banner.ctaScreen === 'calendar'
      ? 'Döngüyü Aç'
      : 'Devam Et';

  const styles = createStyles(theme);

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={
          theme.isDark
            ? (['#581C87', '#9D174D'] as const)
            : (['#FDF2F8', '#EEF2FF'] as const)
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{incentiveLabel}</Text>
          </View>
          <TouchableOpacity
            onPress={() => ackMutation.mutate('dismiss')}
            style={styles.closeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={16} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>{banner.title}</Text>
        <Text style={styles.body}>{banner.body}</Text>

        <TouchableOpacity
          style={styles.ctaBtn}
          activeOpacity={0.85}
          disabled={ackMutation.isPending}
          onPress={() => ackMutation.mutate('claim')}
        >
          <Text style={styles.ctaText}>
            {ackMutation.isPending ? 'İşleniyor...' : ctaText}
          </Text>
          <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    wrapper: {
      marginHorizontal: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderRadius: 20,
      shadowColor: '#EC4899',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.14,
      shadowRadius: 10,
      elevation: 4,
    },
    card: {
      borderRadius: 20,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.isDark ? 'rgba(236, 72, 153, 0.45)' : '#FBCFE8',
      gap: 8,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    pill: {
      backgroundColor: theme.isDark ? 'rgba(236, 72, 153, 0.3)' : '#FCE7F3',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    },
    pillText: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.isDark ? '#FBCFE8' : '#BE185D',
    },
    closeBtn: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: 'rgba(0,0,0,0.06)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontSize: 15.5,
      fontWeight: '800',
      color: theme.colors.text,
    },
    body: {
      fontSize: 13,
      lineHeight: 18.5,
      color: theme.colors.textSecondary,
    },
    ctaBtn: {
      marginTop: 4,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 11,
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    ctaText: {
      color: '#FFFFFF',
      fontSize: 13.5,
      fontWeight: '700',
    },
  });
