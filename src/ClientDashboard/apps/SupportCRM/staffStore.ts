import { useCallback, useEffect, useState } from "react";
import { getActiveIndustryId, getActivePreset } from "./industryConfig";
import { getDepartments } from "./departmentsStore";

/**
 * ── Staff store ──────────────────────────────────────────────────────────────
 *
 * Human team members who work the support desk alongside the AI agents, plus a
 * weekly shift schedule (who covers which day). Seeded from the active industry
 * preset the first time, then user-editable and persisted in localStorage (per
 * industry, so switching verticals gives a sensible starter roster). When the
 * backend lands this becomes an API read/write.
 */

export type StaffStatus = "active" | "on-leave" | "inactive";

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  departmentId: string | null;
  email: string;
  phone: string;
  status: StaffStatus;
  hue: number;
}

/** Weekly shift: staffId → set of weekday indices (0=Mon … 6=Sun) they work. */
export type ShiftMap = Record<string, number[]>;

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const STAFF_STATUS_META: Record<
  StaffStatus,
  { label: string; dot: string; bg: string; text: string }
> = {
  active: {
    label: "Active",
    dot: "bg-green-500",
    bg: "bg-green-50 dark:bg-green-900/20 border-green-200/70 dark:border-green-800/50",
    text: "text-green-700 dark:text-green-400",
  },
  "on-leave": {
    label: "On leave",
    dot: "bg-amber-500",
    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200/70 dark:border-amber-800/50",
    text: "text-amber-700 dark:text-amber-400",
  },
  inactive: {
    label: "Inactive",
    dot: "bg-slate-400",
    bg: "bg-slate-100 dark:bg-slate-800 border-slate-200/70 dark:border-slate-700/50",
    text: "text-slate-600 dark:text-slate-400",
  },
};

const STAFF_EVENT = "shivai:supportcrm-staff-changed";
const staffKey = () => `shivai_supportcrm_staff_${getActiveIndustryId()}`;
const shiftKey = () => `shivai_supportcrm_staff_shifts_${getActiveIndustryId()}`;

const HUES = [210, 150, 280, 25, 330, 190, 95, 250];

// ── Seed + persistence ────────────────────────────────────────────────────────

function seedStaff(): StaffMember[] {
  const preset = getActivePreset();
  const depts = getDepartments();
  const roleWord = preset.terms.agent || "Agent";
  // A small, believable starter roster spread across the first departments.
  const names = [
    "Priya Sharma",
    "Rahul Verma",
    "Aisha Khan",
    "Vikram Nair",
  ];
  return names.map((name, i) => ({
    id: `staff-${preset.id}-${i}`,
    name,
    role: i === 0 ? `Lead ${roleWord}` : `${roleWord}`,
    departmentId: depts.length ? depts[i % depts.length].id : null,
    email: `${name.split(" ")[0].toLowerCase()}@company.com`,
    phone: `+91 98${String(76543210 + i).slice(0, 8)}`,
    status: (i === 3 ? "on-leave" : "active") as StaffStatus,
    hue: HUES[i % HUES.length],
  }));
}

export function getStaff(): StaffMember[] {
  try {
    const raw = localStorage.getItem(staffKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  const seeded = seedStaff();
  try {
    localStorage.setItem(staffKey(), JSON.stringify(seeded));
  } catch {
    /* ignore */
  }
  return seeded;
}

function writeStaff(list: StaffMember[]) {
  try {
    localStorage.setItem(staffKey(), JSON.stringify(list));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(STAFF_EVENT));
}

function seedShifts(staff: StaffMember[]): ShiftMap {
  const map: ShiftMap = {};
  staff.forEach((s, i) => {
    // Default Mon–Fri coverage, with a rotating weekend person.
    const base = [0, 1, 2, 3, 4];
    if (i % 2 === 1) base.push(5); // Sat for every other member
    map[s.id] = s.status === "on-leave" ? [] : base;
  });
  return map;
}

export function getShifts(): ShiftMap {
  try {
    const raw = localStorage.getItem(shiftKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    /* ignore */
  }
  const seeded = seedShifts(getStaff());
  try {
    localStorage.setItem(shiftKey(), JSON.stringify(seeded));
  } catch {
    /* ignore */
  }
  return seeded;
}

function writeShifts(map: ShiftMap) {
  try {
    localStorage.setItem(shiftKey(), JSON.stringify(map));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(STAFF_EVENT));
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStaff() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(STAFF_EVENT, sync);
    window.addEventListener("shivai:industry-changed", sync); // re-seed on industry switch
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(STAFF_EVENT, sync);
      window.removeEventListener("shivai:industry-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const staff = getStaff();
  const shifts = getShifts();

  const addStaff = useCallback(
    (input: Omit<StaffMember, "id" | "hue">) => {
      const list = getStaff();
      const member: StaffMember = {
        ...input,
        name: input.name.trim(),
        role: input.role.trim(),
        email: input.email.trim(),
        phone: input.phone.trim(),
        id: `staff-${Date.now()}`,
        hue: HUES[list.length % HUES.length],
      };
      writeStaff([...list, member]);
      // Give a new member a default Mon–Fri shift.
      writeShifts({ ...getShifts(), [member.id]: [0, 1, 2, 3, 4] });
      return member;
    },
    []
  );

  const updateStaff = useCallback((id: string, patch: Partial<StaffMember>) => {
    writeStaff(getStaff().map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }, []);

  const removeStaff = useCallback((id: string) => {
    writeStaff(getStaff().filter((s) => s.id !== id));
    const map = getShifts();
    if (map[id]) {
      delete map[id];
      writeShifts(map);
    }
  }, []);

  const toggleShift = useCallback((staffId: string, day: number) => {
    const map = getShifts();
    const cur = new Set(map[staffId] || []);
    if (cur.has(day)) cur.delete(day);
    else cur.add(day);
    writeShifts({ ...map, [staffId]: [...cur].sort((a, b) => a - b) });
  }, []);

  return { staff, shifts, addStaff, updateStaff, removeStaff, toggleShift };
}
