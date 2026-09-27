import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInvitationEmail({
  to,
  organizationName,
  inviterName,
  invitationUrl,
}: {
  to: string;
  organizationName: string;
  inviterName: string;
  invitationUrl: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const { data, error } = await resend.emails.send({
    from: "SaaS Platform <onboarding@resend.dev>",
    to: [to],
    subject: `You're invited to join ${organizationName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #111;">
        <p style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #777;">
          SaaS Platform
        </p>

        <h1 style="font-size: 32px; margin-bottom: 16px;">
          You're invited.
        </h1>

        <p style="font-size: 16px; line-height: 1.6;">
          ${inviterName} has invited you to join
          <strong>${organizationName}</strong>.
        </p>

        <p style="margin: 32px 0;">
          <a
            href="${invitationUrl}"
            style="
              display: inline-block;
              background: #111;
              color: #fff;
              padding: 14px 22px;
              text-decoration: none;
              font-weight: 600;
            "
          >
            Accept invitation →
          </a>
        </p>

        <p style="font-size: 13px; color: #777; line-height: 1.5;">
          This invitation link will expire in 7 days.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}