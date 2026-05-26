import { View, Image, StyleSheet } from 'react-native';
import type { Piece, Color } from '@/types/game';
import { getSprite } from '@/constants/sprites';

type Props = {
  pieces: Piece[];
  color: Color;
  spriteSize: number;
};

export function CapturedPieces({ pieces, color, spriteSize }: Props) {
  const captured = pieces.filter(p => p.color === color);
  if (captured.length === 0) return null;

  return (
    <View style={styles.row}>
      {captured.map((p, i) => (
        <Image
          key={`${p.id}-${i}`}
          source={getSprite(p.color, p.type)!}
          style={{ width: spriteSize, height: spriteSize }}
          resizeMode="contain"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 28,
  },
});
