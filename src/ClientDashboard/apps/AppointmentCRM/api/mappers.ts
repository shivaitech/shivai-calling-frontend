import type { Booking, BookingChannel, BookingStatus } from "../mockData";
import type { Branch } from "../branchesStore";
import type { Department } from "../departmentsStore";
import type { StaffMember } from "../staffStore";
import type {
  DailyBreak,
  DaySlot,
  StaffAvailability,
  StaffLeave,
  Weekday,
} from "../availabilityStore";
import type { StaffOfflineBlock } from "../offlineBlocksStore";
import type { AppointmentSetup } from "../setupStore";
import type {
  ApiAvailability,
  ApiBooking,
  ApiBootstrap,
  ApiBranch,
  ApiDepartment,
  ApiLeave,
  ApiOfflineBlock,
  ApiStaff,
  ApiTemplateId,
} from "./types";
import { toIsoDate } from "../availabilityStore";

const HUES = [220, 280, 160, 40, 310, 180, 100, 250];
const DAY_INDEX_TO_WEEKDAY: Weekday[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const WEEKDAY_TO_DAY_INDEX: Record<Weekday, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export function apiId(value?: { id?: string; _id?: string } | string): string {
  if (typeof value === "string") return value;
  return String(value?.id ?? value?._id ?? "");
}

export function industryIdFromTemplate(templateId?: ApiTemplateId): string {
  if (templateId === "template_retail") return "salon";
  if (templateId === "template_healthcare") return "clinic";
  return "clinic";
}

export function templateIdFromIndustry(industryId: string): ApiTemplateId {
  if (industryId === "salon" || industryId === "fitness") return "template_retail";
  if (industryId === "hospital" || industryId === "clinic" || industryId === "dental") {
    return "template_healthcare";
  }
  return "generic";
}

function hueFromSeed(seed: string, fallback = 0): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return HUES[Math.abs(hash) % HUES.length] ?? fallback;
}

export function mapBranch(b: ApiBranch, index = 0): Branch {
  const id = apiId(b);
  return {
    id,
    name: b.name,
    address: b.address,
    phone: b.phone,
    isPrimary: b.isPrimary ?? index === 0,
    active: b.active !== false,
  };
}

export function mapDepartment(d: ApiDepartment, index = 0): Department {
  const id = apiId(d);
  const hueRaw = d.hue;
  const hue =
    typeof hueRaw === "number"
      ? hueRaw
      : typeof hueRaw === "string" && hueRaw.startsWith("#")
        ? parseInt(hueRaw.slice(1, 4), 16) % 360
        : hueFromSeed(id, HUES[index % HUES.length]);
  return {
    id,
    branchId: d.branchId,
    name: d.name,
    desc: d.desc,
    hue,
    active: d.active !== false,
  };
}

export function mapStaff(s: ApiStaff, index = 0): StaffMember {
  const id = apiId(s);
  return {
    id,
    branchId: s.branchId,
    departmentId: s.departmentId ?? "",
    name: s.name,
    title: s.namePrefix,
    role: s.roleLabel ?? s.roleId ?? "Staff",
    specialization: undefined,
    email: s.email,
    phone: s.phone,
    active: s.active !== false,
    hue: s.hue ?? hueFromSeed(id, HUES[index % HUES.length]),
    slotDurationMin: s.slotDurationMin ?? 30,
  };
}

export function staffToApiBody(params: {
  name: string;
  title?: string;
  role: string;
  email?: string;
  phone?: string;
  branchId: string;
  departmentId: string;
  slotDurationMin?: number;
  active?: boolean;
}) {
  return {
    name: params.name.trim(),
    namePrefix: params.title?.trim() || undefined,
    roleLabel: params.role.trim(),
    roleId: params.role.trim().toLowerCase().replace(/\s+/g, "_"),
    email: params.email?.trim() || undefined,
    phone: params.phone?.trim() || undefined,
    branchId: params.branchId,
    departmentId: params.departmentId,
    slotDurationMin: params.slotDurationMin,
    active: params.active,
  };
}

