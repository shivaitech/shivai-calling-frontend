/** Doctor personal calendar — lightweight helpers only. No redirects, no manifest injection. */

export const DOCTOR_PWA_TOKEN_KEY = "shivai_doctor_pwa_token";
export const DOCTOR_PWA_SESSION_KEY = "shivai_doctor_pwa_session";
export const DOCTOR_CALENDAR_LAUNCHER_PATH = "/doctor-calendar";

export function getDoctorPWAToken(): string | null {
  try {
    return localStorage.getItem(DOCTOR_PWA_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveDoctorPWAToken(shareToken: string): void {
  try {
    localStorage.setItem(DOCTOR_PWA_TOKEN_KEY, shareToken);
  } catch {
    /* ignore */
  }
}

export function clearDoctorPWAToken(): void {
  try {
    localStorage.removeItem(DOCTOR_PWA_TOKEN_KEY);
    localStorage.removeItem(DOCTOR_PWA_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function getDoctorCalendarPath(shareToken: string): string {
  return `/doctor-calendar/${shareToken}`;
}

export function getDoctorPWASessionToken(): string | null {
  try {
    const raw = localStorage.getItem(DOCTOR_PWA_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { shareToken?: string };
    return parsed.shareToken ?? null;
  } catch {
    return null;
  }
}

export function saveDoctorPWASession(shareToken: string): void {
  try {
    localStorage.setItem(
      DOCTOR_PWA_SESSION_KEY,
      JSON.stringify({ shareToken, at: Date.now() }),
    );
    saveDoctorPWAToken(shareToken);
  } catch {
    /* ignore */
  }
}

export function clearDoctorPWASession(): void {
  try {
    localStorage.removeItem(DOCTOR_PWA_SESSION_KEY);
  } catch {
    /* ignore */
  }
}
