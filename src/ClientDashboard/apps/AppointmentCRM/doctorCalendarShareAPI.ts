import type { DoctorCalendarShare } from "./doctorCalendarShareStore";

const BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

async function request<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!BASE) return null;
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return (json.data ?? json) as T;
  } catch {
    return null;
  }
}

/** Sync share + snapshot to backend so doctors can open on any device. */
export async function syncDoctorShareToServer(
  share: DoctorCalendarShare,
  password: string,
): Promise<boolean> {
  const result = await request<{ ok: boolean }>("/appointment-crm/doctor-calendar-shares", {
    method: "POST",
    body: JSON.stringify({ ...share, password }),
  });
  return Boolean(result);
}

export async function fetchDoctorShareFromServer(
  shareToken: string,
): Promise<DoctorCalendarShare | null> {
  return request<DoctorCalendarShare>(`/appointment-crm/doctor-calendar-shares/${shareToken}`);
}

export async function sendDoctorShareEmailViaApi(
  share: DoctorCalendarShare,
  password: string,
): Promise<boolean> {
  const result = await request<{ sent: boolean }>("/appointment-crm/doctor-calendar-shares/send-email", {
    method: "POST",
    body: JSON.stringify({
      shareToken: share.shareToken,
      doctorEmail: share.doctorEmail,
      staffName: share.staffName,
      companyName: share.companyName,
      calendarUrl: `${window.location.origin}/doctor-calendar/${share.shareToken}`,
      password,
    }),
  });
  return Boolean(result?.sent);
}

export async function validateDoctorLoginViaApi(
  shareToken: string,
  email: string,
  password: string,
): Promise<DoctorCalendarShare | null> {
  return request<DoctorCalendarShare>("/appointment-crm/doctor-calendar-shares/login", {
    method: "POST",
    body: JSON.stringify({ shareToken, email, password }),
  });
}
