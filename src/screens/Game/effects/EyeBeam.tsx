import { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';

type Props = {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  tileSize: number;
  onDone: () => void;
};

const BODY = '#d24bff';   // magenta beam
const CORE = '#f3b0ff';   // bright core / iris flash

function tileCenter(coord: number, tileSize: number): number {
  return coord * tileSize + tileSize / 2;
}

function bresenham(x0: number, y0: number, x1: number, y1: number): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  let x = x0;
  let y = y0;
  let guard = 0;
  while (guard++ < 4000) {
    cells.push([x, y]);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  return cells;
}

type Cell = { x: number; y: number; color: string };

/**
 * Pixel-art eye beam (Beholder). A straight Bresenham pixel ray from the
 * Beholder to its target with a brighter core near the source (iris flash),
 * flickering on then fading.
 */
export function EyeBeam({ fromRow, fromCol, toRow, toCol, tileSize, onDone }: Props) {
  const opacity = useSharedValue(0);

  const { cells, px } = useMemo(() => {
    const px = Math.max(2, Math.round(tileSize / 9));
    const sgx = Math.round(tileCenter(fromCol, tileSize) / px);
    const sgy = Math.round(tileCenter(7 - fromRow, tileSize) / px);
    const tgx = Math.round(tileCenter(toCol, tileSize) / px);
    const tgy = Math.round(tileCenter(7 - toRow, tileSize) / px);

    const steep = Math.abs(tgy - sgy) >= Math.abs(tgx - sgx);
    const spine = bresenham(sgx, sgy, tgx, tgy);
    const body = new Set<string>();
    for (const [cx, cy] of spine) {
      body.add(`${cx},${cy}`);
      body.add(steep ? `${cx + 1},${cy}` : `${cx},${cy + 1}`);
    }

    const cells: Cell[] = [];
    for (const key of body) {
      const [cx, cy] = key.split(',').map(Number);
      // brighter near the source (first ~3 cells of distance)
      const distFromSource = Math.hypot(cx - sgx, cy - sgy);
      cells.push({ x: cx * px, y: cy * px, color: distFromSource < 3 ? CORE : BODY });
    }
    // iris flash: 3×3 bright block at the source
    for (let ox = -1; ox <= 1; ox++) {
      for (let oy = -1; oy <= 1; oy++) {
        cells.push({ x: (sgx + ox) * px, y: (sgy + oy) * px, color: CORE });
      }
    }
    return { cells, px };
  }, [fromRow, fromCol, toRow, toCol, tileSize]);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 50 }),
      withTiming(0.5, { duration: 50 }),
      withTiming(1, { duration: 60 }),
      withTiming(1, { duration: 90 }),
      withTiming(0, { duration: 150 }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
    // mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, animatedStyle]}>
      {cells.map((c, i) => (
        <View
          key={i}
          style={{ position: 'absolute', left: c.x, top: c.y, width: px, height: px, backgroundColor: c.color }}
        />
      ))}
    </Animated.View>
  );
}
