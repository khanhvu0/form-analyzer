import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { SplashScreen } from 'expo-router';
import { VideoProvider } from '../context/VideoContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Add any custom fonts here if needed
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <VideoProvider>
      <SafeAreaProvider>
        <Stack>
          <Stack.Screen 
            name="(tabs)" 
            options={{ 
              headerShown: false,
            }} 
          />
        </Stack>
      </SafeAreaProvider>
    </VideoProvider>
  );
}
