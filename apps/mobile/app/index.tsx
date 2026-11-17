import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);

  useEffect(() => {
    let mounted = true;
    SecureStore.getItemAsync('hasSeenWelcome')
      .then((val) => {
        if (mounted) {
          setHasSeenWelcome(val === 'true');
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setWelcomeChecked(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading || !welcomeChecked) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#FFF7FB',
        }}
      >
        <ActivityIndicator size="large" color="#EC4899" />
      </View>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  if (!hasSeenWelcome) {
    return <Redirect href="/(auth)/signup" />;
  }

  return <Redirect href="/(auth)/signin" />;
}
