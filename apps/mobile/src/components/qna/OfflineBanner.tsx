import { Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useTheme } from '@/hooks/useTheme';

export function OfflineBanner() {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const styles = createStyles(theme, insets.top);
    const { isConnected } = useNetworkStatus();
    const slideAnim = useRef(new Animated.Value(-120)).current;
    const [shouldRender, setShouldRender] = useState(!isConnected);

    useEffect(() => {
        if (!isConnected) {
            setShouldRender(true);
            Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: -120,
                duration: 250,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (finished) {
                    setShouldRender(false);
                }
            });
        }
    }, [isConnected, slideAnim]);

    if (!shouldRender) {
        return null;
    }

    return (
        <Animated.View
            pointerEvents="none"
            style={[
                styles.banner,
                {
                    transform: [{ translateY: slideAnim }],
                },
            ]}
        >
            <Ionicons name="cloud-offline" size={18} color="#fff" />
            <Text style={styles.text}>İnternet bağlantısı yok</Text>
        </Animated.View>
    );
}

const createStyles = (theme: ReturnType<typeof useTheme>, topInset: number) =>
    StyleSheet.create({
        banner: {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: '#EF4444',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            paddingTop: Math.max(topInset, 12) + 4,
            paddingBottom: 10,
            paddingHorizontal: theme.spacing.lg,
            zIndex: 1000,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
        },
        text: {
            fontSize: 13.5,
            fontWeight: '600',
            color: '#fff',
        },
    });
