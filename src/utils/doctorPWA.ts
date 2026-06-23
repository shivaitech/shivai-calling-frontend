/** Doctor personal calendar PWA — opens only their calendar, not the main ShivAI app. */

export const DOCTOR_PWA_TOKEN_KEY = "shivai_doctor_pwa_token";
export const DOCTOR_PWA_SESSION_KEY = "shivai_doctor_pwa_session";
export const DOCTOR_CALENDAR_LAUNCHER_PATH = "/doctor-calendar";

export function isStandaloneDisplay(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    // iOS Safari "Add to Home Screen"
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

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

/** Call when a doctor opens their invite link so the launcher remembers them after install. */
export function rememberDoctorForPWA(shareToken: string): void {
  saveDoctorPWAToken(shareToken);
}

export function clearDoctorPWAToken(): void {
  try {
    localStorage.removeItem(DOCTOR_PWA_TOKEN_KEY);
    localStorage.removeItem(DOCTOR_PWA_SESSION_KEY);
  } catch {
    /* ignore */
  }
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

export function getDoctorCalendarPath(shareToken: string): string {
  return `/doctor-calendar/${shareToken}`;
}

/** Redirect installed doctor PWA away from main app entry URLs. */
export function maybeRedirectDoctorPWA(): void {
  const token = getDoctorPWAToken();
  if (!token || !isStandaloneDisplay()) return;

  const path = window.location.pathname;
  const calendarPath = getDoctorCalendarPath(token);
  const isDoctorRoute =
    path === DOCTOR_CALENDAR_LAUNCHER_PATH || path.startsWith(`${DOCTOR_CALENDAR_LAUNCHER_PATH}/`);

  if (isDoctorRoute) return;

  const mainAppEntries = ["/", "/landing", "/dashboard"];
  if (mainAppEntries.includes(path) || path.startsWith("/app/")) {
    window.location.replace(calendarPath);
  }
}

let manifestBlobUrl: string | null = null;

export function applyDoctorManifest(params: {
  shareToken: string;
  staffName: string;
  companyName: string;
}): void {
  const { shareToken, staffName, companyName } = params;
  const startUrl = `${DOCTOR_CALENDAR_LAUNCHER_PATH}?utm_source=doctor_pwa`;
  const manifest = {
    name: `${staffName} — Appointments`,
    short_name: staffName.split(/\s+/)[0] || "Calendar",
    description: `${companyName} appointment calendar`,
    start_url: startUrl,
    scope: DOCTOR_CALENDAR_LAUNCHER_PATH,
    id: getDoctorCalendarPath(shareToken),
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#7c3aed",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/Shivai1.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };

  if (manifestBlobUrl) URL.revokeObjectURL(manifestBlobUrl);
  manifestBlobUrl = URL.createObjectURL(
    new Blob([JSON.stringify(manifest)], { type: "application/manifest+json" }),
  );

  let link = document.querySelector('link[rel="manifest"]');
  if (!link) {
    link = document.createElement("link");
    document.head.appendChild(link);
  }
  link.setAttribute("rel", "manifest");
  link.setAttribute("href", manifestBlobUrl);

  let appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
  if (!appleCapable) {
    appleCapable = document.createElement("meta");
    appleCapable.setAttribute("name", "apple-mobile-web-app-capable");
    document.head.appendChild(appleCapable);
  }
  appleCapable.setAttribute("content", "yes");

  let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (!appleTitle) {
    appleTitle = document.createElement("meta");
    appleTitle.setAttribute("name", "apple-mobile-web-app-title");
    document.head.appendChild(appleTitle);
  }
  appleTitle.setAttribute("content", staffName.split(/\s+/)[0] || "Calendar");
}
