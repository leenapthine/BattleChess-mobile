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
  // Only one pulse per stun burst drives the queue cleanup; the rest omit it.
  onDone?: () => void;
};

/**
 * Yellow electric flash over a stunned tile (GhostKnight aura). Pulses twice
 * while gently scaling, then fades. Multiple are rendered at once — one per
 * affected square.
 */
export function StunPulse({ row, col, tileSize, onDone }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withTiming(1.08, { duration: 600, easing: Easing.out(Easing.quad) });
    opacity.value = withSequence(
      withTiming(0.85, { duration: 110 }),
      withTiming(0.25, { duration: 130 }),
      withTiming(0.85, { duration: 130 }),
      withTiming(0, { duration: 230 }, (finished) => {
        if (finished && onDone) runOnJS(onDone)();
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
          borderRadius: 6,
          borderWidth: 3,
          borderColor: '#ffe14d',
          backgroundColor: 'rgba(255, 225, 77, 0.18)',
        },
        animatedStyle,
      ]}
    />
  );
}
