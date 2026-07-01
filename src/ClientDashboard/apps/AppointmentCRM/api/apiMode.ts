/** When true, stores read/write through the Appointment CRM API instead of localStorage. */

let apiEnabled = false;

export function isAppointmentCrmApiMode(): boolean {
  return apiEnabled;
}

export function setAppointmentCrmApiMode(enabled: boolean): void {
  apiEnabled = enabled;
}
