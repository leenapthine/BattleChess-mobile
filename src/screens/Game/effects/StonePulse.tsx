import { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

type Props = {
  row: number;
  col: number;
  tileSize: number;
  onDone: () => void;
  // true when petrifying, false when reverting back to flesh.
  on: boolean;
};

/**
 * Grey petrify flash over a tile (Familiar toggle-stone). Slams in when
 * turning to stone, eases out when reverting, then fades.
 */
export function StonePulse({ row, col, tileSize, onDone, on }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(on ? 1.35 : 0.7);

  useEffect(() => {
    scale.value = withTiming(1, {
      duration: 320,
      easing: on ? Easing.out(Easing.back(1.6)) : Easing.out(Easing.quad),
    });
    opacity.value = withSequence(
      withTiming(0.85, { duration: 140 }),
      withTiming(0, { duration: 320 }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
    // mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
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
          borderRadius: 4,
          backgroundColor: '#8a8f98',
          borderWidth: 2,
          borderColor: '#cfd4da',
        },
        animatedStyle,
      ]}
    />
  );
}
