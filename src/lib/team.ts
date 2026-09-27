import { getCurrentMembership } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";

export async function getCurrentOrganizationMembers() {
  const membership = await getCurrentMembership();

  if (!membership) {
    return null;
  }

  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId: membership.organizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  return {
    organization: membership.organization,
    currentRole: membership.role,
    members,
  };
}