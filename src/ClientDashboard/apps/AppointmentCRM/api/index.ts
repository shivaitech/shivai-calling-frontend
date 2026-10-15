import { crmRequest } from "./client";
import { appointmentsRequest } from "./appointmentsClient";
import type {
  ApiAiConfig,
  ApiAiConfigDefaults,
  ApiAiConfigResolved,
  ApiAnalyticsOverview,
  ApiAvailability,
  ApiBooking,
  ApiBootstrap,
  ApiBranch,
  ApiCalendarDay,
  ApiCatalogOption,
  ApiCustomer,
  ApiDepartment,
  ApiLeave,
  ApiOfflineBlock,
  ApiOrgConfig,
  ApiSetup,
  ApiStaff,
  ApiStaffBookingsResponse,
  ApiStaffCalendarShare,
  ApiTemplateId,
  BranchMode,
  CatalogType,
} from "./types";

// ── Bootstrap & setup ────────────────────────────────────────────────────────

export function fetchBootstrap() {
  return crmRequest<ApiBootstrap>({ method: "GET", url: "/org/bootstrap" });
}

export function fetchSetup() {
  return crmRequest<ApiSetup>({ method: "GET", url: "/setup" });
}

export function completeSetup(body: {
  templateId: ApiTemplateId;
  companyName: string;
  timezone: string;
  branchMode: BranchMode;
  branches?: { name: string; address?: string; phone?: string; isPrimary?: boolean }[];
}) {
  return crmRequest<ApiSetup>({ method: "POST", url: "/setup", data: body });
}

export function patchSetup(body: { companyName?: string; timezone?: string }) {
  return crmRequest<ApiSetup>({ method: "PATCH", url: "/setup", data: body });
}

// ── Config & templates ───────────────────────────────────────────────────────

export function fetchConfig() {
  return crmRequest<ApiOrgConfig>({ method: "GET", url: "/config" });
}

export function patchConfig(body: Partial<ApiOrgConfig>) {
  return crmRequest<ApiOrgConfig>({ method: "PATCH", url: "/config", data: body });
}

export function applyConfigTemplate(body: {
  templateId: ApiTemplateId;
  mergeStrategy?: "replace" | "merge";
}) {
  return crmRequest<ApiOrgConfig>({ method: "POST", url: "/config/apply-template", data: body });
}

export function fetchTemplates() {
  return crmRequest<unknown[]>({ method: "GET", url: "/templates" });
}

export function fetchTemplate(templateId: string) {
  return crmRequest<unknown>({ method: "GET", url: `/templates/${templateId}` });
}

// ── AI Configuration ─────────────────────────────────────────────────────────

export function saveAiConfig(agentId: string, body: Record<string, unknown>) {
  return crmRequest<ApiAiConfig>({
    method: "POST",
    url: "/ai-config",
    params: { agentId },
    data: { ...body, agentId },
  });
}

export function fetchAiConfig(agentId: string) {
  return crmRequest<ApiAiConfig>({ method: "GET", url: "/ai-config", params: { agentId } });
}

export function fetchAiConfigs() {
  return crmRequest<ApiAiConfig[]>({ method: "GET", url: "/ai-config" });
}

export function fetchAiConfigDefaults() {
  return crmRequest<ApiAiConfigDefaults>({ method: "GET", url: "/ai-config/defaults" });
}

export function fetchCatalogOptions(
  ref: "branches" | "departments" | "staff" | "services" | "appointmentTypes" | "staffRoles",
  params?: { branchId?: string; departmentId?: string },
) {
  return crmRequest<ApiCatalogOption[]>({ method: "GET", url: `/catalog-options/${ref}`, params });
}

export function fetchAiConfigResolved(agentId: string, branchId?: string) {
  return crmRequest<ApiAiConfigResolved>({
    method: "GET",
    url: "/ai-config/resolved",
    params: { agentId, branchId },
  });
}

export function deleteAiConfig(agentId: string) {
  return crmRequest<void>({ method: "DELETE", url: `/ai-config/${agentId}` });
}

// ── Catalogs ─────────────────────────────────────────────────────────────────

export function fetchCatalog(type: CatalogType) {
  return crmRequest<unknown[]>({ method: "GET", url: `/catalogs/${type}` });
}

export function createCatalogItem(type: CatalogType, body: { id: string; label: string }) {
  return crmRequest<unknown>({ method: "POST", url: `/catalogs/${type}`, data: body });
}

export function patchCatalogItem(type: CatalogType, id: string, body: { label: string }) {
  return crmRequest<unknown>({ method: "PATCH", url: `/catalogs/${type}/${id}`, data: body });
}

export function deleteCatalogItem(type: CatalogType, key: string) {
  return crmRequest<void>({ method: "DELETE", url: `/catalogs/${type}/${key}` });
}

// ── Branches & preferences ───────────────────────────────────────────────────

export function fetchBranches() {
  return crmRequest<ApiBranch[]>({ method: "GET", url: "/branches" });
}

export function createBranch(body: {
  name: string;
  address?: string;
  phone?: string;
  isPrimary?: boolean;
}) {
  return crmRequest<ApiBranch>({ method: "POST", url: "/branches", data: body });
}

export function fetchBranch(id: string) {
  return crmRequest<ApiBranch>({ method: "GET", url: `/branches/${id}` });
}

export function patchBranch(id: string, body: Partial<ApiBranch>) {
  return crmRequest<ApiBranch>({ method: "PATCH", url: `/branches/${id}`, data: body });
}

export function deleteBranch(id: string) {
  return crmRequest<void>({ method: "DELETE", url: `/branches/${id}` });
}

export function fetchPreferences() {
  return crmRequest<{ activeBranchId?: string }>({ method: "GET", url: "/preferences" });
}

export function setActiveBranch(branchId: string) {
  return crmRequest<{ activeBranchId: string }>({
    method: "PUT",
    url: "/branches/active",
    data: { branchId },
  });
}

// ── Departments ──────────────────────────────────────────────────────────────

export function fetchDepartments(branchId: string) {
  return crmRequest<ApiDepartment[]>({
    method: "GET",
    url: `/branches/${branchId}/departments`,
  });
}

export function createDepartment(
  branchId: string,
  body: { name: string; desc?: string; hue?: string },
) {
  return crmRequest<ApiDepartment>({
    method: "POST",
    url: `/branches/${branchId}/departments`,
    data: body,
  });
}

export function patchDepartment(id: string, body: Partial<ApiDepartment>) {
  return crmRequest<ApiDepartment>({ method: "PATCH", url: `/departments/${id}`, data: body });
}

export function deleteDepartment(id: string) {
  return crmRequest<void>({ method: "DELETE", url: `/departments/${id}` });
}

// ── Staff ────────────────────────────────────────────────────────────────────

export function fetchStaff(params?: {
  branchId?: string;
  departmentId?: string;
  active?: boolean;
}) {
  return crmRequest<ApiStaff[]>({
    method: "GET",
    url: "/staff",
    params: {
      branchId: params?.branchId,
      departmentId: params?.departmentId,
      active: params?.active,
    },
  });
}

export function createStaff(body: Record<string, unknown>) {
  return crmRequest<ApiStaff>({ method: "POST", url: "/staff", data: body });
}

export function fetchStaffById(id: string) {
  return crmRequest<ApiStaff>({ method: "GET", url: `/staff/${id}` });
}

export function patchStaff(id: string, body: Record<string, unknown>) {
  return crmRequest<ApiStaff>({ method: "PATCH", url: `/staff/${id}`, data: body });
}

export function deleteStaff(id: string) {
  return crmRequest<void>({ method: "DELETE", url: `/staff/${id}` });
}

// ── Availability & leaves ────────────────────────────────────────────────────

export function fetchAvailability(staffId: string) {
  return crmRequest<ApiAvailability>({ method: "GET", url: `/staff/${staffId}/availability` });
}

export function putAvailability(staffId: string, body: ApiAvailability) {
  return crmRequest<ApiAvailability>({
    method: "PUT",
    url: `/staff/${staffId}/availability`,
    data: body,
  });
}

