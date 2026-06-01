import { useEffect, useMemo } from 'react';
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
  durationMs?: number;
  arcHeight?: number;
};

const DARK = '#7c7c7c';   // outline
const BODY = '#c7c2c4';   // main grey
const SHADE = '#b1acae';  // darker speckle
const LIGHT = '#e4e0e1';  // bright speckle
const MAUVE = '#cabdc2';  // warm/pink speckle

function tileCenterX(col: number, tileSize: number): number {
  return col * tileSize + tileSize / 2;
}
function tileCenterY(row: number, tileSize: number): number {
  return (7 - row) * tileSize + tileSize / 2;
}

// Deterministic 0..1 hash so the speckle pattern is stable across renders.
function hash(r: number, c: number): number {
  const v = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

type Cell = { x: number; y: number; color: string };

/**
 * Pixel-art boulder that flies a parabolic arc from thrower to target, spinning
 * as it goes. The rock is a procedurally filled circle: dark outline ring,
 * grey body with light/mauve/shadow speckles. Used for BoulderThrower.
 */
export function BoulderThrow({
  fromRow,
  fromCol,
  toRow,
  toCol,
  tileSize,
  onDone,
  durationMs = 380,
  arcHeight,
}: Props) {
  const t = useSharedValue(0);

  const sx = tileCenterX(fromCol, tileSize);
  const sy = tileCenterY(fromRow, tileSize);
  const ex = tileCenterX(toCol, tileSize);
  const ey = tileCenterY(toRow, tileSize);
  const dist = Math.hypot(ex - sx, ey - sy);
  const peak = arcHeight ?? Math.max(40, dist * 0.35);

  const { cells, boulderSize, px } = useMemo(() => {
    const px = Math.max(2, Math.round(tileSize / 18));
    const baseRad = 5.5;
    const half = 8; // grid radius in cells — leaves room for the wobble
    const grid = half * 2 + 1;
    const boulderSize = grid * px;
    const cells: Cell[] = [];
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        const dx = c - half;
        const dy = r - half;
        const d = Math.hypot(dx, dy);
        const ang = Math.atan2(dy, dx);
        // Lumpy outline: sum of a few offset waves → bumps + flat spots,
        // still mostly convex so it reads as a rounded rock.
        const wobble =
          Math.sin(ang * 3 + 0.7) * 1.0 +
          Math.sin(ang * 5 + 2.1) * 0.6 +
          Math.cos(ang * 2 - 1.2) * 0.5;
        const effRad = baseRad + wobble;
        if (d > effRad) continue;
        let color: string;
        if (d > effRad - 0.9) {
          color = DARK;
        } else {
          const h = hash(r, c);
          color = h < 0.12 ? LIGHT : h < 0.22 ? MAUVE : h < 0.3 ? SHADE : BODY;
        }
        cells.push({ x: c * px, y: r * px, color });
      }
    }
    return { cells, boulderSize, px };
  }, [tileSize]);

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
    const x = sx + (ex - sx) * p - boulderSize / 2;
    const y = sy + (ey - sy) * p - 4 * peak * p * (1 - p) - boulderSize / 2;
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${p * 360}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        { position: 'absolute', left: 0, top: 0, width: boulderSize, height: boulderSize },
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
            backgroundColor: c.color,
          }}
        />
      ))}
    </Animated.View>
  );
}
