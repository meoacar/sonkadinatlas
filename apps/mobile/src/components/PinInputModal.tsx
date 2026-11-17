import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/hooks/useTheme';

export interface PinInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (pin: string, extraPin?: string) => Promise<void> | void;
  title: string;
  subtitle?: string;
  mode?: 'setup' | 'verify' | 'change';
  requireConfirm?: boolean;
}

type ModalStep = 'current' | 'pin' | 'confirm';

const KEYPAD_ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['clear', '0', 'back'],
] as const;

export function PinInputModal({
  visible,
  onClose,
  onSuccess,
  title,
  subtitle,
  mode = 'setup',
  requireConfirm = true,
}: PinInputModalProps) {
  const theme = useTheme();
  const styles = createStyles(theme);

  const initialStep: ModalStep = mode === 'change' ? 'current' : 'pin';
  const [step, setStep] = useState<ModalStep>(initialStep);
  const [currentPin, setCurrentPin] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setStep(mode === 'change' ? 'current' : 'pin');
      setCurrentPin('');
      setPin('');
      setConfirmPin('');
      setErrorMsg(null);
      setSubmitting(false);
    }
  }, [visible, mode]);

  const activeValue =
    step === 'current' ? currentPin : step === 'pin' ? pin : confirmPin;

  const setActiveValue = (val: string) => {
    if (step === 'current') setCurrentPin(val);
    else if (step === 'pin') setPin(val);
    else setConfirmPin(val);
  };

  const handleDigitPress = (key: string) => {
    if (submitting) return;
    setErrorMsg(null);
    Haptics.selectionAsync().catch(() => {});

    if (key === 'clear') {
      setActiveValue('');
      return;
    }

    if (key === 'back') {
      setActiveValue(activeValue.slice(0, -1));
      return;
    }

    if (activeValue.length < 6) {
      setActiveValue(activeValue + key);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setCurrentPin('');
    setPin('');
    setConfirmPin('');
    setErrorMsg(null);
    onClose();
  };

  const handleContinue = async () => {
    if (submitting) return;

    if (activeValue.length < 4) {
      setErrorMsg('PIN kodu en az 4 rakam olmalıdır.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    if (step === 'current') {
      setStep('pin');
      setErrorMsg(null);
      return;
    }

    if (step === 'pin' && (requireConfirm || mode === 'change')) {
      setStep('confirm');
      setErrorMsg(null);
      return;
    }

    if (step === 'confirm' && pin !== confirmPin) {
      setErrorMsg('Girdiğiniz PIN kodları eşleşmiyor.');
      setConfirmPin('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await onSuccess(pin, mode === 'change' ? currentPin : undefined);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCurrentPin('');
      setPin('');
      setConfirmPin('');
      onClose();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setErrorMsg(err?.message || 'İşlem tamamlanamadı. Lütfen tekrar deneyin.');
      if (mode === 'change') {
        setStep('current');
        setCurrentPin('');
        setPin('');
        setConfirmPin('');
      } else if (mode === 'verify') {
        setPin('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabel =
    step === 'current'
      ? 'Mevcut PIN Kodunuzu Girin'
      : step === 'confirm'
        ? 'Yeni PIN Kodunu Tekrar Girin'
        : mode === 'verify'
          ? 'Mevcut PIN Kodunuzu Girin'
          : mode === 'change'
            ? 'Yeni PIN Kodu Oluşturun'
            : 'PIN Kodu Oluşturun';

  const isFinalStep =
    step === 'confirm' || (step === 'pin' && !requireConfirm && mode !== 'change');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={20} color={theme.colors.primary} />
            </View>
            <Text style={styles.modalTitle}>{title}</Text>
            {subtitle && <Text style={styles.modalSubtitle}>{subtitle}</Text>}
          </View>

          <Text style={styles.stepLabel}>{stepLabel}</Text>

          {/* Visual PIN Dots */}
          <View style={styles.pinDotsContainer}>
            {[0, 1, 2, 3, 4, 5].map((index) => {
              const filled = index < activeValue.length;
              return (
                <View
                  key={index}
                  style={[
                    styles.pinBox,
                    filled && styles.pinBoxFilled,
                    index >= 4 && !filled && styles.pinBoxOptional,
                  ]}
                >
                  {filled && <View style={styles.pinInnerDot} />}
                </View>
              );
            })}
          </View>
          <Text style={styles.helperText}>
            4–6 rakam girin ({activeValue.length}/6)
          </Text>

          {errorMsg && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Built-in Numeric Keypad (works identically on Android & iOS) */}
          <View style={styles.keypad}>
            {KEYPAD_ROWS.map((row, rIdx) => (
              <View key={rIdx} style={styles.keypadRow}>
                {row.map((key) => {
                  const isSpecial = key === 'clear' || key === 'back';
                  return (
                    <TouchableOpacity
                      key={key}
                      activeOpacity={0.65}
                      disabled={submitting}
                      onPress={() => handleDigitPress(key)}
                      style={[
                        styles.keypadKey,
                        isSpecial && styles.keypadKeySpecial,
                      ]}
                    >
                      {key === 'back' ? (
                        <Ionicons
                          name="backspace-outline"
                          size={22}
                          color={theme.colors.text}
                        />
                      ) : key === 'clear' ? (
                        <Text style={styles.keypadClearText}>Temizle</Text>
                      ) : (
                        <Text style={styles.keypadDigitText}>{key}</Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={handleClose}
              disabled={submitting}
            >
              <Text style={styles.secondaryButtonText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.primaryButton,
                (activeValue.length < 4 || submitting) && styles.primaryButtonDisabled,
              ]}
              onPress={handleContinue}
              disabled={activeValue.length < 4 || submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {isFinalStep ? 'Kaydet' : 'Devam'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 10, 25, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 18,
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
    },
    modalContainer: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 26,
      padding: 20,
      width: '100%',
      maxWidth: 380,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    modalHeader: {
      alignItems: 'center',
      marginBottom: 14,
    },
    lockBadge: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: theme.isDark
        ? 'rgba(236,72,153,0.18)'
        : 'rgba(236,72,153,0.12)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
    modalTitle: {
      fontSize: 19,
      fontWeight: '800',
      color: theme.colors.text,
      textAlign: 'center',
    },
    modalSubtitle: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
    stepLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: theme.colors.primary,
      textAlign: 'center',
      marginBottom: 12,
    },
    pinDotsContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 10,
      marginBottom: 8,
    },
    pinBox: {
      width: 38,
      height: 44,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.isDark ? '#141418' : '#F9FAFB',
      alignItems: 'center',
      justifyContent: 'center',
    },
    pinBoxOptional: {
      borderStyle: 'dashed',
    },
    pinBoxFilled: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.isDark
        ? 'rgba(236,72,153,0.16)'
        : '#FDF2F8',
    },
    pinInnerDot: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: theme.colors.primary,
    },
    helperText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 10,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      backgroundColor: theme.isDark ? 'rgba(220,38,38,0.18)' : '#FEF2F2',
      marginBottom: 10,
    },
    errorText: {
      flex: 1,
      fontSize: 12.5,
      fontWeight: '600',
      color: theme.isDark ? '#FCA5A5' : '#B91C1C',
    },
    keypad: {
      gap: 8,
      marginBottom: 16,
    },
    keypadRow: {
      flexDirection: 'row',
      gap: 8,
    },
    keypadKey: {
      flex: 1,
      height: 48,
      borderRadius: 14,
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
      alignItems: 'center',
      justifyContent: 'center',
    },
    keypadKeySpecial: {
      backgroundColor: theme.isDark ? 'rgba(255,255,255,0.03)' : '#F9FAFB',
    },
    keypadDigitText: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.colors.text,
    },
    keypadClearText: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.colors.textSecondary,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 10,
    },
    button: {
      flex: 1,
      borderRadius: 14,
      height: 46,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButton: {
      backgroundColor: theme.colors.primary,
    },
    primaryButtonDisabled: {
      opacity: 0.45,
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },
    secondaryButton: {
      backgroundColor: theme.colors.backgroundCard,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    secondaryButtonText: {
      color: theme.colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
  });