export function fetchLeaves(staffId: string) {
  return crmRequest<ApiLeave[]>({ method: "GET", url: `/staff/${staffId}/leaves` });
}

export function createLeave(
  staffId: string,
  body: { fromDate: string; toDate: string; reason?: string; type: string },
) {
  return crmRequest<ApiLeave>({ method: "POST", url: `/staff/${staffId}/leaves`, data: body });
}

export function deleteLeave(id: string) {
  return crmRequest<void>({ method: "DELETE", url: `/leaves/${id}` });
}

// ── Offline blocks ───────────────────────────────────────────────────────────

export function fetchOfflineBlocks(params?: {
  staffId?: string;
  branchId?: string;
  date?: string;
}) {
  return crmRequest<ApiOfflineBlock[]>({
    method: "GET",
    url: "/offline-blocks",
    params,
  });
}

export function createOfflineBlock(body: Record<string, unknown>) {
  return crmRequest<ApiOfflineBlock>({ method: "POST", url: "/offline-blocks", data: body });
}

export function patchOfflineBlock(id: string, body: Record<string, unknown>) {
  return crmRequest<ApiOfflineBlock>({ method: "PATCH", url: `/offline-blocks/${id}`, data: body });
}

export function deleteOfflineBlock(id: string) {
  return crmRequest<void>({ method: "DELETE", url: `/offline-blocks/${id}` });
}

// ── Bookings (top-level /appointments resource, not /appointment-crm) ───────

export async function createBooking(body: Record<string, unknown>) {
  const res = await appointmentsRequest<{ appointment: ApiBooking }>({ method: "POST", url: "", data: body });
  return res.appointment;
}

export async function fetchBooking(id: string) {
  const res = await appointmentsRequest<{ appointment: ApiBooking }>({ method: "GET", url: `/${id}` });
  return res.appointment;
}

export async function fetchBookingsByStaff(staffId: string, date?: string) {
  const res = await appointmentsRequest<{ appointments: ApiBooking[] }>({
    method: "GET",
    url: `/by-staff/${staffId}`,
    params: date ? { date } : undefined,
  });
  return res.appointments;
}

/** Cancels a booked appointment — the only status transition this API
 * supports (no complete/no-show/delete). */
export async function cancelBooking(id: string) {
  const res = await appointmentsRequest<{ appointment: ApiBooking }>({ method: "PUT", url: `/${id}/cancel` });
  return res.appointment;
}

/** Batch-fetches bookings (+ breaks/leaves) for a set of staff on one date,
 * grouped per staff — what the Calendar uses instead of per-staff fetches. */
export function fetchStaffBookings(params: { staffIds: string[]; date: string }) {
  return appointmentsRequest<ApiStaffBookingsResponse>({
    method: "POST",
    url: "/staff-bookings",
    data: params,
  });
}

// ── Calendar ─────────────────────────────────────────────────────────────────

export function fetchCalendarDay(params: {
  branchId: string;
  date: string;
  departmentId?: string;
  staffId?: string;
}) {
  return crmRequest<ApiCalendarDay>({ method: "GET", url: "/calendar/day", params });
}

// ── Customers ────────────────────────────────────────────────────────────────

export function fetchCustomers(search?: string) {
  return crmRequest<ApiCustomer[]>({
    method: "GET",
    url: "/customers",
    params: search ? { search } : undefined,
  });
}

export function createCustomer(body: Record<string, unknown>) {
  return crmRequest<ApiCustomer>({ method: "POST", url: "/customers", data: body });
}

export function fetchCustomer(id: string) {
  return crmRequest<ApiCustomer>({ method: "GET", url: `/customers/${id}` });
}

export function patchCustomer(id: string, body: Record<string, unknown>) {
  return crmRequest<ApiCustomer>({ method: "PATCH", url: `/customers/${id}`, data: body });
}

export function fetchCustomerBookings(id: string) {
  return crmRequest<ApiBooking[]>({ method: "GET", url: `/customers/${id}/bookings` });
}

// ── Analytics ────────────────────────────────────────────────────────────────

