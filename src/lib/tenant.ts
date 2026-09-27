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

  const membership = await prisma.organizationMember.findFirst({
    where: {
      userId: user.id,
    },
    include: {
      organization: true,
    },
  });

  return membership;
}