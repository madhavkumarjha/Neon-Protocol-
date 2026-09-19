import { describe, it, expect, beforeEach } from 'vitest';
import { GameStateManager } from '../../src/systems/GameStateManager';

describe('GameStateManager Unit Tests', () => {
  let stateManager: GameStateManager;

  beforeEach(() => {
    stateManager = GameStateManager.getInstance();
    stateManager.resetRun();
  });

  it('should initialize with default V1 run state', () => {
    const state = stateManager.getRunState();
    expect(state.score).toBe(0);
    expect(state.wave).toBe(1);
    expect(state.level).toBe(1);
    expect(state.playerHp).toBe(100);
    expect(state.maxPlayerHp).toBe(100);
    expect(state.activeWeapons).toContain('plasma_pistol');
  });

  it('should correctly increment score and kills', () => {
    stateManager.addKill();
    const state = stateManager.getRunState();
    expect(state.kills).toBe(1);
    expect(state.score).toBe(100);
  });

  it('should handle player damage and death state', () => {
    stateManager.damagePlayer(40);
    let state = stateManager.getRunState();
    expect(state.playerHp).toBe(60);
    expect(state.isGameOver).toBe(false);

    stateManager.damagePlayer(70);
    state = stateManager.getRunState();
    expect(state.playerHp).toBe(0);
    expect(state.isGameOver).toBe(true);
  });

  it('should handle XP level up thresholds', () => {
    stateManager.addXp(150);
    const state = stateManager.getRunState();
    expect(state.level).toBe(2);
    expect(state.currentXp).toBe(50);
  });

  it('should correctly update and toggle pause state', () => {
    expect(stateManager.isPaused()).toBe(false);
    stateManager.setPaused(true);
    expect(stateManager.isPaused()).toBe(true);
    stateManager.setPaused(false);
    expect(stateManager.isPaused()).toBe(false);
  });
});
