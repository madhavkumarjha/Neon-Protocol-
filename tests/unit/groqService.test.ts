import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GroqService } from '../../src/services/GroqService';

describe('GroqService Fallback Matrix & Generation Suite', () => {
  beforeEach(() => {
    GroqService.resetThrottle();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Scenario 1: Network Timeout (>3000ms) falls back to pre-authored pool without throwing', async () => {
    // Mock fetch that hangs / rejects with AbortError
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      return Promise.reject(error);
    });

    const weapon = await GroqService.generateWeaponVariant();
    expect(weapon).toBeDefined();
    expect(weapon.id).toBeDefined();
    expect(weapon.baseDamage).toBeGreaterThanOrEqual(10);
    expect(weapon.fireRate).toBeGreaterThanOrEqual(0.5);
  });

  it('Scenario 2: HTTP 500 / 503 error gracefully degrades to offline fallback pool', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Service Unavailable' }),
      text: async () => 'Service Unavailable'
    } as unknown as Response);

    const weapon = await GroqService.generateWeaponVariant();
    expect(weapon).toBeDefined();
    expect(weapon.displayName).toBeTruthy();
  });

  it('Scenario 3: HTTP 429 Rate Limit triggers 10 minute throttle and serves cached/fallback items', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Too Many Requests' }),
      text: async () => 'Rate limit exceeded'
    } as unknown as Response);

    // First call receives 429 and engages throttle
    const weapon1 = await GroqService.generateWeaponVariant();
    expect(weapon1).toBeDefined();
    expect(GroqService.isThrottled()).toBe(true);

    // Second call immediately skips remote fetch due to throttle
    const weapon2 = await GroqService.generateWeaponVariant();
    expect(weapon2).toBeDefined();
    // fetch should have been called only once, not twice
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('Scenario 4: Malformed JSON triggers retry at temperature 0.1 and recovers if valid', async () => {
    const validJsonString = JSON.stringify({
      id: 'ai_recovered_beam',
      displayName: 'Recovered Beam',
      lore: 'Recovered after low temperature retry.',
      weaponType: 'rifle',
      baseDamage: 50,
      fireRate: 2.5,
      projectileSpeed: 1000,
      projectileColor: '#00F0FF',
      range: 800
    });

    const fetchMock = vi.spyOn(globalThis, 'fetch')
      // Call 1 (temp 0.7): returns invalid JSON
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: '{ invalid json here ' } }]
        })
      } as unknown as Response)
      // Call 2 (temp 0.1 retry): returns valid JSON
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: validJsonString } }]
        })
      } as unknown as Response);

    const weapon = await GroqService.generateWeaponVariant();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(weapon.displayName).toBe('Recovered Beam');
    expect(weapon.baseDamage).toBe(50);
  });

  it('Scenario 4b: Malformed JSON falls back safely if retry also fails', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          choices: [{ message: { content: 'broken json' } }]
        })
      } as unknown as Response);

    const weapon = await GroqService.generateWeaponVariant();
    expect(weapon).toBeDefined();
    expect(weapon.id).toBeDefined();
  });

  it('Scenario 5: Unbalanced stats are clamped before returning to player', async () => {
    const rawUnbalanced = JSON.stringify({
      id: 'ai_hacked_gun',
      displayName: 'Hacked Gun',
      lore: 'Extreme stats produced by hallucination.',
      weaponType: 'pistol',
      baseDamage: 999999, // Outside clamped bound [10, 150]
      fireRate: 500,       // Outside clamped bound [0.5, 10.0]
      projectileSpeed: 50000 // Outside clamped bound [300, 1400]
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: rawUnbalanced } }]
      })
    } as unknown as Response);

    const weapon = await GroqService.generateWeaponVariant();
    expect(weapon.baseDamage).toBe(150);
    expect(weapon.fireRate).toBe(10.0);
    expect(weapon.projectileSpeed).toBe(1400);
  });

  it('Generates wave mutators with clamping', async () => {
    const mutatorJson = JSON.stringify({
      id: 'mut_radiation',
      title: 'Radiation Storm',
      description: 'Atmospheric disturbance alters enemy agility.',
      enemySpeedMultiplier: 1.3,
      enemyHealthMultiplier: 1.1,
      playerDamageMultiplier: 1.2
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: mutatorJson } }]
      })
    } as unknown as Response);

    const mutator = await GroqService.generateWaveMutator(5);
    expect(mutator.title).toBe('Radiation Storm');
    expect(mutator.enemySpeedMultiplier).toBe(1.3);
  });

  it('Generates Nemesis Lite boss profile with clamping', async () => {
    const nemesisJson = JSON.stringify({
      id: 'nem_counter_shotgun',
      bossTitle: 'Cyber Overlord [Distance Keeper]',
      lore: 'Counters close range weapon tactics with swift retreat thrusters.',
      counterStrategy: 'Maintains long range separation to mitigate scattergun damage.',
      bossHealthMultiplier: 1.5,
      bossSpeedMultiplier: 1.2,
      laserCooldownSeconds: 2.8
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: nemesisJson } }]
      })
    } as unknown as Response);

    const nemesis = await GroqService.generateNemesisProfile({
      favoriteWeapon: 'arc_shotgun',
      kills: 50,
      wave: 5
    });

    expect(nemesis.bossTitle).toBe('Cyber Overlord [Distance Keeper]');
    expect(nemesis.bossHealthMultiplier).toBe(1.5);
    expect(nemesis.laserCooldownSeconds).toBe(2.8);
  });
});
