/**
 * AI Insights Service
 * Generates rule-based performance insights for employees.
 */

/**
 * Generate performance insights for an employee.
 * @param {object} employee - Employee record with department info
 * @param {Array<{ score: number, zone: string, breakdown: object, month: string }>} kpiHistory - KPI history, most recent first
 * @param {string} department - One of SALES, FARM_OPS, TECHNICAL, MARKETING
 * @returns {Array<{ type: 'warning'|'suggestion'|'positive', message: string }>}
 */
function generateInsights(employee, kpiHistory, department) {
  const insights = [];

  if (!kpiHistory || kpiHistory.length === 0) {
    insights.push({
      type: 'suggestion',
      message: 'No performance history available yet. Complete your first review cycle to receive personalized insights.',
    });
    return insights;
  }

  // 1. Declining trend: scores decreased for 2+ consecutive months
  checkDecliningTrend(kpiHistory, insights);

  // 2. Weak areas: breakdown components below 50% of their weighted max
  checkWeakAreas(kpiHistory, department, insights);

  // 3. Consistency: all months green
  checkConsistency(kpiHistory, insights);

  // 4. Recovery: improved from red to green
  checkRecovery(kpiHistory, insights);

  // 5. Department-specific insights
  checkDepartmentSpecific(kpiHistory, department, insights);

  // 6. Role change recommendation: 3+ consecutive reds
  checkPersistentUnderperformance(kpiHistory, insights);

  // Return 3-5 insights (trim or pad as needed)
  if (insights.length > 5) {
    return insights.slice(0, 5);
  }

  if (insights.length < 3 && kpiHistory.length > 0) {
    const latest = kpiHistory[0];
    if (latest.score >= 70 && insights.length < 3) {
      insights.push({
        type: 'positive',
        message: `Your current score of ${latest.score} shows solid performance. Keep up the momentum.`,
      });
    }
    if (insights.length < 3) {
      insights.push({
        type: 'suggestion',
        message: 'Continue tracking your KPIs regularly to maintain awareness of your performance trends.',
      });
    }
  }

  return insights.slice(0, 5);
}

function checkDecliningTrend(history, insights) {
  if (history.length < 3) return;

  let decliningCount = 0;
  for (let i = 0; i < history.length - 1; i++) {
    if (history[i].score < history[i + 1].score) {
      decliningCount++;
    } else {
      break;
    }
  }

  if (decliningCount >= 2) {
    const drop = history[history.length - 1].score - history[0].score;
    insights.push({
      type: 'warning',
      message: `Performance has been declining for ${decliningCount + 1} consecutive months. Score dropped by ${Math.abs(drop).toFixed(1)} points. Immediate attention needed to reverse this trend.`,
    });
  }
}

function checkWeakAreas(history, department, insights) {
  if (history.length === 0) return;
  const latest = history[0];
  if (!latest.breakdown) return;

  const weakComponents = [];
  for (const [component, value] of Object.entries(latest.breakdown)) {
    // Consider a component weak if it contributes less than 50% of its potential
    // We compare the actual weighted value against what a perfect score would give
    if (value < getMaxComponentValue(department, component) * 0.5) {
      weakComponents.push(formatComponentName(component));
    }
  }

  if (weakComponents.length > 0) {
    insights.push({
      type: 'suggestion',
      message: `Weak areas identified: ${weakComponents.join(', ')}. Consider targeted training or process improvements in these areas.`,
    });
  }
}

function checkConsistency(history, insights) {
  if (history.length < 3) return;

  const allGreen = history.every(h => h.zone === 'green');
  if (allGreen) {
    insights.push({
      type: 'positive',
      message: `Outstanding consistency! You have maintained green zone performance across all ${history.length} recorded months. This demonstrates reliable excellence.`,
    });
  }
}

function checkRecovery(history, insights) {
  if (history.length < 2) return;

  if (history[0].zone === 'green' && history[1].zone === 'red') {
    insights.push({
      type: 'positive',
      message: 'Excellent recovery! You moved from red zone to green zone this month. Your improvement efforts are paying off.',
    });
  }
}

function checkDepartmentSpecific(history, department, insights) {
  if (history.length === 0) return;
  const latest = history[0];
  if (!latest.breakdown) return;

  switch (department) {
    case 'SALES': {
      // Low conversion: DC/SV < 0.2 maps to conversion_rate being low
      const conversionValue = latest.breakdown.conversion_rate || 0;
      // Max for conversion_rate component is 0.25 * 100 = 25
      if (conversionValue < 5) {
        insights.push({
          type: 'suggestion',
          message: 'Your deal conversion rate is significantly low. Consider enrolling in advanced sales training or reviewing your site visit to deal closure process.',
        });
      }
      break;
    }
    case 'FARM_OPS': {
      const contaminationValue = latest.breakdown.contamination_control || 0;
      if (contaminationValue < 7.5) {
        insights.push({
          type: 'suggestion',
          message: 'High contamination incidents detected. Recommend quality control training and review of handling procedures to reduce contamination rates.',
        });
      }
      break;
    }
    case 'TECHNICAL': {
      const csatValue = latest.breakdown.csat_score || 0;
      if (csatValue < 7.5) {
        insights.push({
          type: 'suggestion',
          message: 'Customer satisfaction scores are below expectations. Consider customer service training and improving communication during support interactions.',
        });
      }
      break;
    }
    case 'MARKETING': {
      const costEfficiency = latest.breakdown.cost_efficiency || 0;
      if (costEfficiency < 12.5) {
        insights.push({
          type: 'suggestion',
          message: 'Cost per lead is higher than target. Suggest optimizing campaign targeting, A/B testing ad creatives, and reviewing channel allocation.',
        });
      }
      break;
    }
  }
}

function checkPersistentUnderperformance(history, insights) {
  if (history.length < 3) return;

  let consecutiveReds = 0;
  for (const h of history) {
    if (h.zone === 'red') {
      consecutiveReds++;
    } else {
      break;
    }
  }

  if (consecutiveReds >= 3) {
    insights.push({
      type: 'warning',
      message: `Performance has been in the red zone for ${consecutiveReds} consecutive months. A role evaluation or reassignment discussion is strongly recommended.`,
    });
  }
}

function getMaxComponentValue(department, component) {
  const maxValues = {
    SALES: {
      contact_rate: 20, visit_rate: 20, conversion_rate: 25,
      revenue_achievement: 25, collection_efficiency: 10,
    },
    FARM_OPS: {
      yield_achievement: 30, budget_compliance: 20, harvest_efficiency: 20,
      contamination_control: 15, downtime_control: 15,
    },
    TECHNICAL: {
      installation_completion: 30, ticket_resolution: 20, resolution_time: 20,
      csat_score: 15, system_uptime: 15,
    },
    MARKETING: {
      lead_generation: 30, cost_efficiency: 25, roi: 20,
      content_output: 15, engagement_rate: 10,
    },
  };

  return (maxValues[department] && maxValues[department][component]) || 15;
}

function formatComponentName(name) {
  return name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

module.exports = { generateInsights };
