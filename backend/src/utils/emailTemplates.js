/**
 * FitOrbit HTML email templates
 * Table-based layout with inline styles for broad client support.
 */

const BRAND = {
  primary: '#2563eb',
  primaryDark: '#1d4ed8',
  primaryLight: '#eff6ff',
  text: '#0f172a',
  textMuted: '#64748b',
  border: '#e2e8f0',
  surface: '#f8fafc',
  success: '#059669',
  warning: '#d97706',
};

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const stripHtml = (html) =>
  String(html || '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const renderButton = (href, label) => `
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin: 28px auto 8px;">
    <tr>
      <td align="center" style="border-radius: 10px; background: linear-gradient(135deg, ${BRAND.primaryDark} 0%, ${BRAND.primary} 100%);">
        <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer"
          style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 10px; letter-spacing: 0.02em;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>
`;

const renderInfoBox = (rows) => {
  const rowHtml = rows
    .map(
      ({ label, value }) => `
      <tr>
        <td style="padding: 10px 0; font-size: 13px; font-weight: 600; color: ${BRAND.textMuted}; width: 38%; vertical-align: top;">
          ${escapeHtml(label)}
        </td>
        <td style="padding: 10px 0; font-size: 14px; font-weight: 600; color: ${BRAND.text}; vertical-align: top;">
          ${value}
        </td>
      </tr>`
    )
    .join('');

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"
      style="margin: 24px 0; background: ${BRAND.surface}; border: 1px solid ${BRAND.border}; border-radius: 12px;">
      <tr>
        <td style="padding: 20px 22px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            ${rowHtml}
          </table>
        </td>
      </tr>
    </table>
  `;
};

const renderNotice = (text, tone = 'info') => {
  const styles = {
    info: { bg: BRAND.primaryLight, border: '#bfdbfe', color: '#1e40af' },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e' },
    success: { bg: '#ecfdf5', border: '#a7f3d0', color: '#065f46' },
  };
  const theme = styles[tone] || styles.info;

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 20px 0 0;">
      <tr>
        <td style="padding: 14px 16px; background: ${theme.bg}; border: 1px solid ${theme.border}; border-radius: 10px; font-size: 13px; line-height: 1.6; color: ${theme.color};">
          ${text}
        </td>
      </tr>
    </table>
  `;
};

const renderLayout = ({
  preheader = '',
  eyebrow = '',
  title,
  greeting = '',
  bodyHtml = '',
  ctaHref = '',
  ctaLabel = '',
  secondaryHtml = '',
  footerNote = '',
}) => {
  const preheaderBlock = preheader
    ? `<div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">${escapeHtml(preheader)}</div>`
    : '';

  const greetingBlock = greeting
    ? `<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${BRAND.text};">Hi ${escapeHtml(greeting)},</p>`
    : '';

  const ctaBlock = ctaHref && ctaLabel ? renderButton(ctaHref, ctaLabel) : '';

  const footerNoteBlock = footerNote
    ? `<p style="margin: 16px 0 0; font-size: 12px; line-height: 1.6; color: ${BRAND.textMuted};">${footerNote}</p>`
    : '';

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(title)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; width: 100% !important; background-color: ${BRAND.surface}; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  ${preheaderBlock}
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: ${BRAND.surface};">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 0 0 24px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td align="center" style="padding: 14px 22px; background: linear-gradient(135deg, ${BRAND.primaryDark} 0%, ${BRAND.primary} 100%); border-radius: 14px;">
                    <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; font-family: 'Segoe UI', Arial, Helvetica, sans-serif;">
                      🏋️ FitOrbit
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background: #ffffff; border: 1px solid ${BRAND.border}; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(15, 23, 42, 0.06);">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="height: 4px; background: linear-gradient(90deg, ${BRAND.primaryDark}, ${BRAND.primary}, #3b82f6); font-size: 0; line-height: 0;">&nbsp;</td>
                </tr>
                <tr>
                  <td style="padding: 36px 32px 32px; font-family: 'Segoe UI', Arial, Helvetica, sans-serif;">
                    ${
                      eyebrow
                        ? `<p style="margin: 0 0 10px; font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: ${BRAND.primary};">${escapeHtml(eyebrow)}</p>`
                        : ''
                    }
                    <h1 style="margin: 0 0 20px; font-size: 26px; line-height: 1.25; font-weight: 800; color: ${BRAND.text}; letter-spacing: -0.02em;">
                      ${escapeHtml(title)}
                    </h1>
                    ${greetingBlock}
                    <div style="font-size: 15px; line-height: 1.7; color: ${BRAND.textMuted};">
                      ${bodyHtml}
                    </div>
                    ${ctaBlock}
                    ${secondaryHtml}
                    ${footerNoteBlock}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 28px 12px 8px; font-family: 'Segoe UI', Arial, Helvetica, sans-serif;">
              <p style="margin: 0 0 8px; font-size: 13px; color: ${BRAND.textMuted};">
                Your fitness journey, guided by experts.
              </p>
              <p style="margin: 0 0 8px; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} FitOrbit. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #cbd5e1;">
                This is an automated message — please do not reply directly to this email.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { html, text: stripHtml(html) };
};

