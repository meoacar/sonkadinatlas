import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export type MarkerType =
  | 'period'
  | 'fertile'
  | 'ovulation'
  | 'sex'
  | 'symptom'
  | 'medication'
  | 'appointment'
  | 'mood';

interface DayMarkersProps {
  markers: MarkerType[];
  isPredicted?: boolean;
  maxVisible?: number;
  mood?: string[];
}

// Phase indicators (period, fertile, ovulation) are shown on the day cell itself.
// DayMarkers focuses on compact dots for user-logged entries so day numbers stay readable.
export function DayMarkers({ markers, maxVisible = 3, mood }: DayMarkersProps) {
  const theme = useTheme();

  const logMarkers = markers.filter(
    (m) => m !== 'period' && m !== 'fertile' && m !== 'ovulation'
  );

  const hasMood = (mood && mood.length > 0) || logMarkers.includes('mood');
  const combined: MarkerType[] = [];

  if (logMarkers.includes('sex')) combined.push('sex');
  if (logMarkers.includes('symptom')) combined.push('symptom');
  if (hasMood) combined.push('mood');
  if (logMarkers.includes('medication')) combined.push('medication');
  if (logMarkers.includes('appointment')) combined.push('appointment');

  if (combined.length === 0) {
    return <View style={styles.emptySpacer} />;
  }

  const visible = combined.slice(0, maxVisible);
  const overflowCount = combined.length - maxVisible;

  const getDotColor = (type: MarkerType): string => {
    switch (type) {
      case 'sex':
        return '#F43F5E';
      case 'symptom':
        return '#F59E0B';
      case 'mood':
        return '#8B5CF6';
      case 'medication':
        return '#06B6D4';
      case 'appointment':
        return '#10B981';
      default:
        return theme.colors.textSecondary;
    }
  };

  return (
    <View style={styles.markersContainer}>
      {visible.map((marker) => (
        <View
          key={marker}
          style={[styles.dot, { backgroundColor: getDotColor(marker) }]}
        />
      ))}
      {overflowCount > 0 && (
        <Text style={[styles.overflow, { color: theme.colors.textLight }]}>
          +{overflowCount}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptySpacer: {
    height: 6,
    marginTop: 2,
  },
  markersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2.5,
    marginTop: 2,
    height: 6,
  },
  dot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
  },
  overflow: {
    fontSize: 7,
    fontWeight: '700',
    lineHeight: 8,
  },
});
