/**
 * Incentive Calculator Service
 * Calculates department-specific incentives based on performance metrics and zone.
 */

const ZONE_MULTIPLIERS = {
  green: 1.2,
  yellow: 1.0,
  red: 0.5,
};

function round2(val) {
  return Math.round(val * 100) / 100;
}

function getMultiplier(zone) {
  return ZONE_MULTIPLIERS[zone] || 1.0;
}

function calculateSalesIncentive(metrics, score, zone) {
  const achievement = metrics.revenue_target
    ? metrics.revenue_generated / metrics.revenue_target
    : 0;

  let incentive_pct;
  if (achievement < 0.8) {
    incentive_pct = 0.02;
  } else if (achievement <= 1.0) {
    incentive_pct = 0.05;
  } else {
    incentive_pct = 0.08;
  }

  const multiplier = getMultiplier(zone);
  const base_amount = round2((metrics.revenue_generated || 0) * incentive_pct);
  const final_amount = round2(base_amount * multiplier);

  return {
    base_amount,
    multiplier,
    final_amount,
    details: {
      achievement: round2(achievement),
      incentive_pct,
      revenue_generated: metrics.revenue_generated || 0,
      revenue_target: metrics.revenue_target || 0,
    },
  };
}

function calculateFarmOpsIncentive(metrics, score, zone) {
  let base = 0;
  const details = {};

  const inputCost = metrics.input_cost || 0;
  const budgetCost = metrics.budget_cost || 0;
  const yieldAchieved = metrics.yield_achieved || 0;
  const targetYield = metrics.target_yield || 0;

  // Cost savings bonus: if budget_cost < input_cost * 0.9 (>10% savings)
  const savingsThreshold = inputCost * 0.9;
  if (budgetCost < savingsThreshold && inputCost > 0) {
    const savings = inputCost - budgetCost;
    const savingsBonus = round2(savings * 0.05);
    base += savingsBonus;
    details.cost_savings = savingsBonus;
  }

  // Yield bonus: if yield > 110% of target
  const yieldThreshold = targetYield * 1.1;
  if (yieldAchieved > yieldThreshold) {
    const extraYield = yieldAchieved - yieldThreshold;
    const yieldBonus = round2(extraYield * 50);
    base += yieldBonus;
    details.yield_bonus = yieldBonus;
  }

  const multiplier = getMultiplier(zone);
  const base_amount = round2(base);
  const final_amount = round2(base_amount * multiplier);

  return {
    base_amount,
    multiplier,
    final_amount,
    details,
  };
}

function calculateTechnicalIncentive(metrics, score, zone) {
  let base = (metrics.installations_completed || 0) * 500;
  const details = {
    installation_bonus: (metrics.installations_completed || 0) * 500,
  };

  // Fast resolution bonus
  const avgTime = metrics.avg_resolution_time || 0;
  const targetTime = metrics.target_resolution_time || 0;
  if (targetTime > 0 && avgTime < targetTime * 0.8) {
    base += 2000;
    details.fast_resolution_bonus = 2000;
  }

  // CSAT bonus
  if ((metrics.csat_score || 0) > 90) {
    base += 3000;
    details.csat_bonus = 3000;
  }

  const multiplier = getMultiplier(zone);
  const base_amount = round2(base);
  const final_amount = round2(base_amount * multiplier);

  return {
    base_amount,
    multiplier,
    final_amount,
    details,
  };
}

function calculateMarketingIncentive(metrics, score, zone) {
  let base = (metrics.leads_generated || 0) * 20;
  const details = {
    lead_bonus: (metrics.leads_generated || 0) * 20,
  };

  // ROI bonus
  if ((metrics.roi || 0) > 200) {
    base += 5000;
    details.roi_bonus = 5000;
  }

  const multiplier = getMultiplier(zone);
  const base_amount = round2(base);
  const final_amount = round2(base_amount * multiplier);

  return {
    base_amount,
    multiplier,
    final_amount,
    details,
  };
}

const departmentCalcs = {
  SALES: calculateSalesIncentive,
  FARM_OPS: calculateFarmOpsIncentive,
  TECHNICAL: calculateTechnicalIncentive,
  MARKETING: calculateMarketingIncentive,
};

/**
 * Calculate incentive for a given department.
 * @param {string} department - One of SALES, FARM_OPS, TECHNICAL, MARKETING
 * @param {object} metrics - Department-specific metric values
 * @param {number} score - KPI score (0-100)
 * @param {string} zone - Performance zone ('green', 'yellow', 'red')
 * @returns {{ base_amount: number, multiplier: number, final_amount: number, details: object }}
 */
function calculateIncentive(department, metrics, score, zone) {
  const calc = departmentCalcs[department];
  if (!calc) {
    throw new Error(`Unknown department: ${department}. Valid departments: ${Object.keys(departmentCalcs).join(', ')}`);
  }
  return calc(metrics, score, zone);
}

module.exports = { calculateIncentive };
