import type { Role } from "@/generated/prisma/client";

export function canManageTeam(role: Role) {
  return role === "OWNER" || role === "ADMIN";
}