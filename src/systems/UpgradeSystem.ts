import { GameStateManager } from './GameStateManager';
import { WEAPON_CONFIGS } from '../config/weapons.config';

export interface UpgradeOption {
  id: string;
  title: string;
  description: string;
  type: 'stat' | 'weapon';
  apply: () => void;
}

export class UpgradeSystem {
  public static generateUpgradeChoices(): UpgradeOption[] {
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

    // Pick 2 random stat options
    const shuffledStats = [...statPool].sort(() => 0.5 - Math.random());
    choices.push(shuffledStats[0], shuffledStats[1]);

    // Option 3: Weapon Unlock or alternative stat
    const lockedWeapons = Object.keys(WEAPON_CONFIGS).filter(
      wId => !state.activeWeapons.includes(wId)
    );

    if (lockedWeapons.length > 0) {
      const nextWeaponKey = lockedWeapons[0];
      const wConfig = WEAPON_CONFIGS[nextWeaponKey];
      choices.push({
        id: `weapon_${wConfig.id}`,
        title: `Unlock: ${wConfig.name}`,
        description: wConfig.description,
        type: 'weapon',
        apply: () => GameStateManager.getInstance().addWeapon(wConfig.id)
      });
    } else {
      choices.push(shuffledStats[2]);
    }

    return choices;
  }
}
