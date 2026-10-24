export interface ArenaTheme {
  id: 'galaxy' | 'grassland' | 'underwater' | 'underground';
  name: string;
  icon: string;
  tagline: string;
  backgroundColor: number;
  groundAccentColor: number;
  borderColor: number;
  particleColor: number;
  particleType: 'stars' | 'spores' | 'bubbles' | 'embers';
  particleSpeed: number;
  ambientAlpha: number;
}

export const THEME_CONFIGS: Record<ArenaTheme['id'], ArenaTheme> = {
  galaxy: {
    id: 'galaxy',
    name: 'Galaxy',
    icon: '🌌',
    tagline: 'Deep Space Cosmic Void',
    backgroundColor: 0x050713,
    groundAccentColor: 0x0c152e,
    borderColor: 0x38bdf8,
    particleColor: 0xe0f2fe,
    particleType: 'stars',
    particleSpeed: 10,
    ambientAlpha: 0.9
  },
  grassland: {
    id: 'grassland',
    name: 'Grassland',
    icon: '🌿',
    tagline: 'Bioluminescent Neon Turf',
    backgroundColor: 0x05130b,
    groundAccentColor: 0x0c2918,
    borderColor: 0x22c55e,
    particleColor: 0x86efac,
    particleType: 'spores',
    particleSpeed: 18,
    ambientAlpha: 0.8
  },
  underwater: {
    id: 'underwater',
    name: 'Underwater',
    icon: '🌊',
    tagline: 'Abyssal Oceanic Trench',
    backgroundColor: 0x03121d,
    groundAccentColor: 0x08253a,
    borderColor: 0x06b6d4,
    particleColor: 0x67e8f9,
    particleType: 'bubbles',
    particleSpeed: 24,
    ambientAlpha: 0.85
  },
  underground: {
    id: 'underground',
    name: 'Underground',
    icon: '🌋',
    tagline: 'Molten Core Volcanic Cavern',
    backgroundColor: 0x130709,
    groundAccentColor: 0x2b0d12,
    borderColor: 0xf97316,
    particleColor: 0xfca5a5,
    particleType: 'embers',
    particleSpeed: 30,
    ambientAlpha: 0.85
  }
};

export const DEFAULT_THEME_ID: ArenaTheme['id'] = 'galaxy';
