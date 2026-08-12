import type { ProgressStore } from '../data/types';

const STORAGE_KEY_PREFIX = 'eos-progress-';

export function calcLevel(xp: number): number {
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100));
}

export function calcLevelProgress(xp: number): { current: number; next: number; pct: number } {
  const level = calcLevel(xp);
  const currentLevelXp = level * level * 100;
  const nextLevelXp = (level + 1) * (level + 1) * 100;
  const needed = nextLevelXp - currentLevelXp;
  const progress = xp - currentLevelXp;
  const pct = needed > 0 ? Math.min(100, Math.round((progress / needed) * 100)) : 100;
  return { current: progress, next: needed, pct };
}

function emptyStore(userId: string): ProgressStore {
  return { version: 1, userId, xp: 0, level: 0, runCount: 0 };
}

function loadProgress(userId: string): ProgressStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + userId);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.version === 1 && typeof parsed.xp === 'number') {
        return parsed as ProgressStore;
      }
    }
  } catch {
    // corrupt or missing — return empty
  }
  return emptyStore(userId);
}

function saveProgress(store: ProgressStore): void {
  localStorage.setItem(STORAGE_KEY_PREFIX + store.userId, JSON.stringify(store));
}

export function getProgress(userId: string): ProgressStore {
  return loadProgress(userId);
}

export function addXp(userId: string, amount: number): ProgressStore {
  const store = loadProgress(userId);
  const safeAmount = Math.max(0, amount);
  const next: ProgressStore = {
    ...store,
    xp: store.xp + safeAmount,
    runCount: store.runCount + 1,
    level: calcLevel(store.xp + safeAmount),
  };
  saveProgress(next);
  return next;
}