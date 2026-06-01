import { useEffect, useRef } from 'react';
import { Animated, Easing, Image } from 'react-native';
import type { Piece } from '@/types/game';
import { getSprite } from '@/constants/sprites';

// Module-scoped tracker of each piece's last-rendered position.
// When a piece re-mounts at a new square, we read its previous position
// here, compute the visual delta, and glide it from old → new.
const lastPositions = new Map<string, { row: number; col: number }>();

// Seed the position tracker so the given pieces mount in place (no glide) on
// their next render. Used by the replay system to stage the "before" frame
// without a backward rewind-slide.
export function seedLastPositions(pieces: Piece[]): void {
  for (const p of pieces) lastPositions.set(p.id, { row: p.row, col: p.col });
}

type Props = {
  piece: Piece;
  tileSize: number;
  startDelay?: number;
};

const DURATION_MS = 180;

export function AnimatedPiece({ piece, tileSize, startDelay = 0 }: Props) {
  // Read previous position before mutating tracker. The render path is
  // top-down (row 7 at the top, row 0 at the bottom), so a positive
  // delta-Y moves the sprite down on screen.
  const prev = lastPositions.get(piece.id);
  const dx =
    prev && (prev.col !== piece.col || prev.row !== piece.row)
      ? (prev.col - piece.col) * tileSize
      : 0;
  const dy =
    prev && (prev.col !== piece.col || prev.row !== piece.row)
      ? (piece.row - prev.row) * tileSize
      : 0;

  const anim = useRef(new Animated.ValueXY({ x: dx, y: dy })).current;

  // Update tracker on every render so the next mount knows the latest.
  useEffect(() => {
    lastPositions.set(piece.id, { row: piece.row, col: piece.col });
  });

  // Run the glide once on mount if we had a non-zero starting offset.
  // Use setTimeout for the delay (not Animated's `delay` option) so the
  // native driver can't preempt the offset during the delay window.
  useEffect(() => {
    if (dx === 0 && dy === 0) return;

    const startAnim = () => {
      Animated.timing(anim, {
        toValue: { x: 0, y: 0 },
        duration: DURATION_MS,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    };

    if (startDelay > 0) {
      const id = setTimeout(startAnim, startDelay);
      return () => clearTimeout(id);
    }
    startAnim();
    // run-once on mount; deps intentionally empty
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const opacity = piece.stunned ? 0.4 : piece.isStone ? 0.6 : 1;

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: tileSize,
        height: tileSize,
        left: piece.col * tileSize,
        top: (7 - piece.row) * tileSize,
        opacity,
        transform: [{ translateX: anim.x }, { translateY: anim.y }],
      }}
    >
      <Image
        source={getSprite(piece.color, piece.type)!}
        style={{ width: tileSize, height: tileSize }}
      />
    </Animated.View>
  );
}
