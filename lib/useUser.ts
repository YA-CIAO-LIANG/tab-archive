"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { useEffect, useState } from "react";
import { firebase } from "./firebase";

/** The signed-in user; undefined while Firebase is still deciding. */
export function useUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    const fb = firebase();
    if (!fb) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUser(null);
      return;
    }
    return onAuthStateChanged(fb.auth, setUser);
  }, []);
  return user;
}
