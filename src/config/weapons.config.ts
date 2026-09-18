export interface WeaponConfig {
  id: string;
  name: string;
  type: 'pistol' | 'shotgun' | 'rifle' | 'grenade' | 'blade';
  damage: number;
  fireRate: number; // rounds per second
  range: number;
  speed: number; // projectile velocity
  color: number; // Hex number for Phaser tint
  spread?: number; // Spread angle in degrees
  pellets?: number; // Number of pellets for shotgun
  pierce?: number; // Number of enemies projectile pierces
  aoeRadius?: number; // AoE blast radius for grenades
  selfDamagePercent?: number; // Self damage percentage (capped at 15%)
  description: string;
}

export const WEAPON_CONFIGS: Record<string, WeaponConfig> = {
  plasma_pistol: {
    id: 'plasma_pistol',
    name: 'Plasma Pistol',
    type: 'pistol',
    damage: 20,
    fireRate: 3.5,
    range: 600,
    speed: 950,
    color: 0x00f0ff, // Neon Cyan
    description: 'Standard energy sidearm. High precision with slight knockback.'
  },
  arc_shotgun: {
    id: 'arc_shotgun',
    name: 'Arc Shotgun',
    type: 'shotgun',
    damage: 12,
    fireRate: 1.2,
    range: 350,
    speed: 800,
    spread: 30,
    pellets: 5,
    color: 0x39ff14, // Neon Green
    description: 'Close-range scattergun firing 5 plasma pellets in a wide arc.'
  },
  laser_rifle: {
    id: 'laser_rifle',
    name: 'Laser Rifle',
    type: 'rifle',
    damage: 45,
    fireRate: 2.0,
    range: 900,
    speed: 1400,
    pierce: 3,
    color: 0xff007f, // Neon Magenta
    description: 'High-velocity focused beam piercing through up to 3 targets.'
  },
  emp_grenade: {
    id: 'emp_grenade',
    name: 'EMP Grenade',
    type: 'grenade',
    damage: 80,
    fireRate: 0.8,
    range: 500,
    speed: 400,
    aoeRadius: 120,
    selfDamagePercent: 0.15,
    color: 0xffd700, // Neon Gold
    description: 'Deals AoE shockwave damage. Self-damage capped at 15%.'
  },
  pulse_blade: {
    id: 'pulse_blade',
    name: 'Pulse Blade',
    type: 'blade',
    damage: 110,
    fireRate: 1.8,
    range: 120,
    speed: 0,
    color: 0x00f0ff,
    description: 'High-frequency cyber blade cleaving enemies and clearing incoming fire.'
  }
};