export function formatTime24To12(time: string): string {
  const [hStr, mStr] = time.split(":");
  const h = Number(hStr);
  const m = mStr ?? "00";
  if (Number.isNaN(h)) return time;
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.padStart(2, "0")} ${suffix}`;
}

export function formatTime12To24(time: string): string {
  const trimmed = time.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return trimmed;
  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return `${String(hour).padStart(2, "0")}:${minute}`;
}

export function formatBookingDateForUi(isoDate: string): string {
  const today = toIsoDate(new Date());
  if (isoDate === today) return "Today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isoDate === toIsoDate(tomorrow)) return "Tomorrow";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (isoDate === toIsoDate(yesterday)) return "Yesterday";
  return isoDate;
}

export function mapBooking(
  b: ApiBooking,
  ctx?: { branchName?: string; departmentName?: string; provider?: string },
): Booking {
  const id = apiId(b);
  return {
    id,
    customer: b.customer,
    phone: b.phone ?? "",
    email: b.email,
    service: b.serviceLabel ?? "General",
    appointmentType: b.serviceLabel ?? "Consultation",
    provider: b.staffLabel ?? ctx?.provider ?? "Unassigned",
    branchId: b.branchId ?? "",
    branchName: ctx?.branchName ?? "",
    departmentId: undefined,
    departmentName: ctx?.departmentName,
    staffId: b.staffId,
    date: formatBookingDateForUi(b.date),
    time: b.time.includes("M") ? b.time : formatTime24To12(b.time),
    durationMin: b.durationMin ?? 30,
    status: b.status as BookingStatus,
    channel: (b.channel ?? "web") as BookingChannel,
    notes: b.notes,
    reminderSent: b.status !== "pending",
  };
}

export function bookingToApiBody(b: Partial<Booking> & { dateIso?: string }) {
  const date =
    b.dateIso ??
    (b.date === "Today"
      ? toIsoDate(new Date())
      : b.date && !["Today", "Tomorrow", "Yesterday"].includes(b.date)
        ? b.date
        : toIsoDate(new Date()));
  return {
    branchId: b.branchId,
    staffId: b.staffId,
    staffLabel: b.provider,
    customer: b.customer,
    phone: b.phone,
    email: b.email,
    serviceLabel: b.service ?? b.appointmentType,
    date,
    time: b.time?.includes("M") ? formatTime12To24(b.time) : b.time,
    durationMin: b.durationMin,
    status: b.status,
    channel: b.channel,
    notes: b.notes,
  };
}

export function mapAvailability(
  staffId: string,
  api: ApiAvailability,
): StaffAvailability {
  return {
    staffId,
    weekly: (api.weekly ?? []).map((d) => ({
      day: DAY_INDEX_TO_WEEKDAY[d.day] ?? "mon",
      enabled: d.enabled,
      from: d.from,
      to: d.to,
    })),
    dailyBreak: api.dailyBreak,
  };
}

export function availabilityToApiBody(av: StaffAvailability): ApiAvailability {
  return {
    weekly: av.weekly.map((d) => ({
      day: WEEKDAY_TO_DAY_INDEX[d.day],
      enabled: d.enabled,
      from: d.from,
      to: d.to,
    })),
    dailyBreak: av.dailyBreak,
  };
}

export function mapLeave(l: ApiLeave): StaffLeave {
  return {
    id: apiId(l),
    staffId: l.staffId,
    fromDate: l.fromDate,
    toDate: l.toDate,
    reason: l.reason ?? "",
    type: l.type,
  };
}

export function mapOfflineBlock(b: ApiOfflineBlock): StaffOfflineBlock {
  return {
    id: apiId(b),
    staffId: b.staffId,
    date: b.date,
    fromTime: b.fromTime.includes("M") ? b.fromTime : formatTime24To12(b.fromTime),
    toTime: b.toTime.includes("M") ? b.toTime : formatTime24To12(b.toTime),
    type: b.type,
    patientName: (b.customFields?.patientName as string) ?? (b.customFields?.customer as string),
    notes: b.notes,
  };
}

export function offlineBlockToApiBody(params: {
  staffId: string;
  branchId?: string;
  date: string;
  fromTime: string;
  toTime: string;
  type: StaffOfflineBlock["type"];
  patientName?: string;
  notes?: string;
}) {
  return {
    staffId: params.staffId,
    branchId: params.branchId,
    date: params.date,
    fromTime: params.fromTime.includes("M") ? formatTime12To24(params.fromTime) : params.fromTime,
    toTime: params.toTime.includes("M") ? formatTime12To24(params.toTime) : params.toTime,
    type: params.type,
    notes: params.notes,
    customFields: params.patientName ? { patientName: params.patientName } : {},
  };
}

export function mapSetupFromBootstrap(bootstrap: ApiBootstrap): AppointmentSetup {
  const templateId = bootstrap.setup.templateId ?? bootstrap.config.templateId;
  return {
    setupComplete: Boolean(bootstrap.setup.setupComplete),
    companyName: bootstrap.setup.companyName ?? "",
    industryId: industryIdFromTemplate(templateId),
    branchMode: bootstrap.setup.branchMode ?? "single",
    timezone: bootstrap.setup.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    completedAt: bootstrap.setup.completedAt,
  };
}

export function mapWeeklyDays(api: ApiAvailability): DaySlot[] {
  return mapAvailability("", api).weekly;
}

export function mapDailyBreak(api: ApiAvailability): DailyBreak | undefined {
  return api.dailyBreak;
}
