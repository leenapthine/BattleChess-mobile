import { View, Image, Text, StyleSheet } from 'react-native';
import type { Piece } from '@/types/game';
import { getSprite } from '@/constants/sprites';
import { pieceDescriptions } from '@/data/pieceDescriptions';
import { COLORS, FONT } from '@/constants/theme';

type Props = {
  piece: Piece;
};

function formatName(type: string): string {
  return type.replace(/([A-Z])/g, ' $1').trim();
}

export function SpriteInfoCard({ piece }: Props) {
  const description = pieceDescriptions[piece.type];

  return (
    <View style={styles.card}>
      <Image
        source={getSprite(piece.color, piece.type)!}
        style={styles.sprite}
      />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{formatName(piece.type)}</Text>
        <Text style={styles.description} numberOfLines={3}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
    marginHorizontal: 8,
    marginVertical: 4,
    alignItems: 'center',
  },
  sprite: {
    width: 48,
    height: 48,
    backgroundColor: '#2d8c2d',
    borderRadius: 4,
  },
  textContainer: {
    flex: 1,
    marginLeft: 8,
  },
  name: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 14,
    marginBottom: 4,
  },
  description: {
    color: '#ffffff',
    fontFamily: FONT.mono,
    fontSize: 11,
    lineHeight: 16,
  },
});
