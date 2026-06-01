import { useEffect, useMemo, useRef, useState } from 'react';
import { View, Pressable, Text, StyleSheet, useWindowDimensions } from 'react-native';
import type { Piece, Square, Highlight, GameStatus } from '@/types/game';
import { BOARD, HIGHLIGHT, COLORS, FONT } from '@/constants/theme';
import { AnimatedPiece } from './AnimatedPiece';
import { DyingPiece } from './DyingPiece';

type DyingEntry = {
  piece: Piece;
  dyingId: string;
};

type Props = {
  pieces: Piece[];
  selectedSquare: Square | null;
  selectedCanActivate: boolean;
  highlights: Highlight[];
  status: GameStatus;
  onSquarePress: (square: Square) => void;
  onNewGame?: () => void;
  onMainMenu?: () => void;
};

export function GameView({ pieces, selectedSquare, selectedCanActivate, highlights, status, onSquarePress, onNewGame, onMainMenu }: Props) {
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 16, 400);
  const tileSize = boardSize / 8;

  // Detect captures by ID-diffing prev vs current. Same-ID transitions
  // (HellKing convert, HellPawn transform, etc.) don't trigger.
  // Computed in render so the capturing piece's AnimatedPiece can read
  // the captured-square set on mount and delay its glide.
  const prevPiecesRef = useRef<Piece[]>(pieces);
  const captureDiff = useMemo(() => {
    const currentIds = new Set(pieces.map((p) => p.id));
    return prevPiecesRef.current.filter((p) => !currentIds.has(p.id));
  }, [pieces]);

  const captureSquares = useMemo(
    () => new Set(captureDiff.map((p) => `${p.row},${p.col}`)),
    [captureDiff],
  );

  // Option C: capturing piece waits until the dying piece is ~half through
  // its 280ms fade before starting its own 180ms slide.
  const CAPTURE_SLIDE_DELAY_MS = 140;

  const [dying, setDying] = useState<DyingEntry[]>([]);
  useEffect(() => {
    if (captureDiff.length > 0) {
      const ts = Date.now();
      setDying((curr) => [
        ...curr,
        ...captureDiff.map((p, i) => ({ piece: p, dyingId: `${p.id}-${ts}-${i}` })),
      ]);
    }
    prevPiecesRef.current = pieces;
  }, [pieces, captureDiff]);

  const removeDying = (dyingId: string) => {
    setDying((curr) => curr.filter((d) => d.dyingId !== dyingId));
  };

  return (
    <View style={[styles.board, { width: boardSize, height: boardSize }]}>
      {Array.from({ length: 8 }, (_, i) => {
        const row = 7 - i;
        return (
        <View key={row} style={styles.row}>
          {Array.from({ length: 8 }, (_, col) => {
            const square: Square = { row, col };
            const piece = pieces.find(p => p.row === row && p.col === col);
            const highlight = highlights.find(h => h.row === row && h.col === col);
            const isSelected =
              selectedSquare?.row === row && selectedSquare?.col === col;
            const isDark = (row + col) % 2 === 1;

            return (
              <Pressable
                key={col}
                onPress={() => onSquarePress(square)}
                style={[
                  styles.square,
                  {
                    width: tileSize,
                    height: tileSize,
                    backgroundColor: isDark ? BOARD.dark : BOARD.light,
                  },
                ]}
              >
                {isSelected && (
                  <View
                    style={[
                      styles.highlightBorder,
                      { borderColor: selectedCanActivate ? HIGHLIGHT.ability : BOARD.selected },
                    ]}
                  />
                )}
                {highlight && !isSelected && highlight.color !== 'range' && (
                  <View
                    style={[
                      styles.highlightBorder,
                      { borderColor: HIGHLIGHT[highlight.color] },
                    ]}
                  />
                )}
                {highlight && highlight.color === 'range' && (
                  <View
                    style={[
                      styles.highlightBorder,
                      { borderColor: HIGHLIGHT.range },
                    ]}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
        );
      })}
      {/* Pieces float in their own absolutely-positioned layer on top of
          the board so a sliding piece never hits per-square clipping.
          Key includes row+col so a move forces a fresh mount and the
          FLIP offset takes effect. */}
      {pieces.map((p) => (
        <AnimatedPiece
          key={`${p.id}-${p.row}-${p.col}`}
          piece={p}
          tileSize={tileSize}
          startDelay={
            captureSquares.has(`${p.row},${p.col}`) ? CAPTURE_SLIDE_DELAY_MS : 0
          }
        />
      ))}
      {dying.map((d) => (
        <DyingPiece
          key={d.dyingId}
          piece={d.piece}
          tileSize={tileSize}
          onDone={() => removeDying(d.dyingId)}
        />
      ))}
      {status.type === 'won' && (
        <View style={styles.overlay}>
          {status.reason && (
            <Text style={styles.reasonText}>
              {status.reason === 'timeout' ? 'TIMEOUT' :
               status.reason === 'resign' ? 'OPPONENT CONCEDED' :
               null}
            </Text>
          )}
          <Text style={styles.winText}>{status.winner} wins!</Text>
          {onNewGame && (
            <Pressable style={styles.newGameBtn} onPress={onNewGame}>
              <Text style={styles.newGameText}>New Game</Text>
            </Pressable>
          )}
          {onMainMenu && (
            <Pressable style={styles.menuBtn} onPress={onMainMenu}>
              <Text style={styles.menuText}>Main Menu</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    alignSelf: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  square: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  highlightBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 4,
    zIndex: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonText: {
    color: '#ff3333',
    fontSize: 14,
    fontFamily: FONT.monoBold,
    letterSpacing: 2,
    marginBottom: 8,
  },
  winText: {
    color: COLORS.text,
    fontSize: 28,
    fontFamily: FONT.monoBold,
    marginBottom: 20,
  },
  newGameBtn: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 4,
  },
  newGameText: {
    color: '#000000',
    fontSize: 16,
    fontFamily: FONT.monoBold,
  },
  menuBtn: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 4,
    marginTop: 10,
  },
  menuText: {
    color: COLORS.text,
    fontSize: 14,
    fontFamily: FONT.monoBold,
  },
});
