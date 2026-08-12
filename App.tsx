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

  if (!loaded) {
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
