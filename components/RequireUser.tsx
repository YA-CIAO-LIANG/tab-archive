"use client";

import type { User } from "firebase/auth";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { useUser } from "@/lib/useUser";

/** Renders for a signed-in user; everyone else goes to the login page. */
export function RequireUser({ render }: { render: (user: User) => ReactNode }) {
  const user = useUser();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    if (user === null) {
      const next = path + window.location.search;
      router.replace(`/login?next=${encodeURIComponent(next)}`);
    }
  }, [user, router, path]);
  if (!user) {
    return (
      <main className="wrap">
        <p className="lede" style={{ paddingTop: 140, textAlign: "center" }}>
          開館中…
        </p>
      </main>
    );
  }
  return render(user);
}
