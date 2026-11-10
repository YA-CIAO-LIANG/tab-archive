import { getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from "firebase/firestore";
import { firebaseConfig } from "./firebase-config";

let cached: { auth: Auth; db: Firestore } | null = null;

/** Browser-only Firebase handles, or null before the project is configured. */
export function firebase(): { auth: Auth; db: Firestore } | null {
  if (typeof window === "undefined" || !firebaseConfig.apiKey) return null;
  if (cached) return cached;
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const auth = getAuth(app);
  auth.languageCode = "zh-TW";
  let db: Firestore;
  try {
    // Cached on the device: reloads and other tabs read locally first.
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      ignoreUndefinedProperties: true,
    });
  } catch {
    db = getFirestore(app);
  }
  cached = { auth, db };
  return cached;
}
