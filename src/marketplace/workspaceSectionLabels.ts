// Lets an app rename its own side-menu sections at runtime — e.g. Appointment
// CRM's "Bookings" reads "Sessions" for a gym and "Interviews" for a recruiter
// — without the workspace shell importing (and un-lazy-loading) app code.

import { useEffect, useState } from "react";

const EVENT = "shivai:workspace-section-labels-changed";
const labelsByApp = new Map<string, Record<string, string>>();

export function setWorkspaceSectionLabels(appId: string, labels: Record<string, string> | null): void {
  if (labels) labelsByApp.set(appId, labels);
  else labelsByApp.delete(appId);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function useWorkspaceSectionLabels(appId: string | undefined): Record<string, string> | undefined {
  const [, force] = useState(0);
  useEffect(() => {
    const sync = () => force((n) => n + 1);
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  return appId ? labelsByApp.get(appId) : undefined;
}
