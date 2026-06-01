import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, StyleSheet } from 'react-native';
import type { Piece } from '@/types/game';
import { getSprite } from '@/constants/sprites';

type Props = {
  piece: Piece;
  tileSize: number;
  onDone: () => void;
};

const DURATION_MS = 280;
const SHAKE_STEP_MS = 40;

export function DyingPiece({ piece, tileSize, onDone }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: DURATION_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.5,
        duration: DURATION_MS,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(shake, { toValue: 5, duration: SHAKE_STEP_MS, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -5, duration: SHAKE_STEP_MS, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 3, duration: SHAKE_STEP_MS, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -3, duration: SHAKE_STEP_MS, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: SHAKE_STEP_MS, useNativeDriver: true }),
      ]),
    ]).start(({ finished }) => {
      if (finished) onDone();
    });
    // mount-only — capture-and-vanish lifecycle is one-shot
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrapper,
        {
          width: tileSize,
          height: tileSize,
          left: piece.col * tileSize,
          top: (7 - piece.row) * tileSize,
          opacity,
          transform: [{ translateX: shake }, { scale }],
        },
      ]}
    >
      <Image
        source={getSprite(piece.color, piece.type)!}
        style={{ width: tileSize, height: tileSize }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
  },
});
