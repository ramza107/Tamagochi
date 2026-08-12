import { useEffect, useState } from 'react';
import { useFonts, Fraunces_600SemiBold, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { colors } from './src/theme';

export default function App() {
  const [loaded] = useFonts({
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    Manrope_500Medium,
    Manrope_600SemiBold,
  });
  // Never stick on a blank spinner if fonts are slow/blocked
  const [giveUp, setGiveUp] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGiveUp(true), 1800);
    return () => clearTimeout(t);
  }, []);

  if (!loaded && !giveUp) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.mossDeep} />
      </View>
    );
  }

  return (
    <>
      <HomeScreen />
      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sand,
  },
});
