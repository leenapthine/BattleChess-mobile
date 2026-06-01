import { useEffect, useMemo } from 'react';
import { Image, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import type { Color, PieceType } from '@/types/game';
import { getSprite } from '@/constants/sprites';

type Props = {
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  tileSize: number;
  spriteColor: Color;
  spriteType: PieceType;
  onDone: () => void;
  durationMs?: number;
};

const DEBRIS = ['#b1acae', '#7c7c7c', '#cabdc2', '#e4e0e1'];

function tileCenterX(col: number, tileSize: number): number {
  return col * tileSize + tileSize / 2;
}
function tileCenterY(row: number, tileSize: number): number {
  return (7 - row) * tileSize + tileSize / 2;
}

function hash(a: number, b: number): number {
  const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

type Cell = { x: number; y: number; color: string };

/**
 * The loaded pawn sprite hurled from a DeadLauncher to its target — flies a
 * parabolic arc while spinning (two full rotations), then pops a small debris
 * puff on impact. Used for the `launch` effect.
 */
export function LaunchProjectile({
  fromRow,
  fromCol,
  toRow,
  toCol,
  tileSize,
  spriteColor,
  spriteType,
  onDone,
  durationMs = 420,
}: Props) {
  const t = useSharedValue(0);
  const dust = useSharedValue(0);

  const sx = tileCenterX(fromCol, tileSize);
  const sy = tileCenterY(fromRow, tileSize);
  const ex = tileCenterX(toCol, tileSize);
  const ey = tileCenterY(toRow, tileSize);
  const dist = Math.hypot(ex - sx, ey - sy);
  const peak = Math.max(40, dist * 0.35);
  const size = tileSize * 0.7;

  const dustSize = tileSize;
  const dustPx = Math.max(2, Math.round(tileSize / 10));
  const dustCells = useMemo(() => {
    const arr: Cell[] = [];
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + hash(i, 5);
      const rad = tileSize * 0.1 + hash(i, 6) * tileSize * 0.16;
      arr.push({
        x: dustSize / 2 + Math.cos(a) * rad - dustPx / 2,
        y: dustSize / 2 + Math.sin(a) * rad - dustPx / 2,
        color: DEBRIS[i % DEBRIS.length],
      });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tileSize]);

  useEffect(() => {
    t.value = withTiming(1, { duration: durationMs, easing: Easing.linear });
    dust.value = withDelay(
      durationMs,
      withTiming(1, { duration: 200 }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
    // mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spriteStyle = useAnimatedStyle(() => {
    const p = t.value;
    const x = sx + (ex - sx) * p - size / 2;
    const y = sy + (ey - sy) * p - 4 * peak * p * (1 - p) - size / 2;
    return {
      opacity: p < 0.94 ? 1 : 0,
      transform: [{ translateX: x }, { translateY: y }, { rotate: `${p * 720}deg` }],
    };
  });

  const dustStyle = useAnimatedStyle(() => ({
    opacity: 1 - dust.value,
    transform: [{ scale: 0.5 + dust.value * 1.1 }],
  }));

  const src = getSprite(spriteColor, spriteType);

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, spriteStyle]}
      >
        {src && <Image source={src} style={{ width: '100%', height: '100%' }} />}
      </Animated.View>
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', left: ex - dustSize / 2, top: ey - dustSize / 2, width: dustSize, height: dustSize },
          dustStyle,
        ]}
      >
        {dustCells.map((c, i) => (
          <View
            key={i}
            style={{ position: 'absolute', left: c.x, top: c.y, width: dustPx, height: dustPx, backgroundColor: c.color }}
          />
        ))}
      </Animated.View>
    </>
  );
}
