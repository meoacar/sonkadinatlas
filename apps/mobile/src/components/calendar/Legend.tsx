import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface LegendItem {
  id: string;
  label: string;
  color: string;
  kind: 'solid' | 'dashed' | 'soft' | 'ring' | 'dot';
  iconName: keyof typeof Ionicons.glyphMap;
  explanation: string;
}

const legendItems: LegendItem[] = [
  {
    id: 'period',
    label: 'Regl',
    color: '#FF4D8D',
    kind: 'solid',
    iconName: 'water',
    explanation:
      'Kaydedilmiş regl günlerini gösterir. Akış yoğunluğunu, kramp şiddetini ve semptomları ilgili güne dokunarak ekleyebilirsiniz.',
  },
  {
    id: 'predicted',
    label: 'Tahmin',
    color: '#FF4D8D',
    kind: 'dashed',
    iconName: 'calendar-outline',
    explanation:
      'Geçmiş döngü verilerinize göre beklenen sonraki regl başlangıç gününü gösterir.',
  },
  {
    id: 'fertile',
    label: 'Verimli',
    color: '#A855F7',
    kind: 'soft',
    iconName: 'flower-outline',
    explanation:
      'Tahmini verimli pencere. Doğurganlığın yüksek olduğu günleri gösterir; kesin doğum kontrolü yöntemi olarak kullanılmamalıdır.',
  },
  {
    id: 'ovulation',
    label: 'Yumurtlama',
    color: '#F59E0B',
    kind: 'ring',
    iconName: 'sparkles',
    explanation:
      'Tahmini yumurtlama günü. Genellikle döngünün ortasında gerçekleşir.',
  },
  {
    id: 'logs',
    label: 'Kayıt',
    color: '#06B6D4',
    kind: 'dot',
    iconName: 'document-text-outline',
    explanation:
      'Günlerin altındaki renkli noktalar o güne ruh hali, semptom, ilaç veya özel not eklendiğini gösterir.',
  },
];

export function Legend() {
  const theme = useTheme();
  const [selectedItem, setSelectedItem] = useState<LegendItem | null>(null);
  const styles = createStyles(theme);

  const renderSwatch = (item: LegendItem) => {
    if (item.kind === 'solid') {
      return <View style={[styles.swatchCircle, { backgroundColor: item.color }]} />;
    }
    if (item.kind === 'dashed') {
      return (
        <View
          style={[
            styles.swatchCircle,
            {
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: item.color,
              backgroundColor: 'rgba(255, 77, 141, 0.12)',
            },
          ]}
        />
      );
    }
    if (item.kind === 'soft') {
      return (
        <View
          style={[
            styles.swatchCircle,
            {
              backgroundColor: 'rgba(168, 85, 247, 0.25)',
              borderWidth: 1,
              borderColor: item.color,
            },
          ]}
        />
      );
    }
    if (item.kind === 'ring') {
      return (
        <View
          style={[
            styles.swatchCircle,
            {
              backgroundColor: 'rgba(245, 158, 11, 0.22)',
              borderWidth: 1.5,
              borderColor: item.color,
            },
          ]}
        />
      );
    }
    return (
      <View style={styles.dotsSwatch}>
        <View style={[styles.miniDot, { backgroundColor: '#F59E0B' }]} />
        <View style={[styles.miniDot, { backgroundColor: '#8B5CF6' }]} />
        <View style={[styles.miniDot, { backgroundColor: '#06B6D4' }]} />
      </View>
    );
  };

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {legendItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.item}
            onPress={() => setSelectedItem(item)}
            activeOpacity={0.7}
          >
            {renderSwatch(item)}
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal
        visible={selectedItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedItem(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            {selectedItem && (
              <>
                <View style={styles.modalHeader}>
                  <View
                    style={[
                      styles.modalIconBox,
                      { backgroundColor: `${selectedItem.color}18` },
                    ]}
                  >
                    <Ionicons
                      name={selectedItem.iconName}
                      size={20}
                      color={selectedItem.color}
                    />
                  </View>
                  <Text style={styles.modalTitle}>{selectedItem.label}</Text>
                </View>
                <Text style={styles.modalExplanation}>{selectedItem.explanation}</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedItem(null)}
                >
                  <Text style={styles.closeButtonText}>Anladım</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    contentContainer: {
      paddingTop: 10,
      paddingBottom: 2,
      gap: 12,
      alignItems: 'center',
    },
    item: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 4,
      paddingHorizontal: 2,
    },
    swatchCircle: {
      width: 11,
      height: 11,
      borderRadius: 5.5,
    },
    dotsSwatch: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    miniDot: {
      width: 4.5,
      height: 4.5,
      borderRadius: 2.25,
    },
    label: {
      fontSize: 11.5,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalContent: {
      backgroundColor: theme.colors.backgroundCard,
      borderRadius: 20,
      padding: 20,
      width: '100%',
      maxWidth: 360,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    modalIconBox: {
      width: 36,
      height: 36,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.colors.text,
    },
    modalExplanation: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 21,
      marginBottom: 18,
    },
    closeButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: 'center',
    },
    closeButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
    },
  });
