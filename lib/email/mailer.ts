/**
 * Minimal pluggable mailer. Sends via SMTP when EMAIL_SERVER_* env vars are
 * set; otherwise logs the message so auth flows stay testable without a real
 * provider (see docs/DECISIONS.md D-014). Swap the "send" branch for a real
 * provider (Resend, SES, ...) when one is configured for production.
 */

type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function isEmailConfigured(): boolean {
  return Boolean(process.env.EMAIL_SERVER_HOST && process.env.EMAIL_FROM);
}

export async function sendMail(input: SendMailInput): Promise<void> {
  if (!isEmailConfigured()) {
    console.log(
      `[mailer] EMAIL_SERVER_HOST not configured — logging instead of sending.\n` +
        `  To: ${input.to}\n  Subject: ${input.subject}\n  ${input.text}`,
    );
    return;
  }

  const nodemailer = await import("nodemailer");
  const transport = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: Number(process.env.EMAIL_SERVER_PORT ?? 587),
    auth: process.env.EMAIL_SERVER_USER
      ? { user: process.env.EMAIL_SERVER_USER, pass: process.env.EMAIL_SERVER_PASSWORD }
      : undefined,
  });

  await transport.sendMail({
    to: input.to,
    from: process.env.EMAIL_FROM,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });
}

export function verificationEmail(url: string) {
  return {
    subject: "Verifikasi email Success IELTS Anda",
    text: `Verifikasi email Anda dengan membuka tautan ini: ${url}\n\nTautan berlaku 24 jam.`,
    html: `<p>Verifikasi email Anda dengan membuka tautan berikut:</p><p><a href="${url}">${url}</a></p><p>Tautan berlaku 24 jam.</p>`,
  };
}

export function passwordResetEmail(url: string) {
  return {
    subject: "Reset password Success IELTS",
    text: `Reset password Anda dengan membuka tautan ini: ${url}\n\nTautan berlaku 1 jam. Abaikan email ini jika Anda tidak meminta reset password.`,
    html: `<p>Reset password Anda dengan membuka tautan berikut:</p><p><a href="${url}">${url}</a></p><p>Tautan berlaku 1 jam. Abaikan email ini jika Anda tidak meminta reset password.</p>`,
  };
}

/** Sent opportunistically on a dashboard visit (see D-039 — no background
 * scheduler exists yet), at most once per ~20h per user. */
export function dailyReminderEmail(dashboardUrl: string) {
  return {
    subject: "Waktunya belajar di Success IELTS",
    text: `Jangan lupa luangkan waktu belajar hari ini. Buka dashboard Anda: ${dashboardUrl}\n\nAnda bisa mematikan pengingat ini kapan saja di Profil & Langganan.`,
    html: `<p>Jangan lupa luangkan waktu belajar hari ini.</p><p><a href="${dashboardUrl}">Buka dashboard Anda</a></p><p>Anda bisa mematikan pengingat ini kapan saja di Profil &amp; Langganan.</p>`,
  };
}
