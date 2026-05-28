import { SafeAreaView, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useState } from 'react';
import { useFonts, SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono';
import type { ArmyConfig } from '@/types/army';
import { PointCapScreen } from '@/screens/PointCap';
import { ArmyBuilderScreen } from '@/screens/ArmyBuilder';
import { HandoffScreen } from '@/screens/Handoff';
import { GameScreen } from '@/screens/Game';
import { COLORS } from '@/constants/theme';

type AppScreen =
  | { type: 'pointCap' }
  | { type: 'armyBuilder'; player: 1 | 2; pointCap: number; player1Army?: ArmyConfig }
  | { type: 'handoff'; pointCap: number; player1Army: ArmyConfig }
  | { type: 'game'; player1Army: ArmyConfig; player2Army: ArmyConfig };

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });
  const [screen, setScreen] = useState<AppScreen>({ type: 'pointCap' });

  if (!fontsLoaded) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#00ff00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {screen.type === 'pointCap' && (
        <PointCapScreen
          onStart={(pointCap) =>
            setScreen({ type: 'armyBuilder', player: 1, pointCap })
          }
        />
      )}
      {screen.type === 'armyBuilder' && screen.player === 1 && (
        <ArmyBuilderScreen
          player={1}
          pointCap={screen.pointCap}
          onConfirm={(army) =>
            setScreen({ type: 'handoff', pointCap: screen.pointCap, player1Army: army })
          }
        />
      )}
      {screen.type === 'handoff' && (
        <HandoffScreen
          onContinue={() =>
            setScreen({
              type: 'armyBuilder',
              player: 2,
              pointCap: screen.pointCap,
              player1Army: screen.player1Army,
            })
          }
        />
      )}
      {screen.type === 'armyBuilder' && screen.player === 2 && (
        <ArmyBuilderScreen
          player={2}
          pointCap={screen.pointCap}
          onConfirm={(army) =>
            setScreen({ type: 'game', player1Army: screen.player1Army!, player2Army: army })
          }
        />
      )}
      {screen.type === 'game' && (
        <GameScreen
          p1Army={screen.player1Army}
          p2Army={screen.player2Army}
        />
      )}
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
