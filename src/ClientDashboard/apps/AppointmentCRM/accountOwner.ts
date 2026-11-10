// The account owner — the person who signed up — can take bookings too: a
// solo practitioner, or a founder who wants the AI agent to manage their own
// calendar. They are NOT a Main Tenant Staff record (staff are delegated
// logins, and the owner's email is already taken by their own account), so
// the Schedule API is keyed directly on the owner's own user id instead.

import { useAuth } from "../../../contexts/AuthContext";
import { getActingAccount, isStaffUser } from "../../../services/actingContext";

export interface AccountOwner {
  /** The owner's user id — used as `staff_id` on the Schedule/Appointments APIs. */
  id: string;
  name: string;
  email?: string;
  /** True when the signed-in user IS the owner (vs. a staff login acting for them). */
  isSelf: boolean;
}

interface StoredUser {
  id?: string;
  fullName?: string;
  email?: string;
}

function resolveOwner(user: StoredUser | null | undefined): AccountOwner | null {
  // A staff login acts on behalf of the owner (X-Acting-Tenant-Id), so the
  // owner is that acting tenant — we just don't know their name client-side.
  if (isStaffUser()) {
    const tenantId = getActingAccount()?.tenantId;
    return tenantId ? { id: tenantId, name: "Account owner", isSelf: false } : null;
  }
  if (!user?.id) return null;
  return {
    id: String(user.id),
    name: user.fullName?.trim() || "You",
    email: user.email || undefined,
    isSelf: true,
  };
}

/** Non-React read for stores (e.g. filling a missing schedule staff summary). */
export function readAccountOwner(): AccountOwner | null {
  try {
    return resolveOwner(JSON.parse(localStorage.getItem("auth_user") || "null") as StoredUser | null);
  } catch {
    return resolveOwner(null);
  }
}

export function useAccountOwner(): AccountOwner | null {
  const { user } = useAuth();
  return resolveOwner(user);
}
