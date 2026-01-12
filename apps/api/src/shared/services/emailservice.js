/**
 * Email Service
 * ==============
 * Sends emails using nodemailer with Gmail SMTP
 * 
 * @module shared/services/emailservice
 */

const nodemailer = require('nodemailer');

// Email configuration from environment
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT) || 587;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const BUSINESS_NAME = process.env.BUSINESS_NAME || 'Jalaram Traders';

// Create transporter
let transporter = null;

const getTransporter = () => {
    if (!transporter && EMAIL_USER && EMAIL_PASS) {
        transporter = nodemailer.createTransport({
            host: EMAIL_HOST,
            port: EMAIL_PORT,
            secure: EMAIL_PORT === 465,
            auth: {
                user: EMAIL_USER,
                pass: EMAIL_PASS,
            },
        });
    }
    return transporter;
};

/**
 * Send email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} [options.html] - HTML content (optional)
 * @returns {Promise<Object>} Send result
 */
const sendEmail = async ({ to, subject, text, html }) => {
    const transport = getTransporter();

    if (!transport) {
        console.warn('[EMAIL] Email not configured. Set EMAIL_USER and EMAIL_PASS in .env');
        return { success: false, error: 'Email not configured' };
    }

    try {
        const info = await transport.sendMail({
            from: `"${BUSINESS_NAME}" <${EMAIL_USER}>`,
            to,
            subject,
            text,
            html: html || text,
        });

        console.log(`[EMAIL] Sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[EMAIL] Failed to send to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
};

/**
 * Send OTP email for password reset
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP
 * @param {number} expiryMinutes - OTP expiry in minutes
 * @returns {Promise<Object>} Send result
 */
const sendOTPEmail = async (email, otp, expiryMinutes = 10) => {
    const subject = `Password Reset OTP - ${BUSINESS_NAME}`;

    const text = `
Your OTP for password reset is: ${otp}

This code will expire in ${expiryMinutes} minutes.

If you did not request this, please ignore this email.

- ${BUSINESS_NAME} Team
    `.trim();

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #16a34a;">Password Reset</h2>
            <p>Your OTP for password reset is:</p>
            <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1f2937;">${otp}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
                This code will expire in <strong>${expiryMinutes} minutes</strong>.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
                If you did not request this, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px;">
                - ${BUSINESS_NAME} Team
            </p>
        </div>
    `;

    return sendEmail({ to: email, subject, text, html });
};

module.exports = {
    sendEmail,
    sendOTPEmail,
};
