/**
 * Email Service
 * Handles sending performance review and alert emails using nodemailer.
 */

const nodemailer = require('nodemailer');

const ZONE_COLORS = {
  green: '#28a745',
  yellow: '#ffc107',
  red: '#dc3545',
};

class EmailService {
  constructor() {
    if (process.env.NODE_ENV === 'production') {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: parseInt(process.env.SMTP_PORT, 10) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      this.transporter = null;
    }

    this.fromAddress = process.env.SMTP_FROM || 'noreply@kamalafarms.com';
  }

  _buildReviewHtml(employee, review) {
    const zoneColor = ZONE_COLORS[review.zone] || '#6c757d';
    const zoneBadge = `<span style="display:inline-block;padding:4px 12px;border-radius:4px;background:${zoneColor};color:#fff;font-weight:bold;text-transform:uppercase;">${review.zone}</span>`;

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <div style="background:#1a5632;color:#fff;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
    <h1 style="margin:0;font-size:22px;">Monthly Performance Review</h1>
    <p style="margin:5px 0 0;opacity:0.9;">${review.month} ${review.year}</p>
  </div>

  <div style="border:1px solid #e0e0e0;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
    <p>Dear <strong>${employee.name}</strong>,</p>
    <p>Here is your performance review summary for the period:</p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;font-weight:bold;">KPI Score</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;font-size:20px;font-weight:bold;">${review.score}/100</td>
      </tr>
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;font-weight:bold;">Performance Zone</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${zoneBadge}</td>
      </tr>
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee;font-weight:bold;">Incentive Earned</td>
        <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;font-size:18px;">&#8377;${(review.incentive || 0).toLocaleString('en-IN')}</td>
      </tr>
    </table>

    ${review.ai_feedback ? `
    <div style="background:#f8f9fa;border-left:4px solid #1a5632;padding:12px 16px;margin:16px 0;border-radius:0 4px 4px 0;">
      <strong>AI Insights:</strong>
      <p style="margin:8px 0 0;">${review.ai_feedback}</p>
    </div>` : ''}

    ${review.manager_comments ? `
    <div style="background:#fff3cd;border-left:4px solid #ffc107;padding:12px 16px;margin:16px 0;border-radius:0 4px 4px 0;">
      <strong>Manager Comments:</strong>
      <p style="margin:8px 0 0;">${review.manager_comments}</p>
    </div>` : ''}

    <p style="color:#666;font-size:13px;margin-top:24px;">
      This is an automated email from the Kamalafarms Tech Performance Management System.
      Please contact your manager if you have any questions.
    </p>
  </div>
</body>
</html>`;
  }

  _buildAlertHtml(manager, employee, alertType) {
    const isLayoff = alertType === 'layoff_recommended';
    const alertColor = isLayoff ? '#dc3545' : '#ffc107';
    const alertTitle = isLayoff ? 'Layoff Recommendation Alert' : 'At-Risk Employee Alert';
    const alertMessage = isLayoff
      ? `Employee <strong>${employee.name}</strong> (${employee.employee_id}) has been in the red zone for 3 or more consecutive months and is flagged for layoff review.`
      : `Employee <strong>${employee.name}</strong> (${employee.employee_id}) has been in the red zone for 2 consecutive months and is now marked as at-risk.`;

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#333;">
  <div style="background:${alertColor};color:#fff;padding:20px;border-radius:8px 8px 0 0;text-align:center;">
    <h1 style="margin:0;font-size:22px;">${alertTitle}</h1>
  </div>

  <div style="border:1px solid #e0e0e0;border-top:none;padding:20px;border-radius:0 0 8px 8px;">
    <p>Dear <strong>${manager.name}</strong>,</p>
    <p>${alertMessage}</p>

    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Employee</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${employee.name}</td>
      </tr>
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Department</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${employee.department}</td>
      </tr>
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Current Score</td>
        <td style="padding:8px;border-bottom:1px solid #eee;">${employee.current_score || 'N/A'}</td>
      </tr>
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">Status</td>
        <td style="padding:8px;border-bottom:1px solid #eee;color:${alertColor};font-weight:bold;">${alertType === 'layoff_recommended' ? 'Layoff Recommended' : 'At Risk'}</td>
      </tr>
    </table>

    <p><strong>Action Required:</strong> Please review this employee's performance and take appropriate action.</p>

    <p style="color:#666;font-size:13px;margin-top:24px;">
      This is an automated alert from the Kamalafarms Tech Performance Management System.
    </p>
  </div>
</body>
</html>`;
  }

  /**
   * Send a monthly performance review email to an employee.
   * @param {object} employee - { name, email }
   * @param {object} review - { month, year, score, zone, incentive, ai_feedback, manager_comments }
   * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
   */
  async sendReviewEmail(employee, review) {
    const subject = `Monthly Performance Review - ${review.month} ${review.year}`;
    const html = this._buildReviewHtml(employee, review);

    if (process.env.NODE_ENV !== 'production') {
      console.log('--- [DEV] Review Email ---');
      console.log(`To: ${employee.email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Score: ${review.score}, Zone: ${review.zone}, Incentive: ${review.incentive}`);
      console.log('--- End Email ---');
      return { success: true, messageId: `dev-${Date.now()}` };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: employee.email,
        subject,
        html,
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Failed to send review email:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send an alert email to a manager about an at-risk or layoff-recommended employee.
   * @param {object} manager - { name, email }
   * @param {object} employee - { name, email, employee_id, department, current_score }
   * @param {string} alertType - 'at_risk' or 'layoff_recommended'
   * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
   */
  async sendAlertEmail(manager, employee, alertType) {
    const subject = alertType === 'layoff_recommended'
      ? `[URGENT] Layoff Recommendation - ${employee.name}`
      : `[ALERT] At-Risk Employee - ${employee.name}`;

    const html = this._buildAlertHtml(manager, employee, alertType);

    if (process.env.NODE_ENV !== 'production') {
      console.log('--- [DEV] Alert Email ---');
      console.log(`To: ${manager.email}`);
      console.log(`Subject: ${subject}`);
      console.log(`Alert Type: ${alertType}`);
      console.log(`Employee: ${employee.name} (${employee.employee_id})`);
      console.log('--- End Email ---');
      return { success: true, messageId: `dev-${Date.now()}` };
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: manager.email,
        subject,
        html,
      });
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Failed to send alert email:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService;
