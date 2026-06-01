import { View, Text, Pressable, Image, ScrollView, StyleSheet } from 'react-native';
import type { Guild } from '@/types/army';
import type { PieceType, Color } from '@/types/game';
import { getSprite } from '@/constants/sprites';
import { COLORS, FONT } from '@/constants/theme';
import { GUILDS } from '@/data/upgradeCosts';

type SlotProps = {
  index: number;
  pieceType: PieceType;
  upgraded: boolean;
  cost: number;
  canAfford: boolean;
  color: Color;
  selected: boolean;
  onToggle: () => void;
  onSelect: () => void;
};

function PieceSlot({ pieceType, upgraded, cost, canAfford, color, selected, onToggle, onSelect }: SlotProps) {
  return (
    <Pressable
      style={[styles.slot, selected && styles.slotSelected]}
      onPress={onSelect}
    >
      <Image
        source={getSprite(color, pieceType)!}
        style={styles.slotSprite}
      />
      <View style={styles.slotInfo}>
        <Text style={styles.slotName} numberOfLines={1}>
          {pieceType.replace(/([A-Z])/g, ' $1').trim()}
        </Text>
        <Text style={styles.slotCost}>{cost}pt</Text>
      </View>
      <Pressable
        style={[
          styles.toggleBtn,
          upgraded ? styles.undoBtn : styles.upgradeBtn,
          !upgraded && !canAfford && styles.btnDisabled,
        ]}
        onPress={onToggle}
        disabled={!upgraded && !canAfford}
      >
        <Text style={styles.toggleText}>{upgraded ? '↩' : '▲'}</Text>
      </Pressable>
    </Pressable>
  );
}

type Props = {
  guild: Guild;
  playerColor: Color;
  slots: Array<{ pieceType: PieceType; upgraded: boolean; cost: number; canAfford: boolean }>;
  selectedSlot: number | null;
  onChangeGuild: (g: Guild) => void;
  onToggleSlot: (i: number) => void;
  onSelectSlot: (i: number) => void;
  onUpgradeAll: () => void;
  onClearAll: () => void;
  onConfirm: () => void;
};

export function ArmyBuilderView({
  guild, playerColor, slots, selectedSlot,
  onChangeGuild, onToggleSlot, onSelectSlot,
  onUpgradeAll, onClearAll, onConfirm,
}: Props) {
  return (
    <View style={styles.root}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.guildRow}>
        {GUILDS.map(g => (
          <Pressable
            key={g}
            style={[styles.guildBtn, g === guild && styles.guildActive]}
            onPress={() => onChangeGuild(g)}
          >
            <Text style={[styles.guildText, g === guild && styles.guildTextActive]}>
              {g.toUpperCase()}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.columnsRow}>
        <View style={styles.column}>
          <Text style={styles.sectionLabel}>BACK ROW</Text>
          {slots.slice(0, 8).map((s, i) => (
            <PieceSlot
              key={i}
              index={i}
              pieceType={s.pieceType}
              upgraded={s.upgraded}
              cost={s.cost}
              canAfford={s.canAfford}
              color={playerColor}
              selected={selectedSlot === i}
              onToggle={() => onToggleSlot(i)}
              onSelect={() => onSelectSlot(i)}
            />
          ))}
        </View>
        <View style={styles.column}>
          <Text style={styles.sectionLabel}>PAWNS</Text>
          {slots.slice(8).map((s, i) => (
            <PieceSlot
              key={i + 8}
              index={i + 8}
              pieceType={s.pieceType}
              upgraded={s.upgraded}
              cost={s.cost}
              canAfford={s.canAfford}
              color={playerColor}
              selected={selectedSlot === i + 8}
              onToggle={() => onToggleSlot(i + 8)}
              onSelect={() => onSelectSlot(i + 8)}
            />
          ))}
        </View>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.actionBtn} onPress={onUpgradeAll}>
          <Text style={styles.actionText}>UPGRADE ALL</Text>
        </Pressable>
        <Pressable style={styles.actionBtn} onPress={onClearAll}>
          <Text style={styles.actionText}>CLEAR ALL</Text>
        </Pressable>
      </View>

    </ScrollView>
      <Pressable style={styles.confirmBtn} onPress={onConfirm}>
        <Text style={styles.confirmText}>CONFIRM ARMY</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 12, paddingBottom: 60 },
  guildRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  guildBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 3,
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    borderRadius: 4,
    alignItems: 'center',
  },
  guildActive: { borderColor: COLORS.border, backgroundColor: COLORS.headerBg },
  guildText: { color: COLORS.textMuted, fontFamily: FONT.mono, fontSize: 12 },
  guildTextActive: { color: COLORS.text },
  columnsRow: {
    flexDirection: 'row',
  },
  column: {
    flex: 1,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontFamily: FONT.mono,
    fontSize: 10,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  slot: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#0a1a0a',
  },
  slotSelected: { backgroundColor: COLORS.headerBg },
  slotSprite: { width: 40, height: 40, backgroundColor: '#2d8c2d', borderRadius: 2 },
  slotInfo: { flex: 1, marginLeft: 4 },
  slotName: { color: '#ffffff', fontFamily: FONT.mono, fontSize: 10 },
  slotCost: { color: COLORS.textMuted, fontFamily: FONT.mono, fontSize: 9 },
  toggleBtn: {
    width: 36,
    height: 36,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  upgradeBtn: { backgroundColor: COLORS.border },
  undoBtn: { backgroundColor: '#663300' },
  btnDisabled: { opacity: 0.3 },
  toggleText: { color: '#000000', fontFamily: FONT.monoBold, fontSize: 16 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    borderRadius: 4,
    alignItems: 'center',
  },
  actionText: { color: COLORS.textMuted, fontFamily: FONT.mono, fontSize: 12 },
  confirmBtn: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.border,
    paddingVertical: 10,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
    marginBottom: 10,
  },
  confirmText: { color: '#000000', fontFamily: FONT.monoBold, fontSize: 16 },
});
