import nodemailer from "nodemailer";

import { env } from "../config/env.js";

/** Messages "sent" while NODE_ENV=test, so tests can read the links. */
export const outbox = [];

let transport;
function getTransport() {
  if (!env.smtpConfigured) return null;
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return transport;
}

/**
 * Send an email. With no SMTP settings the message is printed to the server console instead,
 * clearly labelled, so sign-up and password reset can be tried locally without a mail account.
 */
export async function sendMail({ to, subject, text, html }) {
  const t = getTransport();
  if (!t) {
    if (env.isTest) outbox.push({ to, subject, text });
    else {
      console.log(`\n[mail:console] SMTP is not configured, so this email was not sent.\n  To: ${to}\n  Subject: ${subject}\n  ${text.split("\n").join("\n  ")}\n`);
    }
    return { delivered: false };
  }
  await t.sendMail({ from: env.MAIL_FROM, to, subject, text, html });
  return { delivered: true };
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

function layout(heading, bodyHtml, buttonLabel, url) {
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:24px;color:#1b3a2d">
<h2 style="margin:0 0 12px">${esc(heading)}</h2>${bodyHtml}
<p style="margin:24px 0"><a href="${esc(url)}" style="background:#1f5a40;color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;display:inline-block">${esc(buttonLabel)}</a></p>
<p style="font-size:13px;color:#5b6b62">If the button doesn't work, paste this link into your browser:<br>${esc(url)}</p></div>`;
}

export function verificationEmail(name, url) {
  return {
    subject: "Verify your Resortify email",
    text: `Hi ${name},\n\nConfirm your email to activate your Resortify account (link valid for 24 hours):\n${url}\n\nIf you didn't sign up, ignore this email.`,
    html: layout("Confirm your email", `<p>Hi ${esc(name)}, confirm your email to activate your Resortify account. The link works for 24 hours.</p>`, "Verify email", url),
  };
}

export function resetEmail(name, url) {
  return {
    subject: "Reset your Resortify password",
    text: `Hi ${name},\n\nUse this link to choose a new password (valid for 1 hour, one use):\n${url}\n\nIf you didn't ask for this, you can ignore this email.`,
    html: layout("Reset your password", `<p>Hi ${esc(name)}, use the button below to choose a new password. The link works for 1 hour and only once.</p>`, "Choose a new password", url),
  };
}
