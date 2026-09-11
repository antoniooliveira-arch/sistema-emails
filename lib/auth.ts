import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const ADMIN_COOKIE = "admin_token";

export function isAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const a = createHash("sha256").update(password).digest("hex");
  const b = createHash("sha256").update(expected).digest("hex");
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export function adminToken(): string {
  const secret = process.env.ADMIN_PASSWORD ?? "sistema-emails";
  return createHash("sha256").update(`admin:${secret}`).digest("hex");
}

export async function requireAdmin(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === adminToken();
}