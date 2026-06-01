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

const OUTLINE = '#000000';
const HIGHLIGHT = '#fff6c2';
const GOLD = '#f5c518';
const SHADOW = '#c8860c';

function tileCenterX(col: number, tileSize: number): number {
  return col * tileSize + tileSize / 2;
}
function tileCenterY(row: number, tileSize: number): number {
  return (7 - row) * tileSize + tileSize / 2;
}

// All integer grid cells on the line between two grid points (Bresenham).
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
 * Pixel-art lightning bolt drawn as a Bresenham "staircase" of square pixels
 * between two tiles. Axis-aligned blocks keep it crisp at any angle/length.
 * Body is shaded (pale left edge, gold middle, dark right edge) with a black
 * outline, then a quick flickering strike. Used for WizardKing + WizardTower.
 */
export function LightningBolt({ fromRow, fromCol, toRow, toCol, tileSize, onDone }: Props) {
  const opacity = useSharedValue(0);

  const { cells, px } = useMemo(() => {
    const px = Math.max(2, Math.round(tileSize / 9));
    const sx = tileCenterX(fromCol, tileSize);
    const sy = tileCenterY(fromRow, tileSize);
    const ex = tileCenterX(toCol, tileSize);
    const ey = tileCenterY(toRow, tileSize);
    const dx = ex - sx;
    const dy = ey - sy;
    const len = Math.hypot(dx, dy) || 1;
    const perpX = -dy / len;
    const perpY = dx / len;
    const steep = Math.abs(dy) >= Math.abs(dx);

    // Jagged waypoints: zigzag perpendicular to the straight path.
    const KINKS = 4;
    const jitter = px * 1.6;
    const pts: Array<[number, number]> = [];
    for (let k = 0; k <= KINKS; k++) {
      const t = k / KINKS;
      const bx = sx + dx * t;
      const by = sy + dy * t;
      const off = k === 0 || k === KINKS ? 0 : (k % 2 === 1 ? 1 : -1) * jitter;
      pts.push([bx + perpX * off, by + perpY * off]);
    }

    // Rasterize the spine in grid (pixel) space.
    const spine = new Set<string>();
    for (let i = 0; i < pts.length - 1; i++) {
      const g0x = Math.round(pts[i][0] / px);
      const g0y = Math.round(pts[i][1] / px);
      const g1x = Math.round(pts[i + 1][0] / px);
      const g1y = Math.round(pts[i + 1][1] / px);
      for (const [cx, cy] of bresenham(g0x, g0y, g1x, g1y)) spine.add(`${cx},${cy}`);
    }

    // Thicken to ~2px perpendicular to the dominant axis.
    const body = new Set<string>();
    for (const key of spine) {
      const [cx, cy] = key.split(',').map(Number);
      body.add(`${cx},${cy}`);
      body.add(steep ? `${cx + 1},${cy}` : `${cx},${cy + 1}`);
    }

    // Outline = 8-neighbour cells that aren't part of the body.
    const outline = new Set<string>();
    for (const key of body) {
      const [cx, cy] = key.split(',').map(Number);
      for (let ox = -1; ox <= 1; ox++) {
        for (let oy = -1; oy <= 1; oy++) {
          if (ox === 0 && oy === 0) continue;
          const nk = `${cx + ox},${cy + oy}`;
          if (!body.has(nk)) outline.add(nk);
        }
      }
    }

    const cells: Cell[] = [];
    for (const key of outline) {
      const [cx, cy] = key.split(',').map(Number);
      cells.push({ x: cx * px, y: cy * px, color: OUTLINE });
    }
    for (const key of body) {
      const [cx, cy] = key.split(',').map(Number);
      const leftEdge = !body.has(`${cx - 1},${cy}`);
      const rightEdge = !body.has(`${cx + 1},${cy}`);
      const color = leftEdge ? HIGHLIGHT : rightEdge ? SHADOW : GOLD;
      cells.push({ x: cx * px, y: cy * px, color });
    }
    return { cells, px };
  }, [fromRow, fromCol, toRow, toCol, tileSize]);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 40 }),
      withTiming(0.35, { duration: 45 }),
      withTiming(1, { duration: 55 }),
      withTiming(1, { duration: 90 }),
      withTiming(0, { duration: 140 }, (finished) => {
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
          style={{
            position: 'absolute',
            left: c.x,
            top: c.y,
            width: px,
            height: px,
            backgroundColor: c.color,
          }}
        />
      ))}
    </Animated.View>
  );
}
