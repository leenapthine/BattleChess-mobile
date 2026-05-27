import { View, Pressable, Image, Text, StyleSheet, useWindowDimensions } from 'react-native';
import type { Piece, Square, Highlight, GameStatus } from '@/types/game';
import { BOARD, HIGHLIGHT, COLORS } from '@/constants/theme';
import { getSprite } from '@/constants/sprites';

type Props = {
  pieces: Piece[];
  selectedSquare: Square | null;
  highlights: Highlight[];
  status: GameStatus;
  onSquarePress: (square: Square) => void;
  onNewGame: () => void;
};

export function GameView({ pieces, selectedSquare, highlights, status, onSquarePress, onNewGame }: Props) {
  const { width } = useWindowDimensions();
  const boardSize = Math.min(width - 16, 400);
  const tileSize = boardSize / 8;

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
                    backgroundColor: isSelected
                      ? BOARD.selected
                      : isDark
                        ? BOARD.dark
                        : BOARD.light,
                  },
                ]}
              >
                {highlight && (
                  <View
                    style={[
                      styles.highlightBorder,
                      { borderColor: HIGHLIGHT[highlight.color] },
                    ]}
                  />
                )}
                {piece && (
                  <Image
                    source={getSprite(piece.color, piece.type)!}
                    style={{
                      width: tileSize,
                      height: tileSize,
                      opacity: piece.stunned ? 0.4 : piece.isStone ? 0.6 : 1,
                    }}
                    resizeMode="contain"
                  />
                )}
              </Pressable>
            );
          })}
        </View>
        );
      })}
      {status.type === 'won' && (
        <View style={styles.overlay}>
          <Text style={styles.winText}>{status.winner} wins!</Text>
          <Pressable style={styles.newGameBtn} onPress={onNewGame}>
            <Text style={styles.newGameText}>New Game</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  row: {
    flexDirection: 'row',
  },
  square: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  highlightBorder: {
    ...StyleSheet.absoluteFill,
    borderWidth: 4,
    zIndex: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  winText: {
    color: COLORS.text,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  newGameBtn: {
    backgroundColor: '#4a90d9',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 8,
  },
  newGameText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
