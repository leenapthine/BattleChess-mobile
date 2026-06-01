import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
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
  color?: string;
  thickness?: number;
  extendMs?: number;
  holdMs?: number;
  fadeMs?: number;
};

function tileCenterX(col: number, tileSize: number): number {
  return col * tileSize + tileSize / 2;
}
function tileCenterY(row: number, tileSize: number): number {
  return (7 - row) * tileSize + tileSize / 2;
}

/**
 * Straight beam between two squares — extends from source to target, holds
 * briefly, then fades. Used for Beholder eye beam, WizardKing vertical
 * shot, WizardTower lightning, etc.
 */
export function Beam({
  fromRow,
  fromCol,
  toRow,
  toCol,
  tileSize,
  onDone,
  color = '#ff66ff',
  thickness = 5,
  extendMs = 110,
  holdMs = 90,
  fadeMs = 160,
}: Props) {
  const scaleX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const sx = tileCenterX(fromCol, tileSize);
  const sy = tileCenterY(fromRow, tileSize);
  const ex = tileCenterX(toCol, tileSize);
  const ey = tileCenterY(toRow, tileSize);
  const length = Math.hypot(ex - sx, ey - sy);
  const angleDeg = (Math.atan2(ey - sy, ex - sx) * 180) / Math.PI;

  useEffect(() => {
    scaleX.value = withTiming(1, {
      duration: extendMs,
      easing: Easing.out(Easing.quad),
    });
    opacity.value = withSequence(
      withDelay(extendMs + holdMs, withTiming(0, { duration: fadeMs }, (finished) => {
        if (finished) runOnJS(onDone)();
      })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${angleDeg}deg` },
      { scaleX: scaleX.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: sx,
          top: sy - thickness / 2,
          width: length,
          height: thickness,
          transformOrigin: 'left center',
        },
        animatedStyle,
      ]}
    >
      <View
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: color,
          borderRadius: thickness / 2,
          shadowColor: color,
          shadowOpacity: 0.9,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
    </Animated.View>
  );
}
