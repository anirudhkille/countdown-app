import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk/700Bold';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display/400Regular';
import { ThemeProvider, useTheme, useThemeControls } from '../ui/ThemeProvider';
import { StackHeader } from '../ui/StackHeader';
import { useNotificationBootstrap } from '../features/notifications/useNotificationBootstrap';

function Navigator() {
  const theme = useTheme();
  const { isDark } = useThemeControls();
  useNotificationBootstrap();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="countdown/[id]"
          options={{
            headerShown: false,
            header: () => <StackHeader title="Countdown" />,
          }}
        />
        <Stack.Screen
          name="import"
          options={{
            presentation: 'modal',
            headerShown: false,
            header: () => <StackHeader title="Import" />,
          }}
        />
        <Stack.Screen
          name="share/[id]"
          options={{
            presentation: 'modal',
            headerShown: false,
            header: () => <StackHeader title="Share" />,
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    SpaceGrotesk_700Bold,
    PlayfairDisplay_700Bold,
    DMSerifDisplay_400Regular,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Navigator />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
