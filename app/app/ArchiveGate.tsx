"use client";

import { Archive } from "@/components/Archive";
import { RequireUser } from "@/components/RequireUser";

export function ArchiveGate() {
  return (
    <RequireUser
      render={(user) => (
        <Archive key={user.uid} email={user.email ?? ""} uid={user.uid} />
      )}
    />
  );
}
