import { useCallback, useEffect, useState } from "react";
import { getActiveIndustryId } from "./industryConfig";
import { TICKETS, CUSTOMERS, TicketStatus } from "./mockData";
import { getStaff } from "./staffStore";

/**
 * ── Staff work store ─────────────────────────────────────────────────────────
 *
 * Ties human staff members to the work they own: their assigned tickets and
 * customers, their task list, and any local ticket actions they take (replies,
 * and closing a ticket with a reason + proof of completion).
 *
 * Base TICKETS/CUSTOMERS are static mock consts, so per-ticket state that staff
 * change (status, replies, close reason/proof) lives here as an override map
 * keyed by ticket id and merged at read time. Assignments are seeded once
 * (round-robin across staff) then editable; everything persists in localStorage
 * per industry. When the backend lands this becomes API read/write.
 */

export interface TicketReply {
  id: string;
  by: string;        // staff member name
  message: string;
  at: string;        // ISO
}

export interface TicketProof {
  name: string;      // file name
  dataUrl?: string;  // small inline preview (images) — optional
  note?: string;     // link or text proof
}

export interface TicketOverride {
  status?: TicketStatus;
  replies?: TicketReply[];
  closeReason?: string;
  proofs?: TicketProof[];
  closedBy?: string;
  closedAt?: string;
}

export interface StaffTask {
  id: string;
  staffId: string;
  title: string;
  ticketId?: string;   // optional link to a ticket
  due: string;         // free text e.g. "Today 4pm"
  done: boolean;
}

interface StaffWorkData {
  ticketAssign: Record<string, string[]>;   // staffId → ticketIds
  customerAssign: Record<string, string[]>; // staffId → customerIds
  tasks: StaffTask[];
  overrides: Record<string, TicketOverride>; // ticketId → override
  agentAssignees: Record<string, string[]>;  // aiAgentId → staffIds (human handlers)
}

const WORK_EVENT = "shivai:supportcrm-staffwork-changed";
const workKey = () => `shivai_supportcrm_staffwork_${getActiveIndustryId()}`;

// ── Seed + persistence ────────────────────────────────────────────────────────

function seed(): StaffWorkData {
  const staff = getStaff();
  const ticketAssign: Record<string, string[]> = {};
  const customerAssign: Record<string, string[]> = {};
  const tasks: StaffTask[] = [];

  if (staff.length) {
    // Round-robin the mock tickets & customers across staff.
    TICKETS.forEach((t, i) => {
      const s = staff[i % staff.length];
      (ticketAssign[s.id] ??= []).push(t.id);
    });
    CUSTOMERS.slice(0, Math.min(CUSTOMERS.length, staff.length * 3)).forEach((c, i) => {
      const s = staff[i % staff.length];
      (customerAssign[s.id] ??= []).push(c.id);
    });
    // A couple of starter tasks per active member.
    const starter = ["Follow up on refund escalation", "Verify KYC documents", "Call back for plan renewal"];
    staff.forEach((s, si) => {
      if (s.status === "on-leave") return;
      const t = ticketAssign[s.id]?.[0];
      tasks.push({
        id: `task-${s.id}-0`,
        staffId: s.id,
        title: starter[si % starter.length],
        ticketId: t,
        due: si % 2 === 0 ? "Today, 4:00 PM" : "Tomorrow, 11:00 AM",
        done: false,
      });
    });
  }

  return { ticketAssign, customerAssign, tasks, overrides: {}, agentAssignees: {} };
}

function read(): StaffWorkData {
  try {
    const raw = localStorage.getItem(workKey());
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return {
          ticketAssign: parsed.ticketAssign || {},
          customerAssign: parsed.customerAssign || {},
          tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
          overrides: parsed.overrides || {},
          agentAssignees: parsed.agentAssignees || {},
        };
      }
    }
  } catch {
    /* ignore */
  }
  const seeded = seed();
  try {
    localStorage.setItem(workKey(), JSON.stringify(seeded));
  } catch {
    /* ignore */
  }
  return seeded;
}

function write(data: StaffWorkData) {
  try {
    localStorage.setItem(workKey(), JSON.stringify(data));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(WORK_EVENT));
}

// ── Derived ─────────────────────────────────────────────────────────────────

