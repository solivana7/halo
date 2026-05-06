// Resend wrapper for ops emails (digest, alerts) — TO Natasha only.
// Per memory feedback_no_customer_emails.md: NEVER email customers/leads.
// Per memory feedback_ops_emails_auto_send.md: ops digests TO Natasha can auto-send.

import { Resend } from "resend";

const DIGEST_TO = process.env.HALO_DIGEST_TO ?? "natasha@solivana.com";
const FROM = process.env.MAIL_FROM ?? "Halo <noreply@solivana.com>";

export async function sendDigest({ subject, html }: { subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not set");
  const resend = new Resend(apiKey);
  return resend.emails.send({
    from: FROM,
    to: DIGEST_TO,
    subject,
    html,
    headers: { "X-Halo-Type": "weekly-digest" },
  });
}
