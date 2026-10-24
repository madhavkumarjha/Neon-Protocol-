import { AIGeneratedWeapon } from '../systems/ContentValidator';

export interface WaveMutator {
  id: string;
  title: string;
  description: string;
  enemySpeedMultiplier: number;
  enemyHealthMultiplier: number;
  playerDamageMultiplier: number;
  generatedBy: 'ai';
}

export interface NemesisBossMutator {
  id: string;
  bossTitle: string;
  lore: string;
  counterStrategy: string;
  bossHealthMultiplier: number;
  bossSpeedMultiplier: number;
  laserCooldownSeconds: number;
  generatedBy: 'ai';
}

export const FALLBACK_AI_WEAPONS: AIGeneratedWeapon[] = [
  {
    id: 'ai_void_lance',
    displayName: 'Void Lance',
    lore: 'Experimental rail-beam harvested from decommissioned orbital defense platforms.',
    weaponType: 'rifle',
    baseDamage: 55,
    fireRate: 2.2,
    projectileSpeed: 1300,
    projectileColor: '#00F0FF',
    range: 850,
    pierce: 3,
    generatedBy: 'ai',
    provenance: {
      model: 'fallback-pool-v2',
      promptVersion: '1.0',
      generatedAt: '2026-10-24T00:00:00.000Z'
    }
  },
  {
    id: 'ai_chrono_repeater',
    displayName: 'Chrono Repeater',
    lore: 'Rapid-cycling quantum accelerator with micro-tachyon acceleration coils.',
    weaponType: 'pistol',
    baseDamage: 26,
    fireRate: 4.8,
    projectileSpeed: 1050,
    projectileColor: '#39FF14',
    range: 620,
    generatedBy: 'ai',
    provenance: {
      model: 'fallback-pool-v2',
      promptVersion: '1.0',
      generatedAt: '2026-10-24T00:00:00.000Z'
    }
  },
  {
    id: 'ai_singularity_blaster',
    displayName: 'Singularity Blaster',
    lore: 'Compresses unstable dark energy nodes into localized explosive shockwaves.',
    weaponType: 'grenade',
    baseDamage: 95,
    fireRate: 0.9,
    projectileSpeed: 420,
    projectileColor: '#FFD700',
    range: 520,
    aoeRadius: 140,
    selfDamagePercent: 0.15,
    generatedBy: 'ai',
    provenance: {
      model: 'fallback-pool-v2',
      promptVersion: '1.0',
      generatedAt: '2026-10-24T00:00:00.000Z'
    }
  },
  {
    id: 'ai_cyber_katana',
    displayName: 'Phase Katana',
    lore: 'Sub-atomic mono-molecular blade tuned to disintegrate rogue mech armor.',
    weaponType: 'blade',
    baseDamage: 125,
    fireRate: 2.0,
    projectileSpeed: 0,
    projectileColor: '#00F0FF',
    range: 130,
    generatedBy: 'ai',
    provenance: {
      model: 'fallback-pool-v2',
      promptVersion: '1.0',
      generatedAt: '2026-10-24T00:00:00.000Z'
    }
  },
  {
    id: 'ai_neon_flak',
    displayName: 'Neon Flak Cannon',
    lore: 'Discharges an erratic cone of superheated tungsten flechettes.',
    weaponType: 'shotgun',
    baseDamage: 15,
    fireRate: 1.5,
    projectileSpeed: 820,
    projectileColor: '#FF007F',
    range: 380,
    pellets: 6,
    spread: 32,
    generatedBy: 'ai',
    provenance: {
      model: 'fallback-pool-v2',
      promptVersion: '1.0',
      generatedAt: '2026-10-24T00:00:00.000Z'
    }
  }
];

export const FALLBACK_WAVE_MUTATORS: WaveMutator[] = [
  {
    id: 'mut_solar_flare',
    title: 'Solar Flare',
    description: 'Coronal burst supercharges enemy servos: Enemy Speed +20%.',
    enemySpeedMultiplier: 1.2,
    enemyHealthMultiplier: 1.0,
    playerDamageMultiplier: 1.0,
    generatedBy: 'ai'
  },
  {
    id: 'mut_grid_overload',
    title: 'Grid Overload',
    description: 'Excess reactor power leaks into weapon conduits: Player & Enemy Damage +25%.',
    enemySpeedMultiplier: 1.0,
    enemyHealthMultiplier: 1.0,
    playerDamageMultiplier: 1.25,
    generatedBy: 'ai'
  },
  {
    id: 'mut_nanite_swarm',
    title: 'Nanite Infestation',
    description: 'Self-repairing nanobots harden enemy hulls: Enemy Health +30%, Enemy Speed -10%.',
    enemySpeedMultiplier: 0.9,
    enemyHealthMultiplier: 1.3,
    playerDamageMultiplier: 1.0,
    generatedBy: 'ai'
  }
];

export const FALLBACK_NEMESIS_MUTATORS: NemesisBossMutator[] = [
  {
    id: 'nem_iron_aegis',
    bossTitle: 'Cyber Overlord [Aegis Protocol]',
    lore: 'Reinforced ceramic composite plating designed to endure sustained player firepower.',
    counterStrategy: 'Heavy armor adaptation: higher durability with measured laser sweep intervals.',
    bossHealthMultiplier: 1.4,
    bossSpeedMultiplier: 0.95,
    laserCooldownSeconds: 3.5,
    generatedBy: 'ai'
  },
  {
    id: 'nem_void_accelerator',
    bossTitle: 'Cyber Overlord [Overclocked Core]',
    lore: 'Overcharged coolant pumps sacrifice structural integrity for blistering laser cadence.',
    counterStrategy: 'Rapid attack cadence: faster laser sweeps requiring rapid dash timing.',
    bossHealthMultiplier: 1.1,
    bossSpeedMultiplier: 1.2,
    laserCooldownSeconds: 2.5,
    generatedBy: 'ai'
  }
];
