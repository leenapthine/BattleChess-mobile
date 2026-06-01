import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';

type Props = {
  row: number;
  col: number;
  tileSize: number;
  onDone: () => void;
};

const COLORS: Record<string, string> = {
  r: '#e8431f', // red-orange
  o: '#f5821f', // orange
  a: '#f6a623', // amber
  y: '#f7d44a', // yellow base
};

// Hand-authored pixel flame (9 wide × 12 tall). '.' = empty.
const FLAME = [
  '...rr....',
  '..rr.....',
  '..rr..rr.',
  '..r.oorr.',
  '.rr.ooor.',
  '.r.ooaor.',
  '.rooaaoor',
  'rroaaaaor',
  'rroaayaor',
  '.roayyaor',
  '..oayyyo.',
  '..yyyyy..',
];

/**
 * Small pixel-art flame on a tile (YoungWiz forward zap). Sits on the target
 * square's base and flickers/licks upward (scaleY pulse, origin bottom), then
 * dies down.
 */
export function FireBurst({ row, col, tileSize, onDone }: Props) {
  const scaleY = useSharedValue(0.35);
  const opacity = useSharedValue(0);

  const { cells, px, left, top, w, h } = useMemo(() => {
    const rows = FLAME.length;
    const cols = FLAME[0].length;
    const px = Math.max(2, Math.round(tileSize / 12));
    const w = cols * px;
    const h = rows * px;
    const left = col * tileSize + (tileSize - w) / 2;
    const top = (7 - row) * tileSize + tileSize - h; // base flush with tile bottom
    const cells: Array<{ x: number; y: number; c: string }> = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const color = COLORS[FLAME[r][c]];
        if (color) cells.push({ x: c * px, y: r * px, c: color });
      }
    }
    return { cells, px, left, top, w, h };
  }, [row, col, tileSize]);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 60 }),
      withTiming(1, { duration: 430 }),
      withTiming(0, { duration: 180 }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
    scaleY.value = withSequence(
      withTiming(1.14, { duration: 90 }),
      withTiming(0.93, { duration: 90 }),
      withTiming(1.09, { duration: 90 }),
      withTiming(0.98, { duration: 90 }),
      withTiming(1.05, { duration: 100 }),
      withTiming(1, { duration: 120 }),
    );
    // mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scaleY: scaleY.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left, top, width: w, height: h, transformOrigin: ['50%', '100%', 0] },
        animatedStyle,
      ]}
    >
      {cells.map((c, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: c.x,
            top: c.y,
            width: px,
            height: px,
            backgroundColor: c.c,
          }}
        />
      ))}
    </Animated.View>
  );
}
