import type { Effect } from '@/types/game';
import { Shockwave } from './effects/Shockwave';
import { Projectile } from './effects/Projectile';
import { Beam } from './effects/Beam';
import { StunPulse } from './effects/StunPulse';
import { StonePulse } from './effects/StonePulse';

type Props = {
  effect: Effect;
  tileSize: number;
  onDone: () => void;
};

/**
 * Routes a typed Effect to the matching Reanimated primitive. Each primitive
 * calls onDone when its animation completes; the parent uses that to clear
 * the effect from its render queue.
 *
 * Effects not handled here (yet) fall through to a no-op that fires onDone
 * on the next tick so the queue doesn't stall.
 */
export function EffectRenderer({ effect, tileSize, onDone }: Props) {
  switch (effect.type) {
    case 'detonate':
      return (
        <Shockwave
          row={effect.from.row}
          col={effect.from.col}
          tileSize={tileSize}
          onDone={onDone}
        />
      );

    case 'boulder':
      return (
        <Projectile
          fromRow={effect.from.row}
          fromCol={effect.from.col}
          toRow={effect.to.row}
          toCol={effect.to.col}
          tileSize={tileSize}
          onDone={onDone}
          color="#8b6f47"
        />
      );

    case 'beam':
      return (
        <Beam
          fromRow={effect.from.row}
          fromCol={effect.from.col}
          toRow={effect.to.row}
          toCol={effect.to.col}
          tileSize={tileSize}
          onDone={onDone}
          color="#ff66ff"
        />
      );

    case 'kingShot':
      return (
        <Beam
          fromRow={effect.from.row}
          fromCol={effect.from.col}
          toRow={effect.to.row}
          toCol={effect.to.col}
          tileSize={tileSize}
          onDone={onDone}
          color="#66ccff"
          thickness={8}
          extendMs={140}
          holdMs={120}
        />
      );

    case 'towerShot':
      return (
        <Beam
          fromRow={effect.from.row}
          fromCol={effect.from.col}
          toRow={effect.to.row}
          toCol={effect.to.col}
          tileSize={tileSize}
          onDone={onDone}
          color="#39ff14"
          thickness={3}
          extendMs={70}
          holdMs={80}
          fadeMs={130}
        />
      );

    case 'zap':
      return (
        <Beam
          fromRow={effect.from.row}
          fromCol={effect.from.col}
          toRow={effect.to.row}
          toCol={effect.to.col}
          tileSize={tileSize}
          onDone={onDone}
          color="#66ffff"
          thickness={5}
          extendMs={60}
          holdMs={90}
          fadeMs={130}
        />
      );

    case 'stun': {
      if (effect.affected.length === 0) {
        queueMicrotask(onDone);
        return null;
      }
      // One pulse per stunned square; the first drives queue cleanup.
      return (
        <>
          {effect.affected.map((sq, i) => (
            <StunPulse
              key={`${sq.row},${sq.col}`}
              row={sq.row}
              col={sq.col}
              tileSize={tileSize}
              onDone={i === 0 ? onDone : undefined}
            />
          ))}
        </>
      );
    }

    case 'stone':
      return (
        <StonePulse
          row={effect.at.row}
          col={effect.at.col}
          tileSize={tileSize}
          on={effect.on}
          onDone={onDone}
        />
      );

    // Not yet implemented — fire-and-forget so queue doesn't stall.
    default: {
      queueMicrotask(onDone);
      return null;
    }
  }
}
