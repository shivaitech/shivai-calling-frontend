// Departments & Designations — global staff catalogs (NOT scoped to a tenant
// or sub-tenant). Used as master data when assigning staff a department and
// job title. Talks to the real /api/v1/departments and /api/v1/designations
// endpoints.
//
// Do NOT confuse with /api/v1/appointment-crm/.../departments — that's the
// unrelated Appointment CRM model (crm_departments).
//
// Writing a designation: send `department` as an id string.
// Reading a designation: `department` comes back as a looked-up object.

import axios, { AxiosResponse } from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getAuthToken = () => {
  try {
    const stored = localStorage.getItem("auth_tokens");
    if (stored) {
      const { accessToken } = JSON.parse(stored);
      if (accessToken) return accessToken;
    }
  } catch (e) {
    console.warn("Failed to parse auth tokens:", e);
  }
  return localStorage.getItem("authToken");
};

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${getAuthToken()}`,
    "Content-Type": "application/json",
  },
});

const errMessage = (error: any, fallback: string) =>
  error.response?.data?.message || error.response?.data?.error || fallback;

const DEPARTMENTS_BASE = `${API_BASE_URL}/departments`;
const DESIGNATIONS_BASE = `${API_BASE_URL}/designations`;

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Department {
  id: string;
  name: string;
  description: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DesignationDepartment {
  id: string;
  name: string;
  description: string;
}

export interface Designation {
  id: string;
  name: string;
  description: string;
  /** Looked-up object on read; send as an id string on write. */
  department: DesignationDepartment | string;
  createdAt: string;
  updatedAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ListParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "name";
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface ListDesignationsParams extends ListParams {
  /** Filter to one department's designations. */
  department?: string;
}

export interface DepartmentInput {
  name: string;
  description: string;
}

export interface DesignationInput {
  name: string;
  description: string;
  /** Department id (ObjectId string) — required on create. */
  department: string;
}

// Only send fields the caller actually set — the API 422s on unknown keys and
// requires "at least one field" on partial updates.
const compact = <T extends Record<string, unknown>>(obj: T): Partial<T> => {
  const out: Partial<T> = {};
  (Object.keys(obj) as (keyof T)[]).forEach((k) => {
    if (obj[k] !== undefined) out[k] = obj[k];
  });
  return out;
};

const buildListParams = (params: ListParams = {}) => {
  const q: Record<string, unknown> = {
    page: params.page,
    limit: params.limit,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
    search: params.search?.trim() || undefined,
  };
  Object.keys(q).forEach((k) => q[k] === undefined && delete q[k]);
  return q;
};

// ─── Departments ─────────────────────────────────────────────────────────────

export const departmentsAPI = {
  async list(params: ListParams = {}): Promise<{ departments: Department[]; pagination: Pagination }> {
    try {
      const res: AxiosResponse<any> = await axios.get(DEPARTMENTS_BASE, {
        ...authHeaders(),
        params: buildListParams(params),
      });
      const departments: Department[] = res.data?.data?.departments ?? [];
      const pagination: Pagination = res.data?.meta?.pagination ?? {
        page: 1,
        limit: departments.length,
        total: departments.length,
        totalPages: 1,
      };
      return { departments, pagination };
    } catch (error: any) {
      console.error("Error listing departments:", error);
      throw new Error(errMessage(error, "Failed to load departments"));
    }
  },

  async get(id: string): Promise<Department> {
    try {
      const res: AxiosResponse<any> = await axios.get(`${DEPARTMENTS_BASE}/${id}`, authHeaders());
      return res.data?.data?.department;
    } catch (error: any) {
      console.error("Error fetching department:", error);
      if (error.response?.status === 404) throw new Error("Department not found");
      throw new Error(errMessage(error, "Failed to load department"));
    }
  },

  async create(input: DepartmentInput): Promise<Department> {
    try {
      const body = { name: input.name.trim(), description: input.description.trim() };
      const res: AxiosResponse<any> = await axios.post(DEPARTMENTS_BASE, body, authHeaders());
      return res.data?.data?.department;
    } catch (error: any) {
      console.error("Error creating department:", error);
      if (error.response?.status === 409) throw new Error("A department already exists with this name.");
      throw new Error(errMessage(error, "Failed to create department"));
    }
  },

  async update(id: string, patch: Partial<DepartmentInput>): Promise<Department> {
    try {
      const body = compact({
        name: patch.name?.trim(),
        description: patch.description?.trim(),
      });
      const res: AxiosResponse<any> = await axios.put(`${DEPARTMENTS_BASE}/${id}`, body, authHeaders());
      return res.data?.data?.department;
    } catch (error: any) {
      console.error("Error updating department:", error);
      if (error.response?.status === 404) throw new Error("Department not found");
      if (error.response?.status === 409) throw new Error("A department already exists with this name.");
      throw new Error(errMessage(error, "Failed to update department"));
    }
  },

  // Soft delete. Designations under this department are left as-is — the API
  // just prevents attaching NEW designations to a deleted department.
  async remove(id: string): Promise<void> {
    try {
      await axios.delete(`${DEPARTMENTS_BASE}/${id}`, authHeaders());
    } catch (error: any) {
      console.error("Error deleting department:", error);
      if (error.response?.status === 404) throw new Error("Department not found");
      throw new Error(errMessage(error, "Failed to delete department"));
    }
  },
};

// ─── Designations ────────────────────────────────────────────────────────────

export const designationsAPI = {
  async list(params: ListDesignationsParams = {}): Promise<{ designations: Designation[]; pagination: Pagination }> {
    try {
      const q = { ...buildListParams(params), department: params.department || undefined };
      Object.keys(q).forEach((k) => (q as any)[k] === undefined && delete (q as any)[k]);
      const res: AxiosResponse<any> = await axios.get(DESIGNATIONS_BASE, {
        ...authHeaders(),
        params: q,
      });
      const designations: Designation[] = res.data?.data?.designations ?? [];
      const pagination: Pagination = res.data?.meta?.pagination ?? {
        page: 1,
        limit: designations.length,
        total: designations.length,
        totalPages: 1,
      };
      return { designations, pagination };
    } catch (error: any) {
      console.error("Error listing designations:", error);
      throw new Error(errMessage(error, "Failed to load designations"));
    }
  },

  async get(id: string): Promise<Designation> {
    try {
      const res: AxiosResponse<any> = await axios.get(`${DESIGNATIONS_BASE}/${id}`, authHeaders());
      return res.data?.data?.designation;
    } catch (error: any) {
      console.error("Error fetching designation:", error);
      if (error.response?.status === 404) throw new Error("Designation not found");
      throw new Error(errMessage(error, "Failed to load designation"));
    }
  },

  async create(input: DesignationInput): Promise<Designation> {
    try {
      const body = {
        name: input.name.trim(),
        description: input.description.trim(),
        department: input.department,
      };
      const res: AxiosResponse<any> = await axios.post(DESIGNATIONS_BASE, body, authHeaders());
      return res.data?.data?.designation;
    } catch (error: any) {
      console.error("Error creating designation:", error);
      if (error.response?.status === 404) throw new Error("Department not found.");
      if (error.response?.status === 409) throw new Error("A designation already exists with this name in this department.");
      throw new Error(errMessage(error, "Failed to create designation"));
    }
  },

  async update(id: string, patch: Partial<DesignationInput>): Promise<Designation> {
    try {
      const body = compact({
        name: patch.name?.trim(),
        description: patch.description?.trim(),
        department: patch.department,
      });
      const res: AxiosResponse<any> = await axios.put(`${DESIGNATIONS_BASE}/${id}`, body, authHeaders());
      return res.data?.data?.designation;
    } catch (error: any) {
      console.error("Error updating designation:", error);
      if (error.response?.status === 404) throw new Error("Designation or department not found.");
      if (error.response?.status === 409) throw new Error("A designation already exists with this name in this department.");
      throw new Error(errMessage(error, "Failed to update designation"));
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await axios.delete(`${DESIGNATIONS_BASE}/${id}`, authHeaders());
    } catch (error: any) {
      console.error("Error deleting designation:", error);
      if (error.response?.status === 404) throw new Error("Designation not found");
      throw new Error(errMessage(error, "Failed to delete designation"));
    }
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Normalize a designation's department field to just its id, whether the API
 * returned a looked-up object (read) or we still hold the raw id (write). */
export const designationDepartmentId = (d: Designation): string =>
  typeof d.department === "string" ? d.department : d.department?.id || "";

export const designationDepartmentName = (d: Designation): string =>
  typeof d.department === "string" ? "" : d.department?.name || "";

export default { departmentsAPI, designationsAPI };
