"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Organization = {
  id: string;
  name: string;
};

type OrganizationSwitcherProps = {
  organizations: Organization[];
  activeOrganizationId: string;
};

export default function OrganizationSwitcher({
  organizations,
  activeOrganizationId,
}: OrganizationSwitcherProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);

  async function handleSwitch(organizationId: string) {
    if (
      organizationId === activeOrganizationId ||
      switching
    ) {
      return;
    }

    setSwitching(true);

    try {
      const response = await fetch(
        "/api/organizations/switch",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            organizationId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Unable to switch organization.");
      }

      router.refresh();
    } catch (error) {
      console.error("Organization switch failed:", error);
    } finally {
      setSwitching(false);
    }
  }

  const activeOrganization =
    organizations.find(
      (organization) =>
        organization.id === activeOrganizationId
    );

  return (
    <div className="relative">
      <label
        htmlFor="organization-switcher"
        className="block text-[10px] font-semibold tracking-[0.18em] text-black/40"
      >
        WORKSPACE
      </label>

      <select
        id="organization-switcher"
        value={activeOrganization?.id ?? ""}
        disabled={switching}
        onChange={(event) =>
          handleSwitch(event.target.value)
        }
        className="mt-2 min-w-[220px] border border-black/15 bg-white px-3 py-2 text-sm font-medium outline-none transition hover:border-black/40 focus:border-black disabled:cursor-wait disabled:opacity-50"
      >
        {organizations.map((organization) => (
          <option
            key={organization.id}
            value={organization.id}
          >
            {organization.name}
          </option>
        ))}
      </select>
    </div>
  );
}