/**
 * Combat math and spatial calculations for weapons, auto-aim, and attacks.
 */

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Normalizes an angle difference to [-PI, PI].
 */
export function normalizeAngle(angle: number): number {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

/**
 * Determines whether a target point lies within a forward melee cleave arc.
 * @param origin Origin of the cleave (e.g., player position)
 * @param facingAngle Direction player is facing in radians
 * @param target Target entity position
 * @param range Maximum cleave reach in pixels
 * @param arcAngleRad Total arc angle in radians (default 120° / ~2.094 rad)
 */
export function isWithinMeleeArc(
  origin: Point2D,
  facingAngle: number,
  target: Point2D,
  range: number,
  arcAngleRad: number = (2 * Math.PI) / 3
): boolean {
  const dx = target.x - origin.x;
  const dy = target.y - origin.y;
  const distSq = dx * dx + dy * dy;

  if (distSq > range * range) {
    return false;
  }

  const angleToTarget = Math.atan2(dy, dx);
  const angleDiff = Math.abs(normalizeAngle(angleToTarget - facingAngle));

  return angleDiff <= arcAngleRad / 2;
}

/**
 * Calculates projectile lifespan in milliseconds from weapon range and velocity.
 */
export function calculateProjectileLifespan(range: number, speed: number): number {
  if (speed <= 0) return 0;
  return (range / speed) * 1000;
}

/**
 * Calculates EMP grenade self-damage, capped at 15%.
 */
export function calculateEmpSelfDamage(damage: number, selfDamagePercent: number = 0.15): number {
  const clampedPercent = Math.min(Math.max(0, selfDamagePercent), 0.15);
  return Math.round(damage * clampedPercent);
}

/**
 * Checks if a point falls within a linear beam (line segment with width).
 * @param point Target point (e.g. player center)
 * @param beamStart Start point of beam (boss origin)
 * @param beamAngle Angle of beam in radians
 * @param beamLength Max reach of the laser beam
 * @param beamRadius Effective hit radius around the center beam line
 */
export function isPointInLaserBeam(
  point: Point2D,
  beamStart: Point2D,
  beamAngle: number,
  beamLength: number,
  beamRadius: number
): boolean {
  const dx = point.x - beamStart.x;
  const dy = point.y - beamStart.y;

  // Project point onto beam direction vector
  const dirX = Math.cos(beamAngle);
  const dirY = Math.sin(beamAngle);

  const projection = dx * dirX + dy * dirY;

  // Point is behind the beam start or beyond max length
  if (projection < 0 || projection > beamLength) {
    return false;
  }

  // Perpendicular distance squared from line
  const perpX = dx - projection * dirX;
  const perpY = dy - projection * dirY;
  const distSq = perpX * perpX + perpY * perpY;

  return distSq <= beamRadius * beamRadius;
}

/**
 * Calculates dynamic auto-aim lock radius based on equipped weapon range.
 */
export function calculateLockRadius(
  weaponRange: number,
  multiplier: number = 1.0,
  minRadius: number = 250
): number {
  return Math.max(minRadius, weaponRange * multiplier);
}
