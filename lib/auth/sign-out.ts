"use server";

import { signOut } from "@/auth";

/**
 * `redirect: false` — cookie clearing happens here regardless, but
 * navigation is left to the caller (see SignOutButton), which does a hard
 * reload rather than a soft client-router push. See SignOutButton for why
 * (D-035).
 */
export async function signOutAction() {
  await signOut({ redirect: false });
}