const verificationEmail = ({ verificationUrl }) =>
  renderLayout({
    preheader: 'Confirm your email to activate your FitOrbit account.',
    eyebrow: 'Account security',
    title: 'Verify your email address',
    bodyHtml: `
      <p style="margin: 0 0 12px;">Thanks for signing up for FitOrbit. Please confirm your email address to secure your account and unlock full access to the platform.</p>
      <p style="margin: 0;">This link expires in <strong style="color: ${BRAND.text};">24 hours</strong>.</p>
    `,
    ctaHref: verificationUrl,
    ctaLabel: 'Verify my email',
    secondaryHtml: renderNotice(
      `If the button doesn't work, copy and paste this link into your browser:<br/>
      <a href="${escapeHtml(verificationUrl)}" style="color: ${BRAND.primary}; word-break: break-all;">${escapeHtml(verificationUrl)}</a>`,
      'info'
    ),
    footerNote: "If you didn't create a FitOrbit account, you can safely ignore this email.",
  });

const passwordResetEmail = ({ resetUrl }) =>
  renderLayout({
    preheader: 'Reset your FitOrbit password securely.',
    eyebrow: 'Password reset',
    title: 'Reset your password',
    bodyHtml: `
      <p style="margin: 0 0 12px;">We received a request to reset the password for your FitOrbit account. Click the button below to choose a new password.</p>
      <p style="margin: 0;">This link expires in <strong style="color: ${BRAND.text};">1 hour</strong> for your security.</p>
    `,
    ctaHref: resetUrl,
    ctaLabel: 'Reset password',
    secondaryHtml:
      renderNotice(
        `If you didn't request a password reset, no action is needed — your password will stay the same.`,
        'warning'
      ) +
      renderNotice(
        `Fallback link:<br/>
        <a href="${escapeHtml(resetUrl)}" style="color: ${BRAND.primary}; word-break: break-all;">${escapeHtml(resetUrl)}</a>`,
        'info'
      ),
  });

const welcomeEmail = ({ firstName, dashboardUrl }) =>
  renderLayout({
    preheader: 'Welcome to FitOrbit — your fitness journey starts here.',
    eyebrow: 'Welcome aboard',
    title: 'Welcome to FitOrbit!',
    greeting: firstName,
    bodyHtml: `
      <p style="margin: 0 0 12px;">We're thrilled to have you on board. FitOrbit connects you with certified trainers and nutritionists to help you reach your goals.</p>
      <p style="margin: 0;">Complete your profile, explore experts, and book your first session when you're ready.</p>
    `,
    ctaHref: dashboardUrl,
    ctaLabel: 'Go to my dashboard',
    secondaryHtml: renderInfoBox([
      { label: 'Complete profile', value: 'Add your goals and preferences' },
      { label: 'Find experts', value: 'Browse trainers & nutritionists' },
      { label: 'Track progress', value: 'Log workouts and nutrition' },
    ]),
  });

const appointmentConfirmationEmail = ({ appointmentDate, duration, status, sessionType, topic }) => {
  const statusLabel = String(status || 'scheduled')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());

  return renderLayout({
    preheader: `Your FitOrbit session is scheduled for ${appointmentDate}.`,
    eyebrow: 'Appointment update',
    title: 'Session booking received',
    bodyHtml: `
      <p style="margin: 0 0 12px;">Your appointment request has been submitted successfully. You'll receive another update once your expert confirms the session.</p>
      <p style="margin: 0;">Review the details below and manage your bookings anytime from your dashboard.</p>
    `,
    secondaryHtml: renderInfoBox([
      { label: 'Date & time', value: `<span style="color: ${BRAND.text};">${escapeHtml(appointmentDate)}</span>` },
      { label: 'Duration', value: `${escapeHtml(duration)} minutes` },
      { label: 'Status', value: `<span style="color: ${BRAND.primary};">${escapeHtml(statusLabel)}</span>` },
      ...(sessionType ? [{ label: 'Session type', value: escapeHtml(sessionType) }] : []),
      ...(topic ? [{ label: 'Topic', value: escapeHtml(topic) }] : []),
    ]) + renderNotice('Thank you for choosing FitOrbit. We look forward to supporting your fitness journey!', 'success'),
  });
};

module.exports = {
  escapeHtml,
  stripHtml,
  verificationEmail,
  passwordResetEmail,
  welcomeEmail,
  appointmentConfirmationEmail,
};
