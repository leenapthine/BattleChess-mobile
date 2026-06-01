import { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
  type SharedValue,
} from 'react-native-reanimated';

export type BurstMode = 'out' | 'in' | 'up';

type Props = {
  row: number;
  col: number;
  tileSize: number;
  colors: string[];
  mode?: BurstMode;
  count?: number;
  durationMs?: number;
  // Only one burst in a multi-burst effect should drive the queue cleanup.
  onDone?: () => void;
};

// Deterministic 0..1 hash so each burst is stable across renders.
function hash(a: number, b: number): number {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

type Spec = { angle: number; rStart: number; rEnd: number; color: string; size: number };

function Particle({
  spec,
  cx,
  cy,
  t,
}: {
  spec: Spec;
  cx: number;
  cy: number;
  t: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => {
    const p = t.value;
    const r = spec.rStart + (spec.rEnd - spec.rStart) * p;
    const x = cx + Math.cos(spec.angle) * r - spec.size / 2;
    const y = cy + Math.sin(spec.angle) * r - spec.size / 2;
    // quick fade-in then fade-out so particles don't pop
    const opacity = p < 0.12 ? p / 0.12 : 1 - (p - 0.12) / 0.88;
    return { opacity: Math.max(0, opacity), transform: [{ translateX: x }, { translateY: y }] };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: 0, top: 0, width: spec.size, height: spec.size, backgroundColor: spec.color },
        style,
      ]}
    />
  );
}

/**
 * Pixel-art particle poof on a tile. `mode` controls motion:
 *  - 'out' — particles fly outward (explode / transform / convert / dominate)
 *  - 'in'  — particles converge inward then vanish (Howler absorb)
 *  - 'up'  — particles rise from the tile (summon: raise / revive)
 * Colors cycle through the supplied palette.
 */
export function PixelBurst({
  row,
  col,
  tileSize,
  colors,
  mode = 'out',
  count = 16,
  durationMs = 460,
  onDone,
}: Props) {
  const t = useSharedValue(0);

  const cx = col * tileSize + tileSize / 2;
  const cy = (7 - row) * tileSize + tileSize / 2;

  const specs = useMemo(() => {
    const px = Math.max(2, Math.round(tileSize / 9));
    const maxR = tileSize * 1.05;
    const arr: Spec[] = [];
    for (let i = 0; i < count; i++) {
      const angle =
        mode === 'up'
          ? -Math.PI / 2 + (hash(i, 2) - 0.5) * Math.PI * 0.9
          : (i / count) * Math.PI * 2 + (hash(i, 2) - 0.5) * 0.5;
      const reach = maxR * (0.45 + hash(i, 3) * 0.55);
      const rStart = mode === 'in' ? reach : px * 0.5;
      const rEnd = mode === 'in' ? px * 0.3 : reach;
      const size = hash(i, 4) < 0.3 ? px * 0.7 : px;
      arr.push({ angle, rStart, rEnd, color: colors[i % colors.length], size });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileSize, count, mode]);

  useEffect(() => {
    t.value = withTiming(1, { duration: durationMs, easing: Easing.out(Easing.quad) }, (finished) => {
      if (finished && onDone) runOnJS(onDone)();
    });
    // mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {specs.map((spec, i) => (
        <Particle key={i} spec={spec} cx={cx} cy={cy} t={t} />
      ))}
    </View>
  );
}
