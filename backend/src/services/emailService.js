/**
 * ============================================
 * EMAIL SERVICE
 * ============================================
 * Handles email sending functionality
 */

const nodemailer = require('nodemailer');
const env = require('../config/environment');
const {
  verificationEmail,
  passwordResetEmail,
  welcomeEmail,
  appointmentConfirmationEmail,
} = require('../utils/emailTemplates');
const { formatDateTime } = require('../utils/dateFormat');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
      },
    });
  }

  async sendEmail(to, subject, html, text) {
    try {
      const mailOptions = {
        from: `"FitOrbit" <${env.EMAIL_FROM}>`,
        to,
        subject,
        html,
        text: text || undefined,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Email send failed:', error.message);
      return false;
    }
  }

  async sendVerificationEmail(email, token) {
    const verificationUrl = `${env.FRONTEND_URL}/verify-email/${token}`;
    const { html, text } = verificationEmail({ verificationUrl });

    return this.sendEmail(
      email,
      'Verify your FitOrbit email address',
      html,
      text
    );
  }

  async sendPasswordResetEmail(email, token) {
    const resetUrl = `${env.FRONTEND_URL}/reset-password/${token}`;
    const { html, text } = passwordResetEmail({ resetUrl });

    return this.sendEmail(
      email,
      'Reset your FitOrbit password',
      html,
      text
    );
  }

  async sendWelcomeEmail(firstName, email) {
    const dashboardUrl = `${env.FRONTEND_URL}/login`;
    const { html, text } = welcomeEmail({
      firstName: firstName || 'there',
      dashboardUrl,
    });

    return this.sendEmail(
      email,
      'Welcome to FitOrbit — let’s get started',
      html,
      text
    );
  }

  async sendAppointmentConfirmation(email, appointment) {
    const appointmentDate = formatDateTime(appointment.appointmentDate);

    const { html, text } = appointmentConfirmationEmail({
      appointmentDate,
      duration: appointment.duration,
      status: appointment.status,
      sessionType: appointment.sessionType,
      topic: appointment.topic,
    });

    return this.sendEmail(
      email,
      'FitOrbit — your session booking is confirmed',
      html,
      text
    );
  }
}

module.exports = new EmailService();
