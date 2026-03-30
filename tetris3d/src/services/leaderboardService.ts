/**
 * Leaderboard Service - Shared leaderboard via backend API
 * Falls back to localStorage when server is unavailable
 */

import { GameMode } from '../game/GameMode';

// 后端 API 地址，可通过环境变量覆盖
const API_BASE = typeof import.meta !== 'undefined'
  ? (import.meta.env?.VITE_API_URL as string) || ''
  : '';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
  level: number;
  lines: number;
  mode: GameMode;
  date: string;
  elapsedTime?: number;
}

interface LeaderboardData {
  classic: LeaderboardEntry[];
  challenge: LeaderboardEntry[];
  marathon: LeaderboardEntry[];
}

const STORAGE_KEY = 'tetris3d_leaderboard';
const MAX_ENTRIES_PER_MODE = 10;

// ==================== Local Storage Fallback ====================

function getLocalData(): LeaderboardData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn('Failed to read local leaderboard:', e);
  }
  return { classic: [], challenge: [], marathon: [] };
}

function saveLocalData(data: LeaderboardData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save local leaderboard:', e);
  }
}

// ==================== API Calls ====================

async function apiGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function apiPost<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ==================== Public API ====================

/**
 * Add a score to the leaderboard (with player name)
 */
export async function addScore(
  name: string,
  score: number,
  level: number,
  lines: number,
  mode: GameMode,
  elapsedTime?: number
): Promise<LeaderboardEntry | null> {
  const entry = {
    name: name || 'Anonymous',
    score,
    level,
    lines,
    mode,
    elapsedTime,
  };

  // 尝试提交到服务器
  const result = await apiPost<LeaderboardEntry>('/api/leaderboard', entry);
  if (result) return result;

  // 降级：保存到本地
  const data = getLocalData();
  const modeKey = mode as keyof LeaderboardData;
  const entries = data[modeKey];

  const newEntry: LeaderboardEntry = {
    rank: 0,
    name: entry.name,
    score,
    level,
    lines,
    mode,
    date: new Date().toISOString(),
    elapsedTime,
  };

  entries.push(newEntry);
  entries.sort((a, b) => b.score - a.score);
  if (entries.length > MAX_ENTRIES_PER_MODE) {
    entries.splice(MAX_ENTRIES_PER_MODE);
  }
  entries.forEach((e, i) => { e.rank = i + 1; });

  const saved = entries.find(e =>
    e.score === score && e.level === level && e.lines === lines && e.date === newEntry.date
  );

  if (saved) {
    saveLocalData(data);
    return saved;
  }
  return null;
}

/**
 * Get leaderboard entries for a specific mode
 */
export async function getLeaderboard(mode: GameMode): Promise<LeaderboardEntry[]> {
  // 尝试从服务器获取
  const result = await apiGet<LeaderboardEntry[]>(`/api/leaderboard?mode=${mode}`);
  if (result) return result;

  // 降级：从本地获取
  const data = getLocalData();
  return data[mode as keyof LeaderboardData] || [];
}

/**
 * Get all leaderboard data
 */
export async function getAllLeaderboards(): Promise<LeaderboardData> {
  const result = await apiGet<LeaderboardData>('/api/leaderboard/all');
  if (result) return result;
  return getLocalData();
}

/**
 * Check if a score qualifies for the leaderboard
 */
export async function qualifiesForLeaderboard(score: number, mode: GameMode): Promise<boolean> {
  const entries = await getLeaderboard(mode);
  if (entries.length < MAX_ENTRIES_PER_MODE) return true;
  return score > entries[entries.length - 1].score;
}

/**
 * Get predicted rank for a score
 */
export async function getPredictedRank(score: number, mode: GameMode): Promise<number> {
  const entries = await getLeaderboard(mode);
  let rank = 1;
  for (const entry of entries) {
    if (score <= entry.score) {
      rank++;
    } else {
      break;
    }
  }
  return rank > MAX_ENTRIES_PER_MODE ? -1 : rank;
}

// ==================== Utility ====================

export function formatLeaderboardDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  }
  return date.toLocaleDateString();
}

export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
