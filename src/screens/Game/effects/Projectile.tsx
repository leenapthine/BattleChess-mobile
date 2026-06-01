import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

type Props = {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  tileSize: number;
  onDone: () => void;
  color?: string;
  size?: number;       // diameter in px; defaults to tileSize / 2
  durationMs?: number;
  arcHeight?: number;  // peak rise in px; auto-computed from distance if omitted
  spin?: boolean;      // whether the projectile rotates as it flies
};

function tileCenterX(col: number, tileSize: number): number {
  return col * tileSize + tileSize / 2;
}
function tileCenterY(row: number, tileSize: number): number {
  return (7 - row) * tileSize + tileSize / 2;
}

/**
 * Generic projectile that flies in a parabolic arc from one square's centre
 * to another. Used for BoulderThrower, DeadLauncher pawns, etc.
 */
export function Projectile({
  fromRow,
  fromCol,
  toRow,
  toCol,
  tileSize,
  onDone,
  color = '#8b6f47',
  size,
  durationMs = 360,
  arcHeight,
  spin = true,
}: Props) {
  const t = useSharedValue(0);

  const sx = tileCenterX(fromCol, tileSize);
  const sy = tileCenterY(fromRow, tileSize);
  const ex = tileCenterX(toCol, tileSize);
  const ey = tileCenterY(toRow, tileSize);
  const dist = Math.hypot(ex - sx, ey - sy);
  const peak = arcHeight ?? Math.max(40, dist * 0.35);
  const dotSize = size ?? Math.max(12, tileSize * 0.45);

  useEffect(() => {
    t.value = withTiming(
      1,
      { duration: durationMs, easing: Easing.linear },
      (finished) => {
        if (finished) runOnJS(onDone)();
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const p = t.value;
    // Linear x interpolation, parabolic y dip upward (subtract peak * 4p(1-p))
    const x = sx + (ex - sx) * p - dotSize / 2;
    const y = sy + (ey - sy) * p - 4 * peak * p * (1 - p) - dotSize / 2;
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        ...(spin ? [{ rotate: `${p * 360}deg` }] : []),
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: 0,
          top: 0,
          width: dotSize,
          height: dotSize,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          width: '100%',
          height: '100%',
          borderRadius: dotSize / 2,
          backgroundColor: color,
          borderWidth: 2,
          borderColor: '#000000',
        }}
      />
    </Animated.View>
  );
}
