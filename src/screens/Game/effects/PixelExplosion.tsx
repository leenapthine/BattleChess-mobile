import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
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
};

const MAIN = '#f4e04d';
const LIGHT = '#faf08a';

// Deterministic 0..1 hash so the burst shape is stable across renders.
function hash(a: number, b: number): number {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

type Cell = { x: number; y: number; c: string };

/**
 * Pixel-art explosion (NecroPawn detonation). A spiky yellow burst — radial
 * rays of varying length, a jagged core ring, and a few detached sparks —
 * that scales up from tiny with an accelerating (ease-in) curve so it starts
 * slow then bursts outward, fading as it peaks.
 */
export function PixelExplosion({ row, col, tileSize, onDone }: Props) {
  const scale = useSharedValue(0.12);
  const opacity = useSharedValue(1);

  const { cells, px, fullSize } = useMemo(() => {
    const px = Math.max(2, Math.round(tileSize / 10));
    const half = 12;
    const grid = half * 2 + 1;
    const fullSize = grid * px;

    const set = new Set<string>();
    const add = (x: number, y: number) => {
      if (x >= 0 && x < grid && y >= 0 && y < grid) set.add(`${x},${y}`);
    };

    // Radial rays — jittered angle, random length, some 2px thick.
    const RAYS = 22;
    for (let i = 0; i < RAYS; i++) {
      const a = (i / RAYS) * Math.PI * 2 + (hash(i, 1) - 0.5) * 0.4;
      const len = 4 + hash(i, 2) * 9;
      const start = 1.5 + hash(i, 3) * 1.5; // hollow-ish centre
      const thick = hash(i, 4) < 0.3;
      for (let r = start; r <= len; r += 0.8) {
        const x = Math.round(half + Math.cos(a) * r);
        const y = Math.round(half + Math.sin(a) * r);
        add(x, y);
        if (thick) add(x + 1, y);
      }
      // detached spark beyond some ray tips
      if (hash(i, 5) < 0.4) {
        const r2 = len + 1.5 + hash(i, 6) * 2;
        add(Math.round(half + Math.cos(a) * r2), Math.round(half + Math.sin(a) * r2));
      }
    }

    // Jagged core ring to tie the rays together.
    for (let a = 0; a < Math.PI * 2; a += 0.25) {
      const rr = 3 + (hash(Math.round(a * 10), 7) - 0.5) * 2;
      add(Math.round(half + Math.cos(a) * rr), Math.round(half + Math.sin(a) * rr));
    }

    const cells: Cell[] = [];
    for (const key of set) {
      const [x, y] = key.split(',').map(Number);
      cells.push({ x: x * px, y: y * px, c: hash(x, y) < 0.2 ? LIGHT : MAIN });
    }
    return { cells, px, fullSize };
  }, [tileSize]);

  const left = col * tileSize + tileSize / 2 - fullSize / 2;
  const top = (7 - row) * tileSize + tileSize / 2 - fullSize / 2;

  useEffect(() => {
    scale.value = withTiming(1, { duration: 520, easing: Easing.in(Easing.cubic) });
    opacity.value = withSequence(
      withTiming(1, { duration: 360 }),
      withTiming(0, { duration: 220 }, (finished) => {
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
      style={[{ position: 'absolute', left, top, width: fullSize, height: fullSize }, animatedStyle]}
    >
      {cells.map((c, i) => (
        <View
          key={i}
          style={{ position: 'absolute', left: c.x, top: c.y, width: px, height: px, backgroundColor: c.c }}
        />
      ))}
    </Animated.View>
  );
}
