import nodemailer from "nodemailer";

// Design Ref: §7 — real SMTP send via nodemailer (.env EMAIL_*)
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (transporter) return transporter;
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT ?? 587);
  const user = process.env.EMAIL_SENDER;
  // Gmail app password preferred if provided
  const pass = process.env.EMAIL_PASSWORD ?? process.env.EMAIL_PASS;
  if (!host || !user || !pass) return null;
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return transporter;
}

export async function sendEmail(opts: { to: string; subject: string; text: string; html?: string }): Promise<boolean> {
  const t = getTransporter();
  if (!t) {
    console.log(`[email:skip-no-config] ${opts.subject} -> ${opts.to}`);
    return false;
  }
  try {
    await t.sendMail({
      from: `AI4CEO Portal <${process.env.EMAIL_SENDER}>`,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });
    return true;
  } catch (e) {
    console.error("[email:error]", e);
    return false;
  }
}
