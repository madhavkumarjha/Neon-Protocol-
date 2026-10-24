import {
  ContentValidator,
  AIGeneratedWeapon
} from '../systems/ContentValidator';
import {
  WaveMutator,
  NemesisBossMutator,
  FALLBACK_AI_WEAPONS,
  FALLBACK_WAVE_MUTATORS,
  FALLBACK_NEMESIS_MUTATORS
} from '../config/weapons.fallback';

export class GroqService {
  private static readonly ENDPOINT = '/api/generate';
  private static readonly TIMEOUT_MS = 3000;
  private static readonly THROTTLE_DURATION_MS = 10 * 60 * 1000; // 10 minutes per Section 2
  private static throttledUntil: number = 0;

  // Local storage cache keys
  private static readonly CACHE_WEAPONS_KEY = 'neon_protocol_ai_cache_weapons';
  private static readonly CACHE_MUTATORS_KEY = 'neon_protocol_ai_cache_mutators';
  private static readonly CACHE_NEMESIS_KEY = 'neon_protocol_ai_cache_nemesis';

  private static inMemoryStore: Record<string, string> = {};

  private static getStoredItem(key: string): string | null {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
    return this.inMemoryStore[key] || null;
  }

  private static setStoredItem(key: string, val: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, val);
    } else {
      this.inMemoryStore[key] = val;
    }
  }

  /**
   * Checks if remote requests are currently throttled due to HTTP 429.
   */
  public static isThrottled(): boolean {
    return Date.now() < this.throttledUntil;
  }

  /**
   * Resets throttle status (used for unit tests and debug).
   */
  public static resetThrottle(): void {
    this.throttledUntil = 0;
  }

  /**
   * Retrieves an item from the local generation cache.
   */
  private static getCachedItem<T>(key: string): T | null {
    const raw = this.getStoredItem(key);
    if (!raw) return null;
    try {
      const list = JSON.parse(raw);
      if (Array.isArray(list) && list.length > 0) {
        return list[Math.floor(Math.random() * list.length)] as T;
      }
    } catch {
      // Ignore cache parse error
    }
    return null;
  }

  /**
   * Saves an item to the local generation cache.
   */
  private static saveCachedItem<T>(key: string, item: T): void {
    try {
      const raw = this.getStoredItem(key);
      const list = raw ? JSON.parse(raw) : [];
      if (Array.isArray(list)) {
        list.push(item);
        // Keep max 20 items in cache
        if (list.length > 20) list.shift();
        this.setStoredItem(key, JSON.stringify(list));
      }
    } catch {
      // Ignore storage errors
    }
  }

  /**
   * Executes a proxied LLM call enforcing 3000ms timeout and error handling.
   */
  private static async callProxy(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.7
  ): Promise<string | null> {
    if (this.isThrottled()) {
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const res = await fetch(this.ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.status === 429) {
        // Enforce 10 min throttle per Section 2
        this.throttledUntil = Date.now() + this.THROTTLE_DURATION_MS;
        return null;
      }

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content;
      return typeof content === 'string' ? content : null;
    } catch {
      clearTimeout(timeoutId);
      return null;
    }
  }

  /**
   * Generates a dynamic cyberpunk weapon variant.
   */
  public static async generateWeaponVariant(telemetry?: Record<string, unknown>): Promise<AIGeneratedWeapon> {
    const fallback = FALLBACK_AI_WEAPONS[Math.floor(Math.random() * FALLBACK_AI_WEAPONS.length)];

    if (this.isThrottled()) {
      return this.getCachedItem<AIGeneratedWeapon>(this.CACHE_WEAPONS_KEY) || fallback;
    }

    const systemPrompt = `You are an AI weapon designer for Neon Protocol, a cyberpunk 2D top-down shooter.
Respond ONLY with a valid JSON object adhering strictly to this schema:
{
  "id": "ai_unique_name",
  "displayName": "Cyber Weapon Name",
  "lore": "1-2 sentence flavor lore.",
  "weaponType": "pistol" | "shotgun" | "rifle" | "grenade" | "blade",
  "baseDamage": number (10 to 150),
  "fireRate": number (0.5 to 10.0 rounds per second),
  "projectileSpeed": number (300 to 1400 px/s),
  "projectileColor": "#00F0FF" | "#FF007F" | "#FFD700" | "#39FF14",
  "range": number (80 to 900)
}`;

    const userPrompt = `Generate a unique rare energy weapon variant. Telemetry context: ${JSON.stringify(telemetry || {})}`;

    let responseText = await this.callProxy(systemPrompt, userPrompt, 0.7);

    // Fallback Matrix: if response is invalid JSON, retry once with strict temperature (0.1)
    let parsed = responseText ? ContentValidator.parseJson(responseText) : null;
    let validated = parsed ? ContentValidator.validateWeapon(parsed) : null;

    if (!validated && responseText) {
      // Retry once at temperature 0.1 per Section 2
      responseText = await this.callProxy(systemPrompt, userPrompt, 0.1);
      parsed = responseText ? ContentValidator.parseJson(responseText) : null;
      validated = parsed ? ContentValidator.validateWeapon(parsed) : null;
    }

    if (validated) {
      this.saveCachedItem(this.CACHE_WEAPONS_KEY, validated);
      return validated;
    }

    // Serve from cache or fallback pool
    return this.getCachedItem<AIGeneratedWeapon>(this.CACHE_WEAPONS_KEY) || fallback;
  }

  /**
   * Generates a procedural wave mutator.
   */
  public static async generateWaveMutator(waveNumber: number): Promise<WaveMutator> {
    const fallback = FALLBACK_WAVE_MUTATORS[Math.floor(Math.random() * FALLBACK_WAVE_MUTATORS.length)];

    if (this.isThrottled()) {
      return this.getCachedItem<WaveMutator>(this.CACHE_MUTATORS_KEY) || fallback;
    }

    const systemPrompt = `You are a wave mutator generator for Neon Protocol.
Respond ONLY with a valid JSON object:
{
  "id": "mut_slug",
  "title": "Mutator Title",
  "description": "Short 1-sentence effect summary",
  "enemySpeedMultiplier": number (0.8 to 1.5),
  "enemyHealthMultiplier": number (0.8 to 2.0),
  "playerDamageMultiplier": number (0.8 to 1.5)
}`;

    const userPrompt = `Generate an escalating wave event mutator for Wave ${waveNumber}.`;

    let responseText = await this.callProxy(systemPrompt, userPrompt, 0.7);
    let parsed = responseText ? ContentValidator.parseJson(responseText) : null;
    let validated = parsed ? ContentValidator.validateWaveMutator(parsed) : null;

    if (!validated && responseText) {
      responseText = await this.callProxy(systemPrompt, userPrompt, 0.1);
      parsed = responseText ? ContentValidator.parseJson(responseText) : null;
      validated = parsed ? ContentValidator.validateWaveMutator(parsed) : null;
    }

    if (validated) {
      this.saveCachedItem(this.CACHE_MUTATORS_KEY, validated);
      return validated;
    }

    return this.getCachedItem<WaveMutator>(this.CACHE_MUTATORS_KEY) || fallback;
  }

  /**
   * Generates Nemesis Lite boss profile based on run telemetry.
   */
  public static async generateNemesisProfile(telemetry: Record<string, unknown>): Promise<NemesisBossMutator> {
    const fallback = FALLBACK_NEMESIS_MUTATORS[Math.floor(Math.random() * FALLBACK_NEMESIS_MUTATORS.length)];

    if (this.isThrottled()) {
      return this.getCachedItem<NemesisBossMutator>(this.CACHE_NEMESIS_KEY) || fallback;
    }

    const systemPrompt = `You are an adaptive boss designer for Neon Protocol.
Respond ONLY with a valid JSON object:
{
  "id": "nem_slug",
  "bossTitle": "Cyber Overlord [Variant]",
  "lore": "1-2 sentence flavor lore countering player build.",
  "counterStrategy": "Tactical summary of the boss mutation.",
  "bossHealthMultiplier": number (1.0 to 2.5),
  "bossSpeedMultiplier": number (0.8 to 1.5),
  "laserCooldownSeconds": number (2.0 to 5.0)
}`;

    const userPrompt = `Generate a boss adaptation countering player telemetry: ${JSON.stringify(telemetry)}`;

    let responseText = await this.callProxy(systemPrompt, userPrompt, 0.7);
    let parsed = responseText ? ContentValidator.parseJson(responseText) : null;
    let validated = parsed ? ContentValidator.validateNemesisMutator(parsed) : null;

    if (!validated && responseText) {
      responseText = await this.callProxy(systemPrompt, userPrompt, 0.1);
      parsed = responseText ? ContentValidator.parseJson(responseText) : null;
      validated = parsed ? ContentValidator.validateNemesisMutator(parsed) : null;
    }

    if (validated) {
      this.saveCachedItem(this.CACHE_NEMESIS_KEY, validated);
      return validated;
    }

    return this.getCachedItem<NemesisBossMutator>(this.CACHE_NEMESIS_KEY) || fallback;
  }
}
