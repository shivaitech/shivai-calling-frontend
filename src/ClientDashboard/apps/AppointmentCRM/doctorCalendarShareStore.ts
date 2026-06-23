import type { Booking } from "./mockData";
import type { StaffMember } from "./staffStore";
import type { StaffOfflineBlock } from "./offlineBlocksStore";
import type { StaffAvailability, StaffLeave } from "./availabilityStore";
import { readBookings } from "./bookingsStore";
import { readOfflineBlocks } from "./offlineBlocksStore";
import { getAvailabilityForStaff, readLeaves } from "./availabilityStore";
import { getStaffById } from "./staffStore";
import { readBranches } from "./branchesStore";
import { readSetup } from "./setupStore";

export interface DoctorCalendarSnapshot {
  staff: StaffMember;
  branchId: string;
  branchName: string;
  companyName: string;
  bookings: Booking[];
  offlineBlocks: StaffOfflineBlock[];
  availability: StaffAvailability;
  leaves: StaffLeave[];
  syncedAt: string;
}

export interface DoctorCalendarShare {
  shareToken: string;
  staffId: string;
  staffName: string;
  doctorEmail: string;
  passwordHash: string;
  branchId: string;
  companyName: string;
  createdAt: string;
  lastSentAt?: string;
  snapshot: DoctorCalendarSnapshot;
}

import {
  clearDoctorPWASession,
  saveDoctorPWASession,
} from "../../../utils/doctorPWA";

const SHARES_KEY = "shivai_appointmentcrm_doctor_shares";
const SHARE_EVENT = "shivai:doctor-calendar-share-changed";
const SESSION_PREFIX = "shivai_doctor_calendar_session:";

function makeToken(): string {
  return `dc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function readDoctorShares(): DoctorCalendarShare[] {
  try {
    const raw = localStorage.getItem(SHARES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDoctorShares(list: DoctorCalendarShare[]): void {
  try {
    localStorage.setItem(SHARES_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent(SHARE_EVENT));
  } catch {
    /* ignore */
  }
}

export function getShareForStaff(staffId: string): DoctorCalendarShare | undefined {
  return readDoctorShares().find((s) => s.staffId === staffId);
}

export function getShareByToken(token: string): DoctorCalendarShare | undefined {
  return readDoctorShares().find((s) => s.shareToken === token);
}

/** Refresh stored snapshot from live clinic data (same device / localStorage). */
export function refreshShareSnapshot(shareToken: string): DoctorCalendarShare | null {
  const share = getShareByToken(shareToken);
  if (!share) return null;
  const snapshot = buildSnapshotForStaff(share.staffId);
  if (!snapshot) return share;
  const updated: DoctorCalendarShare = { ...share, snapshot };
  const list = readDoctorShares().map((s) => (s.shareToken === shareToken ? updated : s));
  writeDoctorShares(list);
  return updated;
}

export function buildSnapshotForStaff(staffId: string): DoctorCalendarSnapshot | null {
  const staff = getStaffById(staffId);
  if (!staff) return null;
  const branch = readBranches().find((b) => b.id === staff.branchId);
  const setup = readSetup();
  return {
    staff,
    branchId: staff.branchId,
    branchName: branch?.name ?? "Branch",
    companyName: setup.companyName || "Your clinic",
    bookings: readBookings().filter((b) => b.staffId === staffId),
    offlineBlocks: readOfflineBlocks().filter((b) => b.staffId === staffId),
    availability: getAvailabilityForStaff(staffId),
    leaves: readLeaves().filter((l) => l.staffId === staffId),
    syncedAt: new Date().toISOString(),
  };
}

export function getDoctorCalendarUrl(shareToken: string): string {
  return `${window.location.origin}/doctor-calendar/${shareToken}`;
}

export async function createOrUpdateDoctorShare(params: {
  staffId: string;
  staffName: string;
  doctorEmail: string;
  password: string;
  branchId: string;
}): Promise<DoctorCalendarShare> {
  const snapshot = buildSnapshotForStaff(params.staffId);
  if (!snapshot) throw new Error("Staff not found");

  const passwordHash = await hashPassword(params.password);
  const setup = readSetup();
  const existing = getShareForStaff(params.staffId);
  const share: DoctorCalendarShare = {
    shareToken: existing?.shareToken ?? makeToken(),
    staffId: params.staffId,
    staffName: params.staffName,
    doctorEmail: params.doctorEmail.trim().toLowerCase(),
    passwordHash,
    branchId: params.branchId,
    companyName: setup.companyName || "Your organization",
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    snapshot,
  };

  const list = readDoctorShares().filter((s) => s.staffId !== params.staffId);
  writeDoctorShares([...list, share]);
  return share;
}

export async function validateDoctorLogin(
  shareToken: string,
  email: string,
  password: string,
): Promise<DoctorCalendarShare | null> {
  const share = getShareByToken(shareToken);
  if (!share) return null;
  if (share.doctorEmail !== email.trim().toLowerCase()) return null;
  const hash = await hashPassword(password);
  if (hash !== share.passwordHash) return null;
  return share;
}

export function setDoctorSession(shareToken: string): void {
  try {
    sessionStorage.setItem(`${SESSION_PREFIX}${shareToken}`, JSON.stringify({ at: Date.now() }));
    saveDoctorPWASession(shareToken);
  } catch {
    /* ignore */
  }
}

export function hasDoctorSession(shareToken: string): boolean {
  try {
    if (sessionStorage.getItem(`${SESSION_PREFIX}${shareToken}`)) return true;
    const raw = localStorage.getItem("shivai_doctor_pwa_session");
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { shareToken?: string };
    return parsed.shareToken === shareToken;
  } catch {
    return false;
  }
}

export function clearDoctorSession(shareToken: string): void {
  try {
    sessionStorage.removeItem(`${SESSION_PREFIX}${shareToken}`);
    clearDoctorPWASession();
  } catch {
    /* ignore */
  }
}

export function markShareSent(shareToken: string): void {
  const list = readDoctorShares().map((s) =>
    s.shareToken === shareToken ? { ...s, lastSentAt: new Date().toISOString() } : s,
  );
  writeDoctorShares(list);
}

export function buildInviteEmailBody(share: DoctorCalendarShare, password: string): string {
  const url = getDoctorCalendarUrl(share.shareToken);
  return `Hello ${share.staffName},

Your personal appointment calendar is ready. Open the link on your phone, tablet, or laptop.

Calendar link:
${url}

Login email:
${share.doctorEmail}

Password:
${password}

Install as an app (recommended):
• iPhone/iPad: Open in Safari → Share → Add to Home Screen
• Android: Open in Chrome → Menu (⋮) → Install app / Add to Home screen
• Laptop: Chrome address bar → Install icon

— ${share.companyName}`;
}

export function openInviteEmailClient(share: DoctorCalendarShare, password: string): void {
  const subject = encodeURIComponent(`${share.companyName} — Your appointment calendar`);
  const body = encodeURIComponent(buildInviteEmailBody(share, password));
  window.location.href = `mailto:${share.doctorEmail}?subject=${subject}&body=${body}`;
}
