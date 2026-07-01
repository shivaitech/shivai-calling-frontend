import axios, { AxiosError, type AxiosRequestConfig } from "axios";
import type { ApiEnvelope } from "./types";

const API_ROOT = import.meta.env.VITE_API_BASE_URL as string | undefined;
export const APPOINTMENT_CRM_BASE = API_ROOT ? `${API_ROOT}/appointment-crm` : "";

export class AppointmentCrmApiError extends Error {
  statusCode: number;
  errors: unknown[];

  constructor(message: string, statusCode: number, errors: unknown[] = []) {
    super(message);
    this.name = "AppointmentCrmApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem("auth_tokens");
    if (!raw) return null;
    return JSON.parse(raw).accessToken ?? null;
  } catch {
    return null;
  }
}

export const appointmentCrmClient = axios.create({
  baseURL: APPOINTMENT_CRM_BASE,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

appointmentCrmClient.interceptors.request.use((config) => {
  if (!config.headers?.Authorization) {
    const token = getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

appointmentCrmClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      try {
        const raw = localStorage.getItem("auth_tokens");
        if (raw) {
          const { refreshToken } = JSON.parse(raw);
          const refreshRes = await axios.post(
            `${API_ROOT}/auth/refresh-token`,
            { refreshToken },
            { headers: { "Content-Type": "application/json" } },
          );
          const tokens = refreshRes.data?.data?.tokens ?? refreshRes.data?.tokens;
          if (tokens?.accessToken) {
            localStorage.setItem("auth_tokens", JSON.stringify(tokens));
            original.headers = { ...original.headers, Authorization: `Bearer ${tokens.accessToken}` };
            return appointmentCrmClient(original);
          }
        }
      } catch {
        localStorage.removeItem("auth_tokens");
        window.location.href = "/landing";
      }
    }
    return Promise.reject(error);
  },
);

export function unwrapApi<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as ApiEnvelope<T>).data;
  }
  return payload as T;
}

export async function crmRequest<T>(
  config: AxiosRequestConfig,
  options?: { public?: boolean },
): Promise<T> {
  if (!APPOINTMENT_CRM_BASE) {
    throw new AppointmentCrmApiError("API base URL is not configured", 0);
  }
  const headers = { ...(config.headers ?? {}) };
  if (options?.public) delete headers.Authorization;

  try {
    const res = await appointmentCrmClient({ ...config, headers });
    return unwrapApi<T>(res.data);
  } catch (err) {
    if (axios.isAxiosError(err)) {
      const body = err.response?.data as ApiEnvelope<unknown> | undefined;
      throw new AppointmentCrmApiError(
        body?.message ?? err.message ?? "Request failed",
        err.response?.status ?? 0,
        body?.errors ?? [],
      );
    }
    throw err;
  }
}

export function isAppointmentCrmApiConfigured(): boolean {
  return Boolean(APPOINTMENT_CRM_BASE);
}
