import AcceptInvitationButton from "./AcceptInvitationButton";
import Link from "next/link";
import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";

import "./invite.css";

type InvitationPageProps = {
  params: Promise<{
    token: string;
  }>;
};

type InvitationResponse = {
  invitation?: {
    email: string;
    role: string;
    expiresAt: string;
    organization: {
      name: string;
    };
    invitedBy: {
      name: string | null;
      email: string;
    };
  };
  error?: string;
};

async function getInvitation(
  token: string
): Promise<InvitationResponse> {
  const baseUrl =
    process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const response = await fetch(
    `${baseUrl}/api/invitations/${token}`,
    {
      cache: "no-store",
    }
  );

  return response.json();
}

export default async function InvitationPage({
  params,
}: InvitationPageProps) {
  const { token } = await params;

  const [result, session] = await Promise.all([
    getInvitation(token),
    getServerSession(authOptions),
  ]);

  if (result.error || !result.invitation) {
    return (
      <main className="invite-page">
        <section className="invite-card">
          <div className="invite-eyebrow">
            INVITATION / INVALID
          </div>

          <h1>Invitation unavailable.</h1>

          <p>
            {result.error ??
              "This invitation could not be found."}
          </p>

          <Link href="/login" className="invite-button">
            Go to login →
          </Link>
        </section>
      </main>
    );
  }

  const { invitation } = result;

  const isLoggedIn = Boolean(session?.user?.email);

  const isCorrectUser =
    isLoggedIn &&
    session?.user?.email?.toLowerCase().trim() ===
      invitation.email.toLowerCase().trim();

  const loginUrl = `/login?callbackUrl=${encodeURIComponent(
    `/invite/${token}`
  )}`;

  return (
    <main className="invite-page">
      <section className="invite-card">
        <div className="invite-topline">
          <span>SAAS PLATFORM</span>
          <span>TEAM ACCESS</span>
        </div>

        <div className="invite-eyebrow">
          YOU'VE BEEN INVITED
        </div>

        <h1>
          Join{" "}
          <span>{invitation.organization.name}</span>
        </h1>

        <p className="invite-description">
          {invitation.invitedBy.name ??
            invitation.invitedBy.email}{" "}
          invited you to join their organization.
        </p>

        <div className="invite-details">
          <div>
            <span>INVITED EMAIL</span>
            <strong>{invitation.email}</strong>
          </div>

          <div>
            <span>ROLE</span>
            <strong>{invitation.role}</strong>
          </div>

          <div>
            <span>EXPIRES</span>
            <strong>
              {new Date(
                invitation.expiresAt
              ).toLocaleDateString()}
            </strong>
          </div>
        </div>

        <div className="invite-actions">
          {!isLoggedIn && (
            <Link href={loginUrl} className="invite-button">
              Log in to accept →
            </Link>
          )}

         {isLoggedIn && isCorrectUser && (
  <AcceptInvitationButton token={token} />
)}

          {isLoggedIn && !isCorrectUser && (
            <div className="invite-warning">
              <strong>Wrong account</strong>
              <p>
                This invitation was sent to{" "}
                {invitation.email}. You're currently
                logged in with {session?.user?.email}.
              </p>

              <Link
                href="/api/auth/signout"
                className="invite-secondary"
              >
                Sign out
              </Link>
            </div>
          )}

          {!isLoggedIn && (
            <Link
              href={`/signup?callbackUrl=${encodeURIComponent(
                `/invite/${token}`
              )}`}
              className="invite-secondary"
            >
              Create an account
            </Link>
          )}
        </div>

        <p className="invite-note">
          You must use the invited email address to join
          this organization.
        </p>
      </section>
    </main>
  );
}