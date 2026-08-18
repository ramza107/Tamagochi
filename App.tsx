import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useFonts, Fraunces_700Bold } from '@expo-google-fonts/fraunces';
import { Manrope_500Medium, Manrope_600SemiBold } from '@expo-google-fonts/manrope';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { DerzhiScreen } from './src/screens/DerzhiScreen';
import { ink } from './src/derzhi/palette';

export default function App() {
  const [loaded] = useFonts({
    Fraunces_700Bold,
    Manrope_500Medium,
    Manrope_600SemiBold,
  });
  const [giveUp, setGiveUp] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setGiveUp(true), 1600);
    return () => clearTimeout(t);
  }, []);

  if (!loaded && !giveUp) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={ink.lime} />
      </View>
    );
  }

  return (
    <>
      <DerzhiScreen />
      <StatusBar style="light" />
    </>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ink.bg,
  },
});