export function fetchAnalyticsOverview(branchId?: string) {
  return crmRequest<ApiAnalyticsOverview>({
    method: "GET",
    url: "/analytics/overview",
    params: branchId ? { branchId } : undefined,
  });
}

// ── Staff calendar shares (public + auth) ────────────────────────────────────

export function createStaffCalendarShare(body: { staffId: string; password?: string }) {
  return crmRequest<ApiStaffCalendarShare>({
    method: "POST",
    url: "/staff-calendar-shares",
    data: body,
  });
}

export function loginStaffCalendarShare(
  shareToken: string,
  body: { email: string; password?: string },
) {
  return crmRequest<ApiStaffCalendarShare>(
    { method: "POST", url: `/staff-calendar-shares/${shareToken}/login`, data: body },
    { public: true },
  );
}

export function sendStaffCalendarShareEmail(body: { shareToken: string }) {
  return crmRequest<{ sent?: boolean }>({
    method: "POST",
    url: "/staff-calendar-shares/send-email",
    data: body,
  });
}

export function fetchStaffCalendarShare(shareToken: string) {
  return crmRequest<ApiStaffCalendarShare>(
    { method: "GET", url: `/staff-calendar-shares/${shareToken}` },
    { public: true },
  );
}

/** Tenant JWT — for staff/admin until per-share RBAC is ready. */
export function fetchStaffCalendarShareAuthed(shareToken: string) {
  return crmRequest<ApiStaffCalendarShare>({
    method: "GET",
    url: `/staff-calendar-shares/${shareToken}`,
  });
}

export function fetchStaffCalendarShareDay(shareToken: string, date: string) {
  return crmRequest<ApiCalendarDay>(
    { method: "GET", url: `/staff-calendar-shares/${shareToken}/calendar`, params: { date } },
    { public: true },
  );
}

export function fetchStaffCalendarShareDayAuthed(shareToken: string, date: string) {
  return crmRequest<ApiCalendarDay>({
    method: "GET",
    url: `/staff-calendar-shares/${shareToken}/calendar`,
    params: { date },
  });
}

export function deleteStaffCalendarShare(staffId: string) {
  return crmRequest<void>({ method: "DELETE", url: `/staff-calendar-shares/${staffId}` });
}

export const appointmentCrmAPI = {
  fetchBootstrap,
  fetchSetup,
  completeSetup,
  patchSetup,
  fetchConfig,
  patchConfig,
  applyConfigTemplate,
  fetchTemplates,
  fetchTemplate,
  saveAiConfig,
  fetchAiConfig,
  fetchAiConfigs,
  fetchAiConfigDefaults,
  fetchCatalogOptions,
  fetchAiConfigResolved,
  deleteAiConfig,
  fetchCatalog,
  createCatalogItem,
  patchCatalogItem,
  deleteCatalogItem,
  fetchBranches,
  createBranch,
  fetchBranch,
  patchBranch,
  deleteBranch,
  fetchPreferences,
  setActiveBranch,
  fetchDepartments,
  createDepartment,
  patchDepartment,
  deleteDepartment,
  fetchStaff,
  createStaff,
  fetchStaffById,
  patchStaff,
  deleteStaff,
  fetchAvailability,
  putAvailability,
  fetchLeaves,
  createLeave,
  deleteLeave,
  fetchOfflineBlocks,
  createOfflineBlock,
  patchOfflineBlock,
  deleteOfflineBlock,
  createBooking,
  fetchBooking,
  fetchBookingsByStaff,
  cancelBooking,
  fetchStaffBookings,
  fetchCalendarDay,
  fetchCustomers,
  createCustomer,
  fetchCustomer,
  patchCustomer,
  fetchCustomerBookings,
  fetchAnalyticsOverview,
  createStaffCalendarShare,
  loginStaffCalendarShare,
  sendStaffCalendarShareEmail,
  fetchStaffCalendarShare,
  fetchStaffCalendarShareAuthed,
  fetchStaffCalendarShareDay,
  fetchStaffCalendarShareDayAuthed,
  deleteStaffCalendarShare,
};

export default appointmentCrmAPI;
