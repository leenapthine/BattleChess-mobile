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
  // Only one pulse per stun burst drives the queue cleanup; the rest omit it.
  onDone?: () => void;
};

const YELLOW = '#ffe14d';
const WHITE = '#fffadf';

// Spark anchor points around the tile (fractions of tile size).
const SPARKS = [
  { fx: 0.5, fy: 0.12 },
  { fx: 0.86, fy: 0.4 },
  { fx: 0.72, fy: 0.84 },
  { fx: 0.18, fy: 0.72 },
  { fx: 0.14, fy: 0.32 },
];

type Cell = { x: number; y: number; color: string };

/**
 * Pixel-art stun sparks — small yellow electric "plus" stars scattered around
 * a stunned tile, flickering twice then fading. Used per affected square.
 */
export function StunPulse({ row, col, tileSize, onDone }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.7);

  const { cells, px } = useMemo(() => {
    const px = Math.max(2, Math.round(tileSize / 11));
    const cells: Cell[] = [];
    for (const s of SPARKS) {
      const cxp = Math.round((s.fx * tileSize) / px);
      const cyp = Math.round((s.fy * tileSize) / px);
      // plus shape + diagonal tips = a little spark
      cells.push({ x: cxp * px, y: cyp * px, color: WHITE });
      cells.push({ x: (cxp + 1) * px, y: cyp * px, color: YELLOW });
      cells.push({ x: (cxp - 1) * px, y: cyp * px, color: YELLOW });
      cells.push({ x: cxp * px, y: (cyp + 1) * px, color: YELLOW });
      cells.push({ x: cxp * px, y: (cyp - 1) * px, color: YELLOW });
    }
    return { cells, px };
  }, [tileSize]);

  useEffect(() => {
    scale.value = withTiming(1.1, { duration: 560 });
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0.25, { duration: 120 }),
      withTiming(1, { duration: 120 }),
      withTiming(0, { duration: 220 }, (finished) => {
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
        },
        animatedStyle,
      ]}
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
