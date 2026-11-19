import nodemailer from "nodemailer";
import {
  SMTP_FROM,
  SMTP_HOST,
  SMTP_PASSWORD,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_USER
} from "../config/constants.js";

const hasSmtpAuth = Boolean(SMTP_USER && SMTP_PASSWORD);
const hasPartialSmtpAuth = Boolean(SMTP_USER) !== Boolean(SMTP_PASSWORD);
const configured = Boolean(SMTP_HOST && SMTP_FROM && !hasPartialSmtpAuth);

const transporter = configured
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      ...(hasSmtpAuth ? { auth: { user: SMTP_USER, pass: SMTP_PASSWORD } } : {})
    })
  : null;

export const mailService = {
  isConfigured() {
    return configured;
  },

  async sendPasswordResetEmail(email, resetUrl) {
    if (!transporter) throw new Error("SMTP is not configured");
    await transporter.sendMail({
      from: SMTP_FROM,
      to: email,
      subject: "Reset your Learn Program password",
      text: `Use this one-time link to reset your password. It expires in 15 minutes:\n\n${resetUrl}\n\nIf you did not request a reset, you can ignore this email.`,
      html: `<p>Use this one-time link to reset your password. It expires in 15 minutes:</p><p><a href="${resetUrl}">Reset password</a></p><p>If you did not request a reset, you can ignore this email.</p>`
    });
  }
};
