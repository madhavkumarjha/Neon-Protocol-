import { GameStateManager } from './GameStateManager';
import { WEAPON_CONFIGS, WeaponConfig } from '../config/weapons.config';
import { GroqService } from '../services/GroqService';

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  type: 'stat' | 'weapon';
  isAiGenerated?: boolean;
  apply: () => void;
}

export class UpgradeSystem {
  public static async generateUpgradeChoices(): Promise<UpgradeOption[]> {
    const choices: UpgradeOption[] = [];
    const state = GameStateManager.getInstance().getRunState();

    // Option 1: Stat Boost (Damage / Fire Rate / Speed / Armor)
    const statPool: UpgradeOption[] = [
      {
        id: 'stat_dmg',
        title: 'Plasma Overclock',
        description: '+15% Damage for all weapons',
        type: 'stat',
        apply: () => GameStateManager.getInstance().applyModifier('damageMult', 0.15)
      },
      {
        id: 'stat_firerate',
        title: 'Rapid Trigger',
        description: '+20% Attack Speed',
        type: 'stat',
        apply: () => GameStateManager.getInstance().applyModifier('fireRateMult', 0.20)
      },
      {
        id: 'stat_speed',
        title: 'Cyber Thrusters',
        description: '+15% Movement Speed',
        type: 'stat',
        apply: () => GameStateManager.getInstance().applyModifier('moveSpeedMult', 0.15)
      },
      {
        id: 'stat_hp',
        title: 'Titan Armor',
        description: '+25 Max HP & +15 HP Heal',
        type: 'stat',
        apply: () => {
          GameStateManager.getInstance().applyModifier('maxHpBonus', 25);
          GameStateManager.getInstance().healPlayer(15);
        }
      }
    ];

    // Pick 1 random standard stat option
    const shuffledStats = [...statPool].sort(() => 0.5 - Math.random());
    choices.push(shuffledStats[0]);

    // Option 2: Standard Weapon Unlock or secondary stat
    const lockedWeapons = Object.keys(WEAPON_CONFIGS).filter(
      wId => !state.activeWeapons.includes(wId) && !wId.startsWith('ai_')
    );

    if (lockedWeapons.length > 0) {
      const nextWeaponKey = lockedWeapons[0];
      const wConfig = WEAPON_CONFIGS[nextWeaponKey];
      choices.push({
        id: `weapon_${wConfig.id}`,
        title: `Arsenal: ${wConfig.name}`,
        description: wConfig.description,
        type: 'weapon',
        apply: () => GameStateManager.getInstance().addWeapon(wConfig.id)
      });
    } else {
      choices.push(shuffledStats[1]);
    }

    // Option 3: Groq AI Generated Dynamic Weapon Variant (Feature a)
    try {
      const aiWeapon = await GroqService.generateWeaponVariant({
        wave: state.wave,
        kills: state.kills,
        activeWeapons: state.activeWeapons
      });

      // Register dynamic weapon configuration into global roster
      const colorNum = parseInt(aiWeapon.projectileColor.replace('#', '0x'), 16) || 0x00f0ff;
      const dynamicConfig: WeaponConfig = {
        id: aiWeapon.id,
        name: aiWeapon.displayName,
        type: aiWeapon.weaponType,
        damage: aiWeapon.baseDamage,
        fireRate: aiWeapon.fireRate,
        speed: aiWeapon.projectileSpeed,
        range: aiWeapon.range || (aiWeapon.weaponType === 'blade' ? 120 : 600),
        color: colorNum,
        aoeRadius: aiWeapon.aoeRadius,
        pellets: aiWeapon.pellets,
        spread: aiWeapon.spread,
        pierce: aiWeapon.pierce,
        selfDamagePercent: aiWeapon.selfDamagePercent ?? 0.15,
        description: aiWeapon.lore
      };

      WEAPON_CONFIGS[aiWeapon.id] = dynamicConfig;

      choices.push({
        id: aiWeapon.id,
        title: `[AI] ${aiWeapon.displayName}`,
        description: `${aiWeapon.lore} (DMG: ${aiWeapon.baseDamage}, ROF: ${aiWeapon.fireRate}/s)`,
        type: 'weapon',
        isAiGenerated: true,
        apply: () => GameStateManager.getInstance().addWeapon(aiWeapon.id)
      });
    } catch {
      // Safe fallback: pick another stat
      choices.push(shuffledStats[2]);
    }

    return choices;
  }
}
