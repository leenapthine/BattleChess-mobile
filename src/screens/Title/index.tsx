import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useMemo, useEffect, useState } from 'react';
import type { Color, PieceType } from '@/types/game';
import { getSprite } from '@/constants/sprites';
import { pieceDetails } from '@/data/pieceDetails';
import { COLORS, FONT } from '@/constants/theme';

const ALL_PIECES: PieceType[] = [
  'Pawn', 'Knight', 'Bishop', 'Rook', 'Queen', 'King',
  'NecroPawn', 'GhostKnight', 'Necromancer', 'DeadLauncher', 'GhoulKing', 'QueenOfBones',
  'HellPawn', 'Prowler', 'Howler', 'Beholder', 'HellKing', 'QueenOfDestruction',
  'PawnHopper', 'BeastKnight', 'BeastDruid', 'BoulderThrower', 'FrogKing', 'QueenOfDomination',
  'YoungWiz', 'Familiar', 'WizardTower', 'Portal', 'WizardKing', 'QueenOfIllusions',
];

function formatName(type: string): string {
  return type.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
}

type Props = {
  ready: boolean;
  onEnter: () => void;
};

export function TitleScreen({ ready, onEnter }: Props) {
  const featured = useMemo(() => {
    const type = ALL_PIECES[Math.floor(Math.random() * ALL_PIECES.length)];
    const color: Color = Math.random() < 0.5 ? 'White' : 'Black';
    return { type, color };
  }, []);

  // Animated dots for "loading"
  const [dots, setDots] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d + 1) % 4), 400);
    return () => clearInterval(id);
  }, []);

  // Blinking cursor on the ENTER prompt
  const [blink, setBlink] = useState(true);
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(id);
  }, [ready]);

  const sprite = getSprite(featured.color, featured.type);
  const bullets = pieceDetails[featured.type] ?? [];

  return (
    <View style={styles.container}>
      {/* Top status bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>KAMI LABS STUDIOS</Text>
        <Text style={styles.statusText}>V0.7</Text>
      </View>
      <View style={styles.divider} />
      <Text style={styles.bootLine}>&gt; LOAD "BATTLECHESS",8,1</Text>
      <Text style={styles.bootLine}>&gt; RUN</Text>

      {/* Middle — sprite + title */}
      <View style={styles.middle}>
        {sprite && <Image source={sprite} style={styles.sprite} />}
        <Text style={styles.title}>BATTLECHESS</Text>
        <Text style={styles.tagline}>// a fantasy chess variant</Text>

        <View style={styles.unitBox}>
          <Text style={styles.unitLabel}>▸ FEATURED UNIT</Text>
          <Text style={styles.unitName}>{formatName(featured.type)}</Text>
          {bullets.map((line, i) => (
            <Text key={i} style={styles.unitBullet}>
              <Text style={styles.bulletDot}>• </Text>
              {line}
            </Text>
          ))}
        </View>
      </View>

      {/* Bottom — prompt + copyright */}
      <View style={styles.bottom}>
        {ready ? (
          <Pressable style={styles.enterBtn} onPress={onEnter}>
            <Text style={styles.enterText}>
              [ PRESS ENTER {blink ? '_' : ' '}]
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.loading}>
            LOADING{'.'.repeat(dots)}
          </Text>
        )}
        <View style={styles.divider} />
        <Text style={styles.copyright}>© 2026 KAMI LABS · ALL RIGHTS RESERVED</Text>
      </View>
    </View>
  );
}

const DIVIDER_CHAR = '═';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingTop: 56, // clear iPhone status bar (clock / wifi / battery)
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  statusText: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 11,
    letterSpacing: 1,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginVertical: 4,
  },
  bootLine: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 11,
    paddingHorizontal: 4,
  },
  middle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sprite: {
    width: 180,
    height: 180,
    backgroundColor: '#2d8c2d',
    borderRadius: 4,
    marginBottom: 16,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 44,
    letterSpacing: 3,
    textShadowColor: '#00ff00',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    marginTop: 4,
  },
  tagline: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 18,
  },
  unitBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 260,
    maxWidth: 340,
  },
  unitLabel: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 4,
  },
  unitName: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 16,
    letterSpacing: 2,
    marginBottom: 6,
  },
  unitBullet: {
    color: '#ffffff',
    fontFamily: FONT.mono,
    fontSize: 11,
    lineHeight: 16,
    alignSelf: 'stretch',
    marginTop: 2,
  },
  bulletDot: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
  },
  bottom: {
    paddingBottom: 12,
    alignItems: 'center',
  },
  loading: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 14,
    letterSpacing: 2,
    paddingVertical: 12,
  },
  enterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  enterText: {
    color: COLORS.text,
    fontFamily: FONT.monoBold,
    fontSize: 18,
    letterSpacing: 2,
  },
  copyright: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 4,
  },
});
