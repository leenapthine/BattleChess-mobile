import type { Effect } from '@/types/game';
import { Beam } from './effects/Beam';
import { BoulderThrow } from './effects/BoulderThrow';
import { PixelExplosion } from './effects/PixelExplosion';
import { LaunchProjectile } from './effects/LaunchProjectile';
import { StunPulse } from './effects/StunPulse';
import { StonePulse } from './effects/StonePulse';
import { LightningBolt } from './effects/LightningBolt';
import { FireBurst } from './effects/FireBurst';

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
        <PixelExplosion
          row={effect.from.row}
          col={effect.from.col}
          tileSize={tileSize}
          onDone={onDone}
        />
      );

    case 'launch':
      return (
        <LaunchProjectile
          fromRow={effect.from.row}
          fromCol={effect.from.col}
          toRow={effect.to.row}
          toCol={effect.to.col}
          tileSize={tileSize}
          spriteColor={effect.spriteColor}
          spriteType={effect.spriteType}
          onDone={onDone}
        />
      );

    case 'boulder':
      return (
        <BoulderThrow
          fromRow={effect.from.row}
          fromCol={effect.from.col}
          toRow={effect.to.row}
          toCol={effect.to.col}
          tileSize={tileSize}
          onDone={onDone}
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
    case 'towerShot':
      return (
        <LightningBolt
          fromRow={effect.from.row}
          fromCol={effect.from.col}
          toRow={effect.to.row}
          toCol={effect.to.col}
          tileSize={tileSize}
          onDone={onDone}
        />
      );

    case 'zap':
      return (
        <FireBurst
          row={effect.to.row}
          col={effect.to.col}
          tileSize={tileSize}
          onDone={onDone}
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
