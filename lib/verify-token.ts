import { createRemoteJWKSet, jwtVerify } from "jose";
import { firebaseConfig } from "./firebase-config";

const keys = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  ),
);

/** The user id in a Firebase ID token, or null if it isn't valid. */
export async function verifyIdToken(
  token: string | null,
): Promise<string | null> {
  const project = firebaseConfig.projectId;
  if (!token || !project) return null;
  try {
    const { payload } = await jwtVerify(token, keys, {
      issuer: `https://securetoken.google.com/${project}`,
      audience: project,
    });
    return typeof payload.sub === "string" && payload.sub ? payload.sub : null;
  } catch {
    return null;
  }
}
