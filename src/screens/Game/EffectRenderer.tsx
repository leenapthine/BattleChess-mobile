import type { Effect } from '@/types/game';
import { BoulderThrow } from './effects/BoulderThrow';
import { PixelExplosion } from './effects/PixelExplosion';
import { LaunchProjectile } from './effects/LaunchProjectile';
import { StunPulse } from './effects/StunPulse';
import { StonePulse } from './effects/StonePulse';
import { LightningBolt } from './effects/LightningBolt';
import { FireBurst } from './effects/FireBurst';
import { EyeBeam } from './effects/EyeBeam';
import { PixelBurst } from './effects/PixelBurst';

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
        <EyeBeam
          fromRow={effect.from.row}
          fromCol={effect.from.col}
          toRow={effect.to.row}
          toCol={effect.to.col}
          tileSize={tileSize}
          onDone={onDone}
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

    case 'transform':
      return (
        <PixelBurst row={effect.at.row} col={effect.at.col} tileSize={tileSize} onDone={onDone}
          colors={['#e8431f', '#f5821f', '#f6a623', '#ffd24d']} mode="out" />
      );

    case 'convert':
      return (
        <PixelBurst row={effect.at.row} col={effect.at.col} tileSize={tileSize} onDone={onDone}
          colors={['#e8431f', '#b3199e', '#7a1f6b', '#f59120']} mode="out" />
      );

    case 'howlerAbsorb':
      return (
        <PixelBurst row={effect.at.row} col={effect.at.col} tileSize={tileSize} onDone={onDone}
          colors={['#b04bff', '#7a1fb0', '#e0b0ff']} mode="in" />
      );

    case 'raise':
      return (
        <PixelBurst row={effect.at.row} col={effect.at.col} tileSize={tileSize} onDone={onDone}
          colors={['#9bff5c', '#3fae2a', '#e8f5d0']} mode="up" />
      );

    case 'revive':
      return (
        <PixelBurst row={effect.at.row} col={effect.at.col} tileSize={tileSize} onDone={onDone}
          colors={['#b6ff7a', '#e8f5d0', '#3fae2a', '#ffffff']} mode="up" />
      );

    case 'dominate':
      return (
        <PixelBurst row={effect.to.row} col={effect.to.col} tileSize={tileSize} onDone={onDone}
          colors={['#c06bff', '#8a3fd0', '#f0d0ff']} mode="out" />
      );

    case 'swap':
      return (
        <>
          <PixelBurst row={effect.from.row} col={effect.from.col} tileSize={tileSize} onDone={onDone}
            colors={['#66ffff', '#b0ffff', '#ffffff']} mode="out" />
          <PixelBurst row={effect.to.row} col={effect.to.col} tileSize={tileSize}
            colors={['#66ffff', '#b0ffff', '#ffffff']} mode="out" />
        </>
      );

    case 'portalOut':
      return (
        <>
          <PixelBurst row={effect.from.row} col={effect.from.col} tileSize={tileSize} onDone={onDone}
            colors={['#3fa0ff', '#66ffff', '#b0e0ff']} mode="out" />
          <PixelBurst row={effect.to.row} col={effect.to.col} tileSize={tileSize}
            colors={['#3fa0ff', '#66ffff', '#b0e0ff']} mode="out" />
        </>
      );

    // Fire-and-forget so queue doesn't stall if any effect is unhandled.
    default: {
      queueMicrotask(onDone);
      return null;
    }
  }
}
