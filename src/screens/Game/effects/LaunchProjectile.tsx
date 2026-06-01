import { useEffect } from 'react';
import { Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
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

function tileCenterX(col: number, tileSize: number): number {
  return col * tileSize + tileSize / 2;
}
function tileCenterY(row: number, tileSize: number): number {
  return (7 - row) * tileSize + tileSize / 2;
}

/**
 * The loaded pawn sprite hurled from a DeadLauncher to its target — flies a
 * parabolic arc while spinning (two full rotations). Used for the `launch`
 * effect; the sprite is whatever pawn-type the launcher was holding.
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

  const sx = tileCenterX(fromCol, tileSize);
  const sy = tileCenterY(fromRow, tileSize);
  const ex = tileCenterX(toCol, tileSize);
  const ey = tileCenterY(toRow, tileSize);
  const dist = Math.hypot(ex - sx, ey - sy);
  const peak = Math.max(40, dist * 0.35);
  const size = tileSize * 0.7;

  useEffect(() => {
    t.value = withTiming(1, { duration: durationMs, easing: Easing.linear }, (finished) => {
      if (finished) runOnJS(onDone)();
    });
    // mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const p = t.value;
    const x = sx + (ex - sx) * p - size / 2;
    const y = sy + (ey - sy) * p - 4 * peak * p * (1 - p) - size / 2;
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${p * 720}deg` },
      ],
    };
  });

  const src = getSprite(spriteColor, spriteType);

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', left: 0, top: 0, width: size, height: size }, animatedStyle]}
    >
      {src && <Image source={src} style={{ width: '100%', height: '100%' }} />}
    </Animated.View>
  );
}
