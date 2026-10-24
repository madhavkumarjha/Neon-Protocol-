import { describe, it, expect } from 'vitest';
import { ContentValidator } from '../../src/systems/ContentValidator';

describe('ContentValidator Unit Tests', () => {
  describe('parseJson', () => {
    it('should parse standard JSON string', () => {
      const res = ContentValidator.parseJson<{ test: number }>('{"test": 42}');
      expect(res).toEqual({ test: 42 });
    });

    it('should strip markdown code block wrapping (```json ... ```)', () => {
      const markdownJson = '```json\n{"name": "CyberRifle", "damage": 50}\n```';
      const res = ContentValidator.parseJson<{ name: string; damage: number }>(markdownJson);
      expect(res).toEqual({ name: 'CyberRifle', damage: 50 });
    });

    it('should return null for malformed JSON strings', () => {
      expect(ContentValidator.parseJson('{ broken json: true ')).toBeNull();
      expect(ContentValidator.parseJson('')).toBeNull();
    });
  });

  describe('sanitizeColor', () => {
    it('should preserve valid approved neon palette colors', () => {
      expect(ContentValidator.sanitizeColor('#00F0FF')).toBe('#00F0FF');
      expect(ContentValidator.sanitizeColor('#FF007F')).toBe('#FF007F');
      expect(ContentValidator.sanitizeColor('#39FF14')).toBe('#39FF14');
      expect(ContentValidator.sanitizeColor('#FFD700')).toBe('#FFD700');
    });

    it('should fallback to #00F0FF for invalid or missing colors', () => {
      expect(ContentValidator.sanitizeColor('not-a-color')).toBe('#00F0FF');
      expect(ContentValidator.sanitizeColor('#123')).toBe('#00F0FF');
      expect(ContentValidator.sanitizeColor(undefined)).toBe('#00F0FF');
    });
  });

  describe('validateWeapon stat clamping', () => {
    it('should clamp baseDamage to [10, 150]', () => {
      const highDmg = ContentValidator.validateWeapon({ baseDamage: 999, weaponType: 'pistol' });
      expect(highDmg?.baseDamage).toBe(150);

      const lowDmg = ContentValidator.validateWeapon({ baseDamage: -50, weaponType: 'pistol' });
      expect(lowDmg?.baseDamage).toBe(10);
    });

    it('should clamp fireRate in rounds/sec to [0.5, 10.0]', () => {
      const highRof = ContentValidator.validateWeapon({ fireRate: 99.9 });
      expect(highRof?.fireRate).toBe(10.0);

      const lowRof = ContentValidator.validateWeapon({ fireRate: 0.05 });
      expect(lowRof?.fireRate).toBe(0.5);
    });

    it('should clamp projectileSpeed to [300, 1400] and force 0 for blade', () => {
      const highSpeed = ContentValidator.validateWeapon({ projectileSpeed: 2500, weaponType: 'rifle' });
      expect(highSpeed?.projectileSpeed).toBe(1400);

      const lowSpeed = ContentValidator.validateWeapon({ projectileSpeed: 50, weaponType: 'rifle' });
      expect(lowSpeed?.projectileSpeed).toBe(300);

      const blade = ContentValidator.validateWeapon({ projectileSpeed: 800, weaponType: 'blade' });
      expect(blade?.projectileSpeed).toBe(0);
      expect(blade?.range).toBe(120);
    });

    it('should clamp archetype specific parameters for grenades and shotguns', () => {
      const grenade = ContentValidator.validateWeapon({
        weaponType: 'grenade',
        aoeRadius: 400
      });
      expect(grenade?.aoeRadius).toBe(200);
      expect(grenade?.selfDamagePercent).toBe(0.15);

      const shotgun = ContentValidator.validateWeapon({
        weaponType: 'shotgun',
        pellets: 20,
        spread: 90
      });
      expect(shotgun?.pellets).toBe(8);
      expect(shotgun?.spread).toBe(45);
    });
  });

  describe('validateWaveMutator clamping', () => {
    it('should clamp wave mutator multipliers within safe ranges', () => {
      const mutator = ContentValidator.validateWaveMutator({
        enemySpeedMultiplier: 5.0,
        enemyHealthMultiplier: 0.1,
        playerDamageMultiplier: 9.9
      });

      expect(mutator?.enemySpeedMultiplier).toBe(1.5);
      expect(mutator?.enemyHealthMultiplier).toBe(0.8);
      expect(mutator?.playerDamageMultiplier).toBe(1.5);
      expect(mutator?.generatedBy).toBe('ai');
    });
  });

  describe('validateNemesisMutator clamping', () => {
    it('should clamp boss mutator multipliers', () => {
      const nemesis = ContentValidator.validateNemesisMutator({
        bossHealthMultiplier: 10.0,
        bossSpeedMultiplier: 0.2,
        laserCooldownSeconds: 0.5
      });

      expect(nemesis?.bossHealthMultiplier).toBe(2.5);
      expect(nemesis?.bossSpeedMultiplier).toBe(0.8);
      expect(nemesis?.laserCooldownSeconds).toBe(2.0);
    });
  });
});
