import { getServerSession } from "next-auth/next";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      email: session.user.email,
    },
  });

  return user;
}

export async function getCurrentMembership() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  let activeOrganizationId = user.activeOrganizationId;

  // If the user doesn't have an active organization yet,
  // select their first membership and persist it.
  if (!activeOrganizationId) {
    const firstMembership =
      await prisma.organizationMember.findFirst({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          organization: true,
        },
      });

    if (!firstMembership) {
      return null;
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        activeOrganizationId:
          firstMembership.organizationId,
      },
    });

    return firstMembership;
  }

  const activeMembership =
    await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: activeOrganizationId,
        },
      },
      include: {
        organization: true,
      },
    });

  // The previously selected organization may have been
  // removed. Fall back to the user's first membership.
  if (!activeMembership) {
    const fallbackMembership =
      await prisma.organizationMember.findFirst({
        where: {
          userId: user.id,
        },
        orderBy: {
          createdAt: "asc",
        },
        include: {
          organization: true,
        },
      });

    if (!fallbackMembership) {
      return null;
    }

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        activeOrganizationId:
          fallbackMembership.organizationId,
      },
    });

    return fallbackMembership;
  }

  return activeMembership;
}

export async function getCurrentUserOrganizations() {
  const user = await getCurrentUser();

  if (!user) {
    return [];
  }

  return prisma.organizationMember.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      createdAt: "asc",
    },
    include: {
      organization: true,
    },
  });
}