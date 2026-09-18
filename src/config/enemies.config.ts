export interface EnemyConfig {
  id: string;
  name: string;
  health: number;
  speed: number;
  damage: number;
  xpReward: number;
  color: number;
  size: number;
  isBoss?: boolean;
  description: string;
}

export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
  scout_drone: {
    id: 'scout_drone',
    name: 'Scout Drone',
    health: 25,
    speed: 280,
    damage: 10,
    xpReward: 15,
    color: 0x00f0ff,
    size: 16,
    description: 'Fast, fragile swarm drone.'
  },
  enforcer_mech: {
    id: 'enforcer_mech',
    name: 'Enforcer Mech',
    health: 140,
    speed: 120,
    damage: 25,
    xpReward: 60,
    color: 0xff007f,
    size: 32,
    description: 'Armored heavy walker.'
  },
  hacker_sentinel: {
    id: 'hacker_sentinel',
    name: 'Hacker Sentinel',
    health: 60,
    speed: 180,
    damage: 15,
    xpReward: 35,
    color: 0x39ff14,
    size: 22,
    description: 'Disruptor drone casting slow aura.'
  },
  hunter_drone: {
    id: 'hunter_drone',
    name: 'Hunter Drone',
    health: 50,
    speed: 320,
    damage: 40,
    xpReward: 45,
    color: 0xffd700,
    size: 20,
    description: 'High-speed assassin drone.'
  },
  cyber_overlord: {
    id: 'cyber_overlord',
    name: 'Cyber Overlord',
    health: 2000,
    speed: 90,
    damage: 50,
    xpReward: 500,
    color: 0xff007f,
    size: 64,
    isBoss: true,
    description: 'V1 Boss archetype featuring laser sweeps and missile barrages.'
  }
};
