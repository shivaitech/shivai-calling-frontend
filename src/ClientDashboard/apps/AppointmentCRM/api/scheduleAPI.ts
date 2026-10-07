import { scheduleRequest } from "./scheduleClient";
import type {
  ApiSchedule,
  ApiScheduleAvailability,
  ApiScheduleBlockType,
  ApiWeeklyAvailabilityDay,
} from "./scheduleTypes";

export function createSchedule(body: {
  staff_id: string;
  timezone?: string;
  weekly_availability?: ApiWeeklyAvailabilityDay[];
  leaves?: unknown[];
  blocks?: unknown[];
}) {
  return scheduleRequest<{ schedule: ApiSchedule }>({ method: "POST", url: "", data: body }).then(
    (r) => r.schedule,
  );
}

export function listSchedules(params?: {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  search?: string;
}) {
  return scheduleRequest<{ schedules: ApiSchedule[] }>({ method: "GET", url: "", params }).then(
    (r) => r.schedules,
  );
}

export function fetchSchedule(staffId: string) {
  return scheduleRequest<{ schedule: ApiSchedule }>({ method: "GET", url: `/${staffId}` }).then(
    (r) => r.schedule,
  );
}

/** Replaces only the keys present in the body — omitted keys are left
 * untouched, but each included array is a full wholesale replacement. */
export function updateSchedule(
  staffId: string,
  body: {
    timezone?: string;
    weekly_availability?: ApiWeeklyAvailabilityDay[];
    leaves?: unknown[];
    blocks?: unknown[];
  },
) {
  return scheduleRequest<{ schedule: ApiSchedule }>({ method: "PUT", url: `/${staffId}`, data: body }).then(
    (r) => r.schedule,
  );
}

export function deleteSchedule(staffId: string) {
  return scheduleRequest<void>({ method: "DELETE", url: `/${staffId}` });
}

export function fetchScheduleAvailability(staffId: string, date: string) {
  return scheduleRequest<{ availability: ApiScheduleAvailability }>({
    method: "GET",
    url: `/${staffId}/availability`,
    params: { date },
  }).then((r) => r.availability);
}

export function addScheduleBlock(
  staffId: string,
  body: {
    type: ApiScheduleBlockType;
    date: string;
    from: string;
    to: string;
    patient_name?: string;
    patient_id?: string;
    notes?: string;
  },
) {
  return scheduleRequest<{ schedule: ApiSchedule }>({
    method: "POST",
    url: `/${staffId}/blocks`,
    data: body,
  }).then((r) => r.schedule);
}

export function removeScheduleBlock(staffId: string, blockId: string) {
  return scheduleRequest<{ schedule: ApiSchedule }>({
    method: "DELETE",
    url: `/${staffId}/blocks/${blockId}`,
  }).then((r) => r.schedule);
}

export function addScheduleLeave(
  staffId: string,
  body: {
    from_date: string;
    to_date: string;
    from_time?: string;
    to_time?: string;
    reason?: string;
  },
) {
  return scheduleRequest<{ schedule: ApiSchedule }>({
    method: "POST",
    url: `/${staffId}/leaves`,
    data: body,
  }).then((r) => r.schedule);
}

export function removeScheduleLeave(staffId: string, leaveId: string) {
  return scheduleRequest<{ schedule: ApiSchedule }>({
    method: "DELETE",
    url: `/${staffId}/leaves/${leaveId}`,
  }).then((r) => r.schedule);
}

const scheduleAPI = {
  createSchedule,
  listSchedules,
  fetchSchedule,
  updateSchedule,
  deleteSchedule,
  fetchScheduleAvailability,
  addScheduleBlock,
  removeScheduleBlock,
  addScheduleLeave,
  removeScheduleLeave,
};

export default scheduleAPI;
