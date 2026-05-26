import { SafeAreaView, StyleSheet } from 'react-native';
import { GameScreen } from '@/screens/Game';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <GameScreen />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