/** A ticket merged with any local override the staff applied. */
export function mergedTicket(ticketId: string, overrides: Record<string, TicketOverride>) {
  const base = TICKETS.find((t) => t.id === ticketId);
  if (!base) return null;
  const o = overrides[ticketId] || {};
  return {
    ...base,
    status: o.status ?? base.status,
    replies: o.replies ?? [],
    closeReason: o.closeReason,
    proofs: o.proofs ?? [],
    closedBy: o.closedBy,
    closedAt: o.closedAt,
  };
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useStaffWork() {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(WORK_EVENT, sync);
    window.addEventListener("shivai:industry-changed", sync);
    window.addEventListener("shivai:supportcrm-staff-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(WORK_EVENT, sync);
      window.removeEventListener("shivai:industry-changed", sync);
      window.removeEventListener("shivai:supportcrm-staff-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const data = read();

  const ticketsForStaff = useCallback(
    (staffId: string) =>
      (data.ticketAssign[staffId] || [])
        .map((id) => mergedTicket(id, data.overrides))
        .filter(Boolean) as NonNullable<ReturnType<typeof mergedTicket>>[],
    [data]
  );

  const customersForStaff = useCallback(
    (staffId: string) =>
      (data.customerAssign[staffId] || [])
        .map((id) => CUSTOMERS.find((c) => c.id === id))
        .filter(Boolean),
    [data]
  );

  const tasksForStaff = useCallback(
    (staffId: string) => data.tasks.filter((t) => t.staffId === staffId),
    [data]
  );

  const addReply = useCallback((ticketId: string, by: string, message: string) => {
    const d = read();
    const o = d.overrides[ticketId] || {};
    const reply: TicketReply = {
      id: `rep-${Date.now()}`,
      by,
      message: message.trim(),
      at: new Date().toISOString(),
    };
    d.overrides[ticketId] = { ...o, replies: [...(o.replies || []), reply], status: o.status ?? "in-progress" };
    write(d);
  }, []);

  const closeTicket = useCallback(
    (ticketId: string, by: string, reason: string, proofs: TicketProof[]) => {
      const d = read();
      const o = d.overrides[ticketId] || {};
      d.overrides[ticketId] = {
        ...o,
        status: "closed",
        closeReason: reason.trim(),
        proofs,
        closedBy: by,
        closedAt: new Date().toISOString(),
      };
      write(d);
    },
    []
  );

  const reopenTicket = useCallback((ticketId: string) => {
    const d = read();
    const o = d.overrides[ticketId] || {};
    d.overrides[ticketId] = { ...o, status: "in-progress", closeReason: undefined, closedBy: undefined, closedAt: undefined };
    write(d);
  }, []);

  const addTask = useCallback((staffId: string, title: string, due: string, ticketId?: string) => {
    const d = read();
    d.tasks.push({ id: `task-${Date.now()}`, staffId, title: title.trim(), due: due.trim(), ticketId, done: false });
    write(d);
  }, []);

  const toggleTask = useCallback((taskId: string) => {
    const d = read();
    d.tasks = d.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
    write(d);
  }, []);

  const removeTask = useCallback((taskId: string) => {
    const d = read();
    d.tasks = d.tasks.filter((t) => t.id !== taskId);
    write(d);
  }, []);

  const assigneesForAgent = useCallback(
    (agentId: string): string[] => data.agentAssignees[agentId] || [],
    [data]
  );

  const addAssignee = useCallback((agentId: string, staffId: string) => {
    const d = read();
    const cur = new Set(d.agentAssignees[agentId] || []);
    cur.add(staffId);
    d.agentAssignees = { ...d.agentAssignees, [agentId]: [...cur] };
    write(d);
  }, []);

  const removeAssignee = useCallback((agentId: string, staffId: string) => {
    const d = read();
    d.agentAssignees = {
      ...d.agentAssignees,
      [agentId]: (d.agentAssignees[agentId] || []).filter((id) => id !== staffId),
    };
    write(d);
  }, []);

  return {
    ticketsForStaff,
    customersForStaff,
    tasksForStaff,
    addReply,
    closeTicket,
    reopenTicket,
    addTask,
    toggleTask,
    removeTask,
    assigneesForAgent,
    addAssignee,
    removeAssignee,
  };
}
