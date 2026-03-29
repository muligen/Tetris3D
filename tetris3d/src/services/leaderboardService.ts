/**
 * Leaderboard Service - Manages local high scores leaderboard
 */

import { GameMode } from '../game/GameMode';

export interface LeaderboardEntry {
  rank: number;
  score: number;
  level: number;
  lines: number;
  mode: GameMode;
  date: string;
  elapsedTime?: number; // For marathon mode tracking
}

interface LeaderboardData {
  classic: LeaderboardEntry[];
  challenge: LeaderboardEntry[];
  marathon: LeaderboardEntry[];
}

const STORAGE_KEY = 'tetris3d_leaderboard';
const MAX_ENTRIES_PER_MODE = 10;

/**
 * Get leaderboard from localStorage
 */
function getLeaderboardData(): LeaderboardData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load leaderboard:', error);
  }

  // Return empty leaderboard if nothing stored
  return {
    classic: [],
    challenge: [],
    marathon: [],
  };
}

/**
 * Save leaderboard to localStorage
 */
function saveLeaderboardData(data: LeaderboardData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save leaderboard:', error);
  }
}

/**
 * Add a new score to the leaderboard
 */
export function addScore(
  score: number,
  level: number,
  lines: number,
  mode: GameMode,
  elapsedTime?: number
): LeaderboardEntry | null {
  const data = getLeaderboardData();
  const modeKey = mode as keyof LeaderboardData;
  const entries = data[modeKey];

  // Create new entry
  const newEntry: LeaderboardEntry = {
    rank: 0, // Will be set after sorting
    score,
    level,
    lines,
    mode,
    date: new Date().toISOString(),
    elapsedTime,
  };

  // Add to entries and sort by score (descending)
  entries.push(newEntry);
  entries.sort((a, b) => b.score - a.score);

  // Keep only top entries
  if (entries.length > MAX_ENTRIES_PER_MODE) {
    entries.splice(MAX_ENTRIES_PER_MODE);
  }

  // Update ranks
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  // Check if the new entry made it to the leaderboard
  const savedEntry = entries.find(
    (e) =>
      e.score === score &&
      e.level === level &&
      e.lines === lines &&
      e.date === newEntry.date
  );

  if (savedEntry) {
    // Save to localStorage
    saveLeaderboardData(data);
    return savedEntry;
  }

  return null;
}

/**
 * Get leaderboard entries for a specific mode
 */
export function getLeaderboard(mode: GameMode): LeaderboardEntry[] {
  const data = getLeaderboardData();
  const modeKey = mode as keyof LeaderboardData;
  return data[modeKey];
}

/**
 * Get all leaderboard entries
 */
export function getAllLeaderboards(): LeaderboardData {
  return getLeaderboardData();
}

/**
 * Get the highest score for a specific mode
 */
export function getHighestScore(mode: GameMode): number {
  const entries = getLeaderboard(mode);
  return entries.length > 0 ? entries[0].score : 0;
}

/**
 * Get the rank a score would achieve (without adding it)
 */
export function getPredictedRank(score: number, mode: GameMode): number {
  const entries = getLeaderboard(mode);

  // Find where this score would fit
  let rank = 1;
  for (const entry of entries) {
    if (score <= entry.score) {
      rank++;
    } else {
      break;
    }
  }

  // If rank exceeds max entries, return -1 (wouldn't make leaderboard)
  return rank > MAX_ENTRIES_PER_MODE ? -1 : rank;
}

/**
 * Clear all leaderboard data
 */
export function clearLeaderboard(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear leaderboard:', error);
  }
}

/**
 * Clear leaderboard for a specific mode
 */
export function clearModeLeaderboard(mode: GameMode): void {
  const data = getLeaderboardData();
  const modeKey = mode as keyof LeaderboardData;
  data[modeKey] = [];
  saveLeaderboardData(data);
}

/**
 * Check if a score qualifies for the leaderboard
 */
export function qualifiesForLeaderboard(score: number, mode: GameMode): boolean {
  const entries = getLeaderboard(mode);
  if (entries.length < MAX_ENTRIES_PER_MODE) {
    return true;
  }
  return score > entries[entries.length - 1].score;
}

/**
 * Format date for display
 */
export function formatLeaderboardDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
}

/**
 * Format time for display (for marathon mode)
 */
export function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}
