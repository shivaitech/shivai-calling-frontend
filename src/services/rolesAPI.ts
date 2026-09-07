import axios, { AxiosResponse } from "axios";

// Roles API — global permission templates.
// See public/test/roles-api.md for the full contract.
// Base: {API_BASE}/api/v1/roles

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

// Errors: 401 auth · 403 permission · 404 not found · 409 duplicate key ·
// 422 validation · 400 role in use (delete).
const errMessage = (error: any, fallback: string) =>
  error.response?.data?.error ||
  error.response?.data?.message ||
  fallback;

// ─── Types ───────────────────────────────────────────────────────────────────

export type PermissionModuleKey =
  | "users"
  | "roles"
  | "permissions"
  | "tenants"
  | "settings";

export type PermissionActionKey = "create" | "read" | "update" | "delete";

export interface Role {
  id: string;
  key: string;
  description: string;
  default_modules: PermissionModuleKey[];
  default_actions: PermissionActionKey[];
  default_permissions: string[]; // server-computed "module:action"
  createdAt: string;
  updatedAt: string;
}

export interface RoleOptions {
  modules: PermissionModuleKey[];
  actions: PermissionActionKey[];
}

export interface CreateRoleRequest {
  key: string;
  description?: string;
  default_modules: PermissionModuleKey[];
  default_actions: PermissionActionKey[];
}

export type UpdateRoleRequest = Partial<CreateRoleRequest>;

export interface RolesListParams {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "updatedAt" | "key";
  sortOrder?: "asc" | "desc";
  search?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

// GET /roles/options — valid modules/actions for role form pickers
export const getRoleOptions = async (): Promise<RoleOptions> => {
  try {
    const res: AxiosResponse<{ success: boolean; data: RoleOptions }> =
      await axios.get(`${API_BASE_URL}/roles/options`, authHeaders());
    return res.data.data;
  } catch (error: any) {
    console.error("Error fetching role options:", error);
    throw new Error(errMessage(error, "Failed to load permission options"));
  }
};

// GET /roles — active roles (paginated). Used for the sub-tenant role dropdown.
export const listRoles = async (
  params: RolesListParams = {}
): Promise<{ roles: Role[]; pagination?: PaginationMeta }> => {
  try {
    const res: AxiosResponse<{
      success: boolean;
      data: { roles: Role[] };
      meta?: { pagination: PaginationMeta };
    }> = await axios.get(`${API_BASE_URL}/roles`, {
      ...authHeaders(),
      params,
    });
    return {
      roles: res.data.data?.roles || [],
      pagination: res.data.meta?.pagination,
    };
  } catch (error: any) {
    console.error("Error listing roles:", error);
    throw new Error(errMessage(error, "Failed to load roles"));
  }
};

// GET /roles/:id
export const getRole = async (id: string): Promise<Role> => {
  try {
    const res: AxiosResponse<{ success: boolean; data: { role: Role } }> =
      await axios.get(`${API_BASE_URL}/roles/${id}`, authHeaders());
    return res.data.data.role;
  } catch (error: any) {
    console.error("Error fetching role:", error);
    throw new Error(errMessage(error, "Failed to load role"));
  }
};

// POST /roles — do NOT send default_permissions (server computes it)
export const createRole = async (payload: CreateRoleRequest): Promise<Role> => {
  try {
    const res: AxiosResponse<{ success: boolean; data: { role: Role } }> =
      await axios.post(`${API_BASE_URL}/roles`, payload, authHeaders());
    return res.data.data.role;
  } catch (error: any) {
    console.error("Error creating role:", error);
    if (error.response?.status === 409) {
      throw new Error("A role with this key already exists.");
    }
    throw new Error(errMessage(error, "Failed to create role"));
  }
};

// PUT /roles/:id
export const updateRole = async (
  id: string,
  payload: UpdateRoleRequest
): Promise<Role> => {
  try {
    const res: AxiosResponse<{ success: boolean; data: { role: Role } }> =
      await axios.put(`${API_BASE_URL}/roles/${id}`, payload, authHeaders());
    return res.data.data.role;
  } catch (error: any) {
    console.error("Error updating role:", error);
    if (error.response?.status === 409) {
      throw new Error("A role with this key already exists.");
    }
    throw new Error(errMessage(error, "Failed to update role"));
  }
};

// DELETE /roles/:id — soft delete. 400 if the role is still assigned to users.
export const deleteRole = async (id: string): Promise<string> => {
  try {
    const res: AxiosResponse<{ success: boolean; message: string }> =
      await axios.delete(`${API_BASE_URL}/roles/${id}`, authHeaders());
    return res.data.message || "Role deleted";
  } catch (error: any) {
    console.error("Error deleting role:", error);
    if (error.response?.status === 400) {
      throw new Error("This role is in use and can't be deleted.");
    }
    throw new Error(errMessage(error, "Failed to delete role"));
  }
};

export default {
  getRoleOptions,
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
};
