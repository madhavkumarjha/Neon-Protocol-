import { WaveMutator, NemesisBossMutator } from '../config/weapons.fallback';

export interface AIGeneratedWeapon {
  id: string;
  displayName: string;
  lore: string;
  weaponType: 'pistol' | 'shotgun' | 'rifle' | 'grenade' | 'blade';
  baseDamage: number;
  fireRate: number; // rounds per second
  projectileSpeed: number; // velocity in px/s
  projectileColor: string; // hex string e.g. #00F0FF
  range?: number;
  aoeRadius?: number;
  pellets?: number;
  spread?: number;
  pierce?: number;
  selfDamagePercent?: number;
  generatedBy: 'ai';
  provenance?: {
    model: string;
    promptVersion: string;
    generatedAt: string;
  };
}

export class ContentValidator {
  private static readonly APPROVED_PALETTE = new Set([
    '#00F0FF', // Neon Cyan
    '#FF007F', // Neon Magenta
    '#FFD700', // Neon Gold
    '#39FF14', // Neon Green
    '#FFFFFF'  // Pure White
  ]);

  /**
   * Safely parses JSON string or returns null if malformed.
   */
  public static parseJson<T = unknown>(jsonStr: string): T | null {
    if (!jsonStr || typeof jsonStr !== 'string') return null;
    try {
      // Strip potential markdown code fence markers (e.g. ```json ... ```)
      const sanitized = jsonStr
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/, '')
        .trim();
      return JSON.parse(sanitized) as T;
    } catch {
      return null;
    }
  }

  /**
   * Validates and sanitizes a hex color string against the art style palette.
   */
  public static sanitizeColor(hexColor?: string): string {
    if (!hexColor || typeof hexColor !== 'string') {
      return '#00F0FF';
    }
    const cleanHex = hexColor.trim().toUpperCase();
    if (/^#[0-9A-F]{6}$/i.test(cleanHex)) {
      if (this.APPROVED_PALETTE.has(cleanHex)) {
        return cleanHex;
      }
      // If valid 6-character hex, allow or map to closest fallback
      return cleanHex;
    }
    return '#00F0FF';
  }

  /**
   * Validates and clamps an AI-generated weapon object.
   */
  public static validateWeapon(raw: unknown): AIGeneratedWeapon | null {
    if (!raw || typeof raw !== 'object') return null;
    const item = raw as Record<string, unknown>;

    const displayName = typeof item.displayName === 'string' && item.displayName.trim()
      ? item.displayName.trim().slice(0, 40)
      : 'Experimental Weapon';

    const lore = typeof item.lore === 'string' && item.lore.trim()
      ? item.lore.trim().slice(0, 160)
      : 'Prototype energy armaments forged in subterranean cyber-foundries.';

    const validTypes: Array<AIGeneratedWeapon['weaponType']> = ['pistol', 'shotgun', 'rifle', 'grenade', 'blade'];
    const weaponType = validTypes.includes(item.weaponType as AIGeneratedWeapon['weaponType'])
      ? (item.weaponType as AIGeneratedWeapon['weaponType'])
      : 'pistol';

    // Stat Clamping Bounds per API_REFERENCE & Decision #016
    const rawDamage = Number(item.baseDamage);
    const baseDamage = isNaN(rawDamage) ? 35 : Math.round(Math.min(150, Math.max(10, rawDamage)));

    const rawFireRate = Number(item.fireRate);
    const fireRate = isNaN(rawFireRate)
      ? 2.5
      : Number(Math.min(10.0, Math.max(0.5, rawFireRate)).toFixed(2));

    const rawSpeed = Number(item.projectileSpeed);
    const projectileSpeed = weaponType === 'blade'
      ? 0
      : isNaN(rawSpeed)
        ? 600
        : Math.round(Math.min(1400, Math.max(300, rawSpeed)));

    const projectileColor = this.sanitizeColor(item.projectileColor as string | undefined);

    const rawRange = Number(item.range);
    const range = weaponType === 'blade'
      ? 120
      : isNaN(rawRange)
        ? 400
        : Math.round(Math.min(550, Math.max(80, rawRange)));

    const validated: AIGeneratedWeapon = {
      id: typeof item.id === 'string' && item.id.startsWith('ai_') ? item.id : `ai_${Date.now()}`,
      displayName,
      lore,
      weaponType,
      baseDamage,
      fireRate,
      projectileSpeed,
      projectileColor,
      range,
      generatedBy: 'ai',
      provenance: {
        model: 'llama-3.3-70b-versatile',
        promptVersion: '1.0',
        generatedAt: new Date().toISOString()
      }
    };

    if (weaponType === 'grenade') {
      const rawAoe = Number(item.aoeRadius);
      validated.aoeRadius = isNaN(rawAoe) ? 120 : Math.round(Math.min(200, Math.max(60, rawAoe)));
      validated.selfDamagePercent = 0.15;
    }

    if (weaponType === 'shotgun') {
      const rawPellets = Number(item.pellets);
      validated.pellets = isNaN(rawPellets) ? 5 : Math.round(Math.min(8, Math.max(3, rawPellets)));
      const rawSpread = Number(item.spread);
      validated.spread = isNaN(rawSpread) ? 30 : Math.round(Math.min(45, Math.max(15, rawSpread)));
    }

    if (weaponType === 'rifle') {
      const rawPierce = Number(item.pierce);
      validated.pierce = isNaN(rawPierce) ? 2 : Math.round(Math.min(4, Math.max(1, rawPierce)));
    }

    return validated;
  }

  /**
   * Validates and clamps a dynamic wave mutator.
   */
  public static validateWaveMutator(raw: unknown): WaveMutator | null {
    if (!raw || typeof raw !== 'object') return null;
    const item = raw as Record<string, unknown>;

    const title = typeof item.title === 'string' && item.title.trim()
      ? item.title.trim().slice(0, 35)
      : 'System Mutator';

    const description = typeof item.description === 'string' && item.description.trim()
      ? item.description.trim().slice(0, 120)
      : 'Arena radiation shifts system balance.';

    const rawSpeed = Number(item.enemySpeedMultiplier);
    const enemySpeedMultiplier = isNaN(rawSpeed)
      ? 1.0
      : Number(Math.min(1.5, Math.max(0.8, rawSpeed)).toFixed(2));

    const rawHp = Number(item.enemyHealthMultiplier);
    const enemyHealthMultiplier = isNaN(rawHp)
      ? 1.0
      : Number(Math.min(2.0, Math.max(0.8, rawHp)).toFixed(2));

    const rawDmg = Number(item.playerDamageMultiplier);
    const playerDamageMultiplier = isNaN(rawDmg)
      ? 1.0
      : Number(Math.min(1.5, Math.max(0.8, rawDmg)).toFixed(2));

    return {
      id: typeof item.id === 'string' ? item.id : `mut_${Date.now()}`,
      title,
      description,
      enemySpeedMultiplier,
      enemyHealthMultiplier,
      playerDamageMultiplier,
      generatedBy: 'ai'
    };
  }

  /**
   * Validates and clamps a Nemesis Lite boss mutator profile.
   */
  public static validateNemesisMutator(raw: unknown): NemesisBossMutator | null {
    if (!raw || typeof raw !== 'object') return null;
    const item = raw as Record<string, unknown>;

    const bossTitle = typeof item.bossTitle === 'string' && item.bossTitle.trim()
      ? item.bossTitle.trim().slice(0, 40)
      : 'Cyber Overlord [Adaptive]';

    const lore = typeof item.lore === 'string' && item.lore.trim()
      ? item.lore.trim().slice(0, 160)
      : 'Boss mainframe adapted from player combat telemetry.';

    const counterStrategy = typeof item.counterStrategy === 'string' && item.counterStrategy.trim()
      ? item.counterStrategy.trim().slice(0, 120)
      : 'Counter-offensive algorithms active.';

    const rawHp = Number(item.bossHealthMultiplier);
    const bossHealthMultiplier = isNaN(rawHp)
      ? 1.2
      : Number(Math.min(2.5, Math.max(1.0, rawHp)).toFixed(2));

    const rawSpeed = Number(item.bossSpeedMultiplier);
    const bossSpeedMultiplier = isNaN(rawSpeed)
      ? 1.0
      : Number(Math.min(1.5, Math.max(0.8, rawSpeed)).toFixed(2));

    const rawCooldown = Number(item.laserCooldownSeconds);
    const laserCooldownSeconds = isNaN(rawCooldown)
      ? 3.0
      : Number(Math.min(5.0, Math.max(2.0, rawCooldown)).toFixed(1));

    return {
      id: typeof item.id === 'string' ? item.id : `nem_${Date.now()}`,
      bossTitle,
      lore,
      counterStrategy,
      bossHealthMultiplier,
      bossSpeedMultiplier,
      laserCooldownSeconds,
      generatedBy: 'ai'
    };
  }
}
