/**
 * Increment Calculator Service
 * Calculates salary increment percentages based on performance history.
 */

function round2(val) {
  return Math.round(val * 100) / 100;
}

/**
 * Calculate increment percentage based on average score and zone history.
 * @param {number} avgScore - Average KPI score over the evaluation period (0-100)
 * @param {string} zone - Current zone
 * @param {Array<{ zone: string }>} history - Array of recent monthly performance records (last 3 months)
 * @param {number} maxIncrementPct - Maximum allowed increment percentage (default: 10)
 * @returns {{ increment_pct: number, fast_track: boolean, reason: string }}
 */
function calculateIncrement(avgScore, zone, history = [], maxIncrementPct = 10) {
  // Check if any of the last 3 months had a red zone
  const recentHistory = history.slice(0, 3);
  const hasRed = recentHistory.some(r => r.zone === 'red');

  if (hasRed) {
    return {
      increment_pct: 0,
      fast_track: false,
      reason: 'Red zone in recent history - no increment eligible',
    };
  }

  // Base increment from score
  let increment_pct = (avgScore / 100) * maxIncrementPct;

  // Fast track: 2 or more green months in last 3
  const greenCount = recentHistory.filter(r => r.zone === 'green').length;
  let fast_track = false;

  if (greenCount >= 2) {
    fast_track = true;
    increment_pct *= 1.25;
  }

  // Cap at maximum
  increment_pct = Math.min(increment_pct, maxIncrementPct);
  increment_pct = round2(increment_pct);

  let reason = `Based on average score of ${avgScore}`;
  if (fast_track) {
    reason += ' with fast-track multiplier (2+ green months)';
  }

  return { increment_pct, fast_track, reason };
}

/**
 * Calculate the increment amount in currency.
 * @param {number} salary_fixed - Fixed salary component
 * @param {number} increment_pct - Increment percentage
 * @returns {number} Increment amount
 */
function calculateIncrementAmount(salary_fixed, increment_pct) {
  return round2(salary_fixed * (increment_pct / 100));
}

module.exports = { calculateIncrement, calculateIncrementAmount };
