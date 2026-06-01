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
  // true when petrifying, false when reverting back to flesh.
  on: boolean;
};

const OUTLINE = '#5f6368';
const BODY = '#9aa0a6';
const CRACK = '#70757a';
const LIGHT = '#c4c9ce';

// Deterministic 0..1 hash for crack/light speckle placement.
function hash(a: number, b: number): number {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

type Cell = { x: number; y: number; color: string };

/**
 * Pixel-art petrify slab (Familiar turn-to-stone / revert). A rounded grey
 * stone block with outline + cracks builds over the tile, slamming in when
 * petrifying and easing out when reverting, then fades.
 */
export function StonePulse({ row, col, tileSize, onDone, on }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(on ? 1.3 : 0.7);

  const { cells, px, span } = useMemo(() => {
    const px = Math.max(2, Math.round(tileSize / 10));
    const n = 8; // 8×8 block of pixels ≈ 0.8 tile
    const span = n * px;
    const cells: Cell[] = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        // round the corners off
        const corner =
          (r === 0 || r === n - 1) && (c === 0 || c === n - 1);
        if (corner) continue;
        const edge = r === 0 || r === n - 1 || c === 0 || c === n - 1;
        let color: string;
        if (edge) {
          color = OUTLINE;
        } else {
          const h = hash(r, c);
          color = h < 0.16 ? CRACK : h < 0.28 ? LIGHT : BODY;
        }
        cells.push({ x: c * px, y: r * px, color });
      }
    }
    return { cells, px, span };
  }, [tileSize]);

  const left = col * tileSize + (tileSize - span) / 2;
  const top = (7 - row) * tileSize + (tileSize - span) / 2;

  useEffect(() => {
    scale.value = withTiming(1, {
      duration: 320,
      easing: on ? Easing.out(Easing.back(1.7)) : Easing.out(Easing.quad),
    });
    opacity.value = withSequence(
      withTiming(0.9, { duration: 150 }),
      withTiming(0, { duration: 340 }, (finished) => {
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
      style={[{ position: 'absolute', left, top, width: span, height: span }, animatedStyle]}
    >
      {cells.map((c, i) => (
        <View
          key={i}
          style={{ position: 'absolute', left: c.x, top: c.y, width: px, height: px, backgroundColor: c.color }}
        />
      ))}
    </Animated.View>
  );
}
