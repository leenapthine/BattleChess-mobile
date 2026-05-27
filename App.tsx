import { SafeAreaView, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useFonts, SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import { GameScreen } from '@/screens/Game';
import { COLORS } from '@/constants/theme';

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#00ff00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <GameScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loading: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
