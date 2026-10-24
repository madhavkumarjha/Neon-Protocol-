import { describe, it, expect } from 'vitest';
import {
  isWithinMeleeArc,
  calculateProjectileLifespan,
  calculateEmpSelfDamage,
  isPointInLaserBeam,
  calculateLockRadius
} from '../../src/utils/combatMath';

describe('combatMath utility suite', () => {
  describe('isWithinMeleeArc', () => {
    const origin = { x: 100, y: 100 };
    const facingAngle = 0; // Facing right along positive X axis
    const range = 120;
    const arcAngle = (2 * Math.PI) / 3; // 120 degrees (+- 60 deg)

    it('should detect enemy directly in front within range', () => {
      const target = { x: 160, y: 100 };
      expect(isWithinMeleeArc(origin, facingAngle, target, range, arcAngle)).toBe(true);
    });

    it('should reject enemy directly in front but beyond range', () => {
      const target = { x: 230, y: 100 };
      expect(isWithinMeleeArc(origin, facingAngle, target, range, arcAngle)).toBe(false);
    });

    it('should detect enemy within arc cone', () => {
      // 45 degrees up and right, dist approx 70.7
      const target = { x: 150, y: 150 };
      expect(isWithinMeleeArc(origin, facingAngle, target, range, arcAngle)).toBe(true);
    });

    it('should reject enemy behind the player', () => {
      const target = { x: 50, y: 100 };
      expect(isWithinMeleeArc(origin, facingAngle, target, range, arcAngle)).toBe(false);
    });

    it('should reject enemy 90 degrees to the side when arc is 120 degrees (+-60 deg)', () => {
      const target = { x: 100, y: 180 };
      expect(isWithinMeleeArc(origin, facingAngle, target, range, arcAngle)).toBe(false);
    });
  });

  describe('calculateProjectileLifespan', () => {
    it('should calculate correct lifetime in ms from range and speed', () => {
      // EMP grenade: range 500, speed 400 => 1.25s => 1250ms
      expect(calculateProjectileLifespan(500, 400)).toBe(1250);
      // Laser rifle: range 900, speed 1400 => 900/1400 * 1000
      expect(calculateProjectileLifespan(900, 1400)).toBeCloseTo(642.857, 2);
    });

    it('should return 0 when speed is 0 or negative', () => {
      expect(calculateProjectileLifespan(120, 0)).toBe(0);
      expect(calculateProjectileLifespan(120, -10)).toBe(0);
    });
  });

  describe('calculateEmpSelfDamage', () => {
    it('should calculate 15% self damage by default', () => {
      expect(calculateEmpSelfDamage(80, 0.15)).toBe(12);
    });

    it('should clamp self-damage percentage at 15% maximum', () => {
      expect(calculateEmpSelfDamage(100, 0.50)).toBe(15);
      expect(calculateEmpSelfDamage(100, 1.0)).toBe(15);
    });

    it('should allow lower self-damage percentages', () => {
      expect(calculateEmpSelfDamage(100, 0.05)).toBe(5);
      expect(calculateEmpSelfDamage(100, 0)).toBe(0);
    });
  });

  describe('isPointInLaserBeam', () => {
    const origin = { x: 500, y: 500 };
    const beamAngle = 0; // Pointing right (+X)
    const beamLength = 800;
    const beamRadius = 25;

    it('should detect target located on the laser beam center line', () => {
      expect(isPointInLaserBeam({ x: 700, y: 500 }, origin, beamAngle, beamLength, beamRadius)).toBe(true);
    });

    it('should detect target within laser beam radius', () => {
      expect(isPointInLaserBeam({ x: 700, y: 520 }, origin, beamAngle, beamLength, beamRadius)).toBe(true);
    });

    it('should reject target outside beam radius', () => {
      expect(isPointInLaserBeam({ x: 700, y: 540 }, origin, beamAngle, beamLength, beamRadius)).toBe(false);
    });

    it('should reject target behind the laser origin', () => {
      expect(isPointInLaserBeam({ x: 450, y: 500 }, origin, beamAngle, beamLength, beamRadius)).toBe(false);
    });

    it('should reject target beyond the laser max length', () => {
      expect(isPointInLaserBeam({ x: 1400, y: 500 }, origin, beamAngle, beamLength, beamRadius)).toBe(false);
    });
  });

  describe('calculateLockRadius', () => {
    it('should return weapon range if greater than minimum radius', () => {
      expect(calculateLockRadius(600)).toBe(600);
      expect(calculateLockRadius(900)).toBe(900);
    });

    it('should enforce minimum lock radius for short-range weapons', () => {
      expect(calculateLockRadius(120, 1.0, 250)).toBe(250);
    });

    it('should respect custom multiplier', () => {
      expect(calculateLockRadius(600, 1.2, 250)).toBe(720);
    });
  });
});
