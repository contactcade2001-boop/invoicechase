import "server-only";
import { Resend } from "resend";

let _client: Resend | null = null;

function getResend(apiKey: string): Resend {
  if (!_client) _client = new Resend(apiKey);
  return _client;
}

export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export type EmailDeliveryResult = {
  delivered: boolean;
  via: "resend" | "console";
};

export async function sendEmail(
  msg: EmailMessage,
): Promise<EmailDeliveryResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    console.log(
      `[email:console] to=${msg.to} subject=${JSON.stringify(msg.subject)}\n${msg.text}`,
    );
    return { delivered: false, via: "console" };
  }

  await getResend(apiKey).emails.send({
    from,
    to: msg.to,
    subject: msg.subject,
    text: msg.text,
    html: msg.html ?? msg.text,
  });
  return { delivered: true, via: "resend" };
}
