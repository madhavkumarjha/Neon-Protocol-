import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { StorageService } from './StorageService';

export interface ScoreEntry {
  device_id: string;
  display_name: string;
  score: number;
  wave: number;
  kills: number;
  score_hash?: string;
  created_at?: string;
}

export class LeaderboardService {
  private static metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
  private static supabaseUrl = LeaderboardService.metaEnv?.VITE_SUPABASE_URL || '';
  private static supabaseAnonKey = LeaderboardService.metaEnv?.VITE_SUPABASE_ANON_KEY || '';
  private static supabase: SupabaseClient | null = null;

  private static mockScores: ScoreEntry[] = [
    { device_id: 'mock_1', display_name: 'NeonGhost', score: 98500, wave: 24, kills: 612 },
    { device_id: 'mock_2', display_name: 'CyberViper', score: 74200, wave: 19, kills: 489 },
    { device_id: 'mock_3', display_name: 'Overclocked', score: 51000, wave: 15, kills: 310 },
    { device_id: 'mock_4', display_name: 'SynthRunner', score: 32400, wave: 11, kills: 204 }
  ];

  private static getClient(): SupabaseClient | null {
    if (!this.supabase && this.supabaseUrl && this.supabaseAnonKey) {
      try {
        this.supabase = createClient(this.supabaseUrl, this.supabaseAnonKey);
      } catch (e) {
        console.warn('LeaderboardService: Supabase init error, falling back to local storage', e);
      }
    }
    return this.supabase;
  }

  /**
   * Generates client-side score hash signature.
   * NOTE: Client-side hash generation with an embedded secret is security-by-obscurity and not true protection.
   * Real protection against score tampering must be enforced via Supabase Row Level Security (RLS) + server-side validation.
   */
  public static generateScoreHash(deviceId: string, score: number, wave: number, kills: number): string {
    const raw = `${deviceId}_${score}_${wave}_${kills}_NEON_PROTOCOL_SECRET`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `sig_${Math.abs(hash).toString(16)}`;
  }

  public static async fetchTopScores(): Promise<ScoreEntry[]> {
    const client = this.getClient();

    if (client) {
      try {
        const { data, error } = await client
          .from('scores')
          .select('device_id, display_name, score, wave, kills')
          .order('score', { ascending: false })
          .limit(50);

        if (!error && data && data.length > 0) {
          return data as ScoreEntry[];
        }
      } catch (err) {
        console.warn('LeaderboardService: Live fetch failed, using fallback pool', err);
      }
    }

    // Fallback local storage with real stored wave and kills
    const bestRun = StorageService.getBestRun();
    const scores = [...this.mockScores];
    if (bestRun.score > 0) {
      scores.push({
        device_id: StorageService.getDeviceId(),
        display_name: 'You (Local)',
        score: bestRun.score,
        wave: bestRun.wave,
        kills: bestRun.kills
      });
    }
    return scores.sort((a, b) => b.score - a.score);
  }

  public static async submitScore(name: string, score: number, wave: number, kills: number): Promise<boolean> {
    StorageService.saveBestRun(score, wave, kills);
    const deviceId = StorageService.getDeviceId();
    const displayName = name || 'CyberSamurai';
    const scoreHash = this.generateScoreHash(deviceId, score, wave, kills);

    const client = this.getClient();
    if (client) {
      try {
        const { error } = await client.from('scores').insert([{
          device_id: deviceId,
          display_name: displayName,
          score,
          wave,
          kills,
          score_hash: scoreHash
        }]);

        if (!error) return true;
      } catch (err) {
        console.warn('LeaderboardService: Live submission failed, saved locally', err);
      }
    }

    // Local fallback pool update
    this.mockScores.push({
      device_id: deviceId,
      display_name: displayName,
      score,
      wave,
      kills,
      score_hash: scoreHash
    });
    return true;
  }
}
