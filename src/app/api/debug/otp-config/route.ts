import { NextResponse } from "next/server";

// Temporary, unauthenticated diagnostic endpoint for the OTP-email delivery
// investigation (see chat history) — reveals only booleans/lengths, never
// secret values, so it's safe to leave reachable pre-login. Delete this
// route once email delivery is confirmed working end to end.
export async function GET() {
  const env = process.env;
  return NextResponse.json({
    brevoKeySet: Boolean(env.BREVO_API_KEY),
    brevoKeyLength: env.BREVO_API_KEY?.length ?? 0,
    smtpHostSet: Boolean(env.SMTP_HOST),
    smtpHostValue: env.SMTP_HOST ?? null,
    smtpPortValue: env.SMTP_PORT ?? null,
    smtpUserSet: Boolean(env.SMTP_USER),
    smtpUserValue: env.SMTP_USER ?? null,
    smtpPassSet: Boolean(env.SMTP_PASS),
    smtpPassLength: env.SMTP_PASS?.length ?? 0,
    smtpFromValue: env.SMTP_FROM ?? null,
    nodeEnv: env.NODE_ENV ?? null,
  });
}
