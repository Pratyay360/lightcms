import { createTransport } from "nodemailer";
import { env as dynamicEnv } from "$env/dynamic/private";

function getEnv(name: string): string {
  const value = (dynamicEnv as Record<string, string | undefined>)[name] ?? process.env[name];
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

export async function sendMail({
  html,
  to,
  subject,
  text,
}: {
  html?: string;
  to: string;
  subject: string;
  text: string;
}) {
  const mailHost = getEnv("MAIL_HOST");
  const mailPort = Number(getEnv("MAIL_PORT") ?? "587");
  const mailUser = getEnv("MAIL_USER");
  const mailPass = getEnv("MAIL_PASS");
  const mailFrom = getEnv("MAIL_FROM");
  const mailSecureRaw =
    (dynamicEnv as Record<string, string | undefined>).MAIL_SECURE ?? process.env.MAIL_SECURE;
  const secure = mailSecureRaw === "1" || mailSecureRaw === "true";

  if (!Number.isFinite(mailPort)) throw new Error("MAIL_PORT must be a number");

  const transporter = createTransport({
    host: mailHost,
    port: mailPort,
    secure,
    auth: {
      user: mailUser,
      pass: mailPass,
    },
    // Avoid hanging forever on Vercel if SMTP is blocked
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });

  try {
    await transporter.sendMail({
      from: mailFrom,
      to,
      subject,
      text,
      html,
    });
  } catch (error) {
    console.error(`[mail] failed to send to ${to}:`, error);
    throw new Error(`Failed to send email to ${to}`, { cause: error });
  }
}
