import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

type Props = {
  row: number;
  col: number;
  tileSize: number;
  onDone: () => void;
  color?: string;
  durationMs?: number;
  maxScale?: number;
};

/**
 * Expanding ring used for AoE detonations (NecroPawn, QueenOfDestruction).
 * Starts at the source tile and scales outward while fading.
 */
export function Shockwave({
  row,
  col,
  tileSize,
  onDone,
  color = '#ff6633',
  durationMs = 420,
  maxScale = 3.4,
}: Props) {
  const scale = useSharedValue(0.25);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withTiming(maxScale, {
      duration: durationMs,
      easing: Easing.out(Easing.quad),
    });
    opacity.value = withTiming(
      0,
      { duration: durationMs, easing: Easing.in(Easing.quad) },
      (finished) => {
        if (finished) runOnJS(onDone)();
      },
    );
    // mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: col * tileSize,
          top: (7 - row) * tileSize,
          width: tileSize,
          height: tileSize,
          borderRadius: tileSize / 2,
          borderWidth: 4,
          borderColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}
