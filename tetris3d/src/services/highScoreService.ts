/**
 * High Score Service
 * Manages persistent storage of high scores using localStorage
 */

const HIGH_SCORE_KEY = 'tetris3d_highscore';

/**
 * Get the current high score from localStorage
 * @returns The stored high score, or 0 if none exists
 */
export function getHighScore(): number {
  try {
    const stored = localStorage.getItem(HIGH_SCORE_KEY);
    if (stored === null) {
      return 0;
    }
    const score = parseInt(stored, 10);
    return isNaN(score) ? 0 : score;
  } catch (error) {
    console.warn('Failed to read high score from localStorage:', error);
    return 0;
  }
}

/**
 * Save a new high score if it's higher than the current one
 * @param score The score to potentially save as high score
 * @returns true if the score was saved (new high score), false otherwise
 */
export function saveHighScore(score: number): boolean {
  try {
    const currentHigh = getHighScore();
    if (score > currentHigh) {
      localStorage.setItem(HIGH_SCORE_KEY, score.toString());
      return true;
    }
    return false;
  } catch (error) {
    console.warn('Failed to save high score to localStorage:', error);
    return false;
  }
}

/**
 * Reset the high score to 0
 * Useful for testing or user preference
 */
export function resetHighScore(): void {
  try {
    localStorage.removeItem(HIGH_SCORE_KEY);
  } catch (error) {
    console.warn('Failed to reset high score:', error);
  }
}
