import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { useOnboardingStore } from '@/store/onboardingStore';
import { StepContainer } from '@/components/onboarding/StepContainer';
import { subscriptionService } from '@/services/api';
import type { PremiumPaywallConfig } from '@/types/subscription';

const TOTAL_STEPS = 6;

type PlanChoice = 'YEARLY' | 'MONTHLY' | 'FREE';

const FREE_PERKS = [
  'Ayda 100 NOVA AI mesajı',
  'Adet takvimi, döngü ve faz takibi',
  'Su, uyku, adım ve nefes egzersizleri',
  'Topluluk Soru & Cevap erişimi',
];

export default function PremiumStep() {
  const router = useRouter();
  const theme = useTheme();
  const { data, updateData, completeStep, setCurrentStep } = useOnboardingStore();

  const { data: paywallConfig, isLoading } = useQuery<PremiumPaywallConfig>({
    queryKey: ['subscription', 'public-paywall-config'],
    queryFn: () => subscriptionService.getPublicPaywallConfig(),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const [selectedChoice, setSelectedChoice] = useState<PlanChoice>(() => {
    if (data.selectedPlan === 'free') return 'FREE';
    if (data.selectedTier === 'MONTHLY') return 'MONTHLY';
    return 'YEARLY';
  });

  useEffect(() => {
    setCurrentStep(5);
  }, []);

  useEffect(() => {
    if (data.selectedPlan) return;
    if (paywallConfig?.defaultSelectedTier) {
      const def = paywallConfig.defaultSelectedTier;
      if (paywallConfig.plans?.[def]?.isActive !== false) {
        setSelectedChoice(def);
      } else {
        setSelectedChoice(def === 'YEARLY' ? 'MONTHLY' : 'YEARLY');
      }
    }
  }, [paywallConfig?.defaultSelectedTier, paywallConfig?.plans]);

  const monthlyPlan = paywallConfig?.plans?.MONTHLY;
  const yearlyPlan = paywallConfig?.plans?.YEARLY;

  const monthlyPriceNum = monthlyPlan?.price ?? 99;
  const yearlyPriceNum = yearlyPlan?.price ?? 999;
  const currencySymbol = yearlyPlan?.currencySymbol || monthlyPlan?.currencySymbol || '₺';

  const savingsPct =
    monthlyPriceNum > 0
      ? Math.max(
          0,
          Math.round(((monthlyPriceNum * 12 - yearlyPriceNum) / (monthlyPriceNum * 12)) * 100),
        )
      : 16;

  const yearlyPerMonth = Math.round(yearlyPriceNum / 12);
  const trialEnabled = paywallConfig?.trialEnabled ?? true;
  const activeTrialDays =
    selectedChoice === 'YEARLY'
      ? yearlyPlan?.trialDays ?? 7
      : selectedChoice === 'MONTHLY'
        ? monthlyPlan?.trialDays ?? 0
        : 0;

  const heroTitle = paywallConfig?.heroTitle || "NOVA Premium'a Geç";
  const heroSubtitle =
    paywallConfig?.heroSubtitle ||
    'Gelişmiş AI hafızası, kişisel sağlık içgörüleri ve öncelikli destekle deneyimini güçlendir.';
  const heroHighlights =
    paywallConfig?.heroHighlights?.length
      ? paywallConfig.heroHighlights
      : ['1000+ Mesaj', 'Kişisel İçgörü', 'Astroloji'];

  const yearlyFeatures =
    yearlyPlan?.features?.length
      ? yearlyPlan.features
      : [
          'Ayda 1000 NOVA AI mesajı ve uzun hafıza',
          'Kişiselleştirilmiş döngü & sağlık içgörüleri',
          'Detaylı doğum haritası ve burç analizleri',
          'Doktor ziyaretine hazır kapsamlı raporlar',
        ];

  const handleContinue = async () => {
    if (selectedChoice === 'FREE') {
      await updateData({ selectedPlan: 'free', selectedTier: undefined });
    } else {
      await updateData({ selectedPlan: 'premium', selectedTier: selectedChoice });
    }
    completeStep(5);
    router.push('/(auth)/onboarding/tour');
  };

  const handleSkipWithFree = async () => {
    await updateData({ selectedPlan: 'free', selectedTier: undefined });
    completeStep(5);
    router.push('/(auth)/onboarding/tour');
  };

  const handleBack = () => {
    router.back();
  };

  const getNextLabel = () => {
    if (selectedChoice === 'FREE') {
      return 'Ücretsiz Planla Devam Et';
    }
    if (trialEnabled && activeTrialDays > 0) {
      return `${activeTrialDays} Gün Ücretsiz Dene`;
    }
    return selectedChoice === 'YEARLY'
      ? 'Yıllık Premium ile Devam Et'
      : 'Aylık Premium ile Devam Et';
  };

  const styles = createStyles(theme);

  return (
    <StepContainer
      currentStep={5}
      totalSteps={TOTAL_STEPS}
      title="Planını Seç"
      subtitle="İhtiyacına uygun planı belirle, istediğin zaman değiştir"
      onBack={handleBack}
    >
      <View style={styles.content}>
        {/* Hero Banner */}
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.primaryDark || '#6D28D9', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroBadge}>
            <Ionicons name="sparkles" size={13} color="#FDE047" />
            <Text style={styles.heroBadgeText}>
              {paywallConfig?.heroEyebrow || 'KADIN SAĞLIĞI ASİSTANI'}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{heroTitle}</Text>
          <Text style={styles.heroSubtitle}>{heroSubtitle}</Text>

          <View style={styles.highlightsRow}>
            {heroHighlights.slice(0, 3).map((item, idx) => (
              <View key={`${item}-${idx}`} style={styles.highlightChip}>
                <Ionicons
                  name={idx === 0 ? 'chatbubbles' : idx === 1 ? 'bulb' : 'planet'}
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.highlightChipText}>{item}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {isLoading && !paywallConfig ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={styles.loadingText}>Güncel planlar yükleniyor...</Text>
          </View>
        ) : null}

        {/* Selectable Plan Cards */}
        <View style={styles.plansStack}>
          {/* 1. Yearly Plan */}
          {yearlyPlan?.isActive !== false && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedChoice('YEARLY')}
              style={[
                styles.planCard,
                selectedChoice === 'YEARLY' && styles.planCardSelected,
              ]}
            >
              <View style={styles.recommendedPill}>
                <Text style={styles.recommendedPillText}>
                  {yearlyPlan?.badgeText ||
                    yearlyPlan?.savingsText ||
                    `EN AVANTAJLI • %${savingsPct} TASARRUF`}
                </Text>
              </View>

              <View style={styles.planTopRow}>
                <View style={styles.planLeft}>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedChoice === 'YEARLY' && styles.radioOuterActive,
                    ]}
                  >
                    {selectedChoice === 'YEARLY' && <View style={styles.radioInner} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planTitle}>
                      {yearlyPlan?.title || 'Yıllık Premium'}
                    </Text>
                    <Text style={styles.planSub}>
                      {yearlyPlan?.subtitle ||
                        `Aylık sadece ${currencySymbol}${yearlyPerMonth}'ya denk gelir`}
                    </Text>
                  </View>
                </View>

                <View style={styles.priceBlock}>
                  <Text style={styles.priceValue}>
                    {currencySymbol}
                    {yearlyPriceNum}
                  </Text>
                  <Text style={styles.pricePeriod}>/ yıl</Text>
                </View>
              </View>

              {trialEnabled && (yearlyPlan?.trialDays ?? 7) > 0 && (
                <View style={styles.trialPill}>
                  <Ionicons name="gift-outline" size={13} color="#059669" />
                  <Text style={styles.trialPillText}>
                    İlk {yearlyPlan?.trialDays ?? 7} gün ücretsiz deneme
                  </Text>
                </View>
              )}

              <View style={styles.perksList}>
                {yearlyFeatures.slice(0, 4).map((feat, idx) => (
                  <View key={idx} style={styles.perkRow}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.primary} />
                    <Text style={styles.perkText}>{feat}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          )}

          {/* 2. Monthly Plan */}
          {monthlyPlan?.isActive !== false && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setSelectedChoice('MONTHLY')}
              style={[
                styles.planCard,
                selectedChoice === 'MONTHLY' && styles.planCardSelected,
              ]}
            >
              <View style={styles.planTopRow}>
                <View style={styles.planLeft}>
                  <View
                    style={[
                      styles.radioOuter,
                      selectedChoice === 'MONTHLY' && styles.radioOuterActive,
                    ]}
                  >
                    {selectedChoice === 'MONTHLY' && <View style={styles.radioInner} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.planTitle}>
                      {monthlyPlan?.title || 'Aylık Premium'}
                    </Text>
                    <Text style={styles.planSub}>
                      {monthlyPlan?.subtitle || 'Esnek aylık yenileme, istediğin an iptal et'}
                    </Text>
                  </View>
                </View>

                <View style={styles.priceBlock}>
                  <Text style={styles.priceValue}>
                    {currencySymbol}
                    {monthlyPriceNum}
                  </Text>
                  <Text style={styles.pricePeriod}>/ ay</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {/* 3. Free Plan */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setSelectedChoice('FREE')}
            style={[
              styles.planCard,
              selectedChoice === 'FREE' && styles.planCardSelectedFree,
            ]}
          >
            <View style={styles.planTopRow}>
              <View style={styles.planLeft}>
                <View
                  style={[
                    styles.radioOuter,
                    selectedChoice === 'FREE' && styles.radioOuterActive,
                  ]}
                >
                  {selectedChoice === 'FREE' && <View style={styles.radioInner} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>Ücretsiz Başlangıç</Text>
                  <Text style={styles.planSub}>Temel döngü ve günlük wellness takibi</Text>
                </View>
              </View>

              <View style={styles.priceBlock}>
                <Text style={styles.priceValue}>{currencySymbol}0</Text>
                <Text style={styles.pricePeriod}>Süresiz</Text>
              </View>
            </View>

            <View style={styles.perksList}>
              {FREE_PERKS.map((perk, idx) => (
                <View key={idx} style={styles.perkRow}>
                  <Ionicons name="checkmark" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.perkText, { color: theme.colors.textSecondary }]}>
                    {perk}
                  </Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </View>

        {/* Trust Footer */}
        <View style={styles.trustBox}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#10B981" />
          <Text style={styles.trustText}>
            Kayıt sırasında kart bilgisi istenmez ve ücret çekilmez. Premium seçerseniz kayıt sonrası
            App Store / Google Play üzerinden güvenle başlatabilirsiniz.
          </Text>
        </View>
      </View>

      {/* Modern Footer Action Area */}
      <View style={styles.footerActions}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleContinue}
          style={styles.primaryCtaWrap}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark || '#6D28D9', '#EC4899']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryCtaGradient}
          >
            <Text style={styles.primaryCtaText} numberOfLines={1}>
              {getNextLabel()}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.secondaryRow}>
          <TouchableOpacity
            onPress={handleBack}
            style={styles.backLinkBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.backLinkText}>Önceki Adım</Text>
          </TouchableOpacity>

          {selectedChoice !== 'FREE' && (
            <TouchableOpacity
              onPress={handleSkipWithFree}
              style={styles.skipButton}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Ücretsiz devam et</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </StepContainer>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    content: {
      flex: 1,
    },
    heroCard: {
      borderRadius: 20,
      padding: 18,
      marginBottom: 18,
    },
    heroBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.2)',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
      marginBottom: 10,
    },
    heroBadgeText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.6,
    },
    heroTitle: {
      color: '#FFFFFF',
      fontSize: 22,
      fontWeight: '800',
      marginBottom: 6,
    },
    heroSubtitle: {
      color: 'rgba(255,255,255,0.92)',
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 12,
    },
    highlightsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    highlightChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255,255,255,0.18)',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 12,
    },
    highlightChipText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700',
    },
    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginBottom: 12,
    },
    loadingText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    plansStack: {
      gap: 14,
      marginBottom: 16,
    },
    planCard: {
      backgroundColor: theme.colors.backgroundCard,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      borderRadius: 18,
      padding: 16,
      position: 'relative',
    },
    planCardSelected: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.backgroundSecondary,
    },
    planCardSelectedFree: {
      borderWidth: 2,
      borderColor: theme.colors.primary,
    },
    recommendedPill: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 10,
      marginBottom: 10,
    },
    recommendedPillText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.4,
    },
    planTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    planLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    radioOuter: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: theme.colors.textSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterActive: {
      borderColor: theme.colors.primary,
    },
    radioInner: {
      width: 11,
      height: 11,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
    },
    planTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.colors.text,
    },
    planSub: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginTop: 2,
      lineHeight: 17,
    },
    priceBlock: {
      alignItems: 'flex-end',
    },
    priceValue: {
      fontSize: 22,
      fontWeight: '800',
      color: theme.colors.text,
    },
    pricePeriod: {
      fontSize: 11,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    trialPill: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 5,
      marginTop: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: 'rgba(16, 185, 129, 0.14)',
    },
    trialPillText: {
      color: '#059669',
      fontSize: 12,
      fontWeight: '700',
    },
    perksList: {
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      gap: 7,
    },
    perkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    perkText: {
      fontSize: 13,
      color: theme.colors.text,
      flex: 1,
      lineHeight: 18,
    },
    trustBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 12,
      padding: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 14,
    },
    trustText: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.textSecondary,
      lineHeight: 17,
    },
    footerActions: {
      marginTop: 'auto',
      paddingTop: 8,
      gap: 12,
    },
    primaryCtaWrap: {
      borderRadius: 16,
      overflow: 'hidden',
      shadowColor: theme.colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.28,
      shadowRadius: 10,
      elevation: 6,
    },
    primaryCtaGradient: {
      height: 54,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 20,
    },
    primaryCtaText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '800',
      letterSpacing: 0.2,
    },
    secondaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    backLinkBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: 8,
      paddingHorizontal: 6,
    },
    backLinkText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
    },
    skipButton: {
      paddingVertical: 8,
      paddingHorizontal: 6,
    },
    skipButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.colors.primary,
    },
  });
