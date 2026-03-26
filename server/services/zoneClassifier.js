/**
 * Zone Classifier Service
 * Classifies performance scores into traffic-light zones and tracks status.
 */

/**
 * Classify a KPI score into a performance zone.
 * @param {number} score - KPI score (0-100)
 * @returns {'green'|'yellow'|'red'}
 */
function classifyZone(score) {
  if (score >= 80) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

/**
 * Update performance status based on current zone and historical data.
 * @param {string} currentZone - Current zone ('green', 'yellow', 'red')
 * @param {Array<{ zone: string }>} previousHistory - Array of past performance records, most recent first
 * @returns {{ consecutive_red_count: number, status: string }}
 */
function updatePerformanceStatus(currentZone, previousHistory = []) {
  // Build the sequence: current zone followed by previous zones (most recent first)
  const zoneSequence = [currentZone, ...previousHistory.map(r => r.zone)];

  // Count consecutive reds from the start (most recent)
  let consecutive_red_count = 0;
  for (const zone of zoneSequence) {
    if (zone === 'red') {
      consecutive_red_count++;
    } else {
      break;
    }
  }

  let status = 'active';

  if (consecutive_red_count >= 3) {
    status = 'layoff_recommended';
  } else if (consecutive_red_count >= 2) {
    status = 'at_risk';
  } else if (currentZone !== 'red' && previousHistory.length > 0 && previousHistory[0].zone === 'red') {
    // Was red last period, now recovered
    status = 'recovered';
  }

  return { consecutive_red_count, status };
}

module.exports = { classifyZone, updatePerformanceStatus };
