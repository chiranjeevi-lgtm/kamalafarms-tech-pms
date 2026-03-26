/**
 * KPI Calculator Service
 * Calculates department-specific KPI scores for the Agritech Performance Management System.
 */

function safeRatio(numerator, denominator, cap = 1) {
  if (!denominator || denominator === 0) return 0;
  return Math.min(numerator / denominator, cap);
}

function round2(val) {
  return Math.round(val * 100) / 100;
}

function calculateSalesKpi(m) {
  const contactRate = safeRatio(m.leads_contacted, m.leads_assigned) * 100;
  const visitRate = safeRatio(m.site_visits, m.leads_assigned) * 100;
  const conversionRate = safeRatio(m.deals_closed, m.site_visits) * 100;
  const revenueRate = safeRatio(m.revenue_generated, m.revenue_target) * 100;
  const collectionEff = Math.min(m.collection_efficiency || 0, 100);

  const breakdown = {
    contact_rate: round2(0.20 * contactRate),
    visit_rate: round2(0.20 * visitRate),
    conversion_rate: round2(0.25 * conversionRate),
    revenue_achievement: round2(0.25 * revenueRate),
    collection_efficiency: round2(0.10 * collectionEff),
  };

  const score = round2(
    breakdown.contact_rate +
    breakdown.visit_rate +
    breakdown.conversion_rate +
    breakdown.revenue_achievement +
    breakdown.collection_efficiency
  );

  return { score, breakdown };
}

function calculateFarmOpsKpi(m) {
  const yieldRate = safeRatio(m.yield_achieved, m.target_yield) * 100;
  const budgetRate = safeRatio(m.budget_cost, m.input_cost) * 100;
  const harvestEff = Math.min(m.harvest_efficiency || 0, 100);
  const contaminationRate = Math.max(1 - safeRatio(m.contamination_incidents, m.max_contamination, Infinity), 0) * 100;
  const downtimeRate = Math.max(1 - safeRatio(m.downtime_hours, m.max_downtime, Infinity), 0) * 100;

  const breakdown = {
    yield_achievement: round2(0.30 * yieldRate),
    budget_compliance: round2(0.20 * budgetRate),
    harvest_efficiency: round2(0.20 * harvestEff),
    contamination_control: round2(0.15 * contaminationRate),
    downtime_control: round2(0.15 * downtimeRate),
  };

  const score = round2(
    breakdown.yield_achievement +
    breakdown.budget_compliance +
    breakdown.harvest_efficiency +
    breakdown.contamination_control +
    breakdown.downtime_control
  );

  return { score, breakdown };
}

function calculateTechnicalKpi(m) {
  const installRate = safeRatio(m.installations_completed, m.target_installations) * 100;
  const resolutionRate = safeRatio(m.tickets_resolved, m.total_tickets) * 100;
  // For resolution time, faster is better: target_time / actual_time
  const timeRate = safeRatio(m.target_resolution_time, m.avg_resolution_time) * 100;
  const csatScore = Math.min(m.csat_score || 0, 100);
  const systemUptime = Math.min(m.system_uptime || 0, 100);

  const breakdown = {
    installation_completion: round2(0.30 * installRate),
    ticket_resolution: round2(0.20 * resolutionRate),
    resolution_time: round2(0.20 * timeRate),
    csat_score: round2(0.15 * csatScore),
    system_uptime: round2(0.15 * systemUptime),
  };

  const score = round2(
    breakdown.installation_completion +
    breakdown.ticket_resolution +
    breakdown.resolution_time +
    breakdown.csat_score +
    breakdown.system_uptime
  );

  return { score, breakdown };
}

function calculateMarketingKpi(m) {
  const leadGenRate = safeRatio(m.leads_generated, m.target_leads) * 100;
  // For CPL, lower is better: target_cpl / actual_cpl
  const cplRate = safeRatio(m.target_cpl, m.cost_per_lead) * 100;
  const roi = Math.min(m.roi || 0, 100);
  const contentOutput = Math.min(m.content_output || 0, 100);
  const engagementRate = Math.min(m.engagement_rate || 0, 100);

  const breakdown = {
    lead_generation: round2(0.30 * leadGenRate),
    cost_efficiency: round2(0.25 * cplRate),
    roi: round2(0.20 * roi),
    content_output: round2(0.15 * contentOutput),
    engagement_rate: round2(0.10 * engagementRate),
  };

  const score = round2(
    breakdown.lead_generation +
    breakdown.cost_efficiency +
    breakdown.roi +
    breakdown.content_output +
    breakdown.engagement_rate
  );

  return { score, breakdown };
}

const departmentCalculators = {
  SALES: calculateSalesKpi,
  FARM_OPS: calculateFarmOpsKpi,
  TECHNICAL: calculateTechnicalKpi,
  MARKETING: calculateMarketingKpi,
};

/**
 * Calculate KPI score for a given department and metrics.
 * @param {string} department - One of SALES, FARM_OPS, TECHNICAL, MARKETING
 * @param {object} metrics - Department-specific metric values
 * @returns {{ score: number, breakdown: object }}
 */
function calculateKpiScore(department, metrics) {
  const calculator = departmentCalculators[department];
  if (!calculator) {
    throw new Error(`Unknown department: ${department}. Valid departments: ${Object.keys(departmentCalculators).join(', ')}`);
  }
  return calculator(metrics);
}

module.exports = { calculateKpiScore };
