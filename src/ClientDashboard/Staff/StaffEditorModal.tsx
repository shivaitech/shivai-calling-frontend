import { useEffect, useMemo, useState } from 'react';
import { X, Loader2, User, Mail, ShieldCheck, UserPlus, Phone, Lock, Eye, EyeOff, Briefcase, Building2, Check, CheckCircle, XCircle } from 'lucide-react';
import ModalOverlay from '../../components/ModalOverlay';
import appToast from '../../components/AppToast';
import PermissionMatrixEditor from '../SubTenants/PermissionMatrixEditor';
import { staffAPI, countGrants, type StaffMember } from '../../services/staffAPI';
import { listSubTenants } from '../../services/subTenantsAPI';
import { useStaffAssignments } from '../../services/staffOrgStore';
import {
  departmentsAPI,
  designationsAPI,
  type Department,
  type Designation,
} from '../../services/departmentsAPI';
import { useAuth } from '../../contexts/AuthContext';
import { usePasswordValidation } from '../../hooks/useAuthValidation';
import { AUTH_MESSAGES } from '../../constants/validation';
import type { PermissionGrantMap, Tenant } from '../../permissions/types';

interface Props {
  open: boolean;
  tenantId: string;
  editing: StaffMember | null; // null = create
  onClose: () => void;
  onSaved: () => void;
}

const INPUT =
  'w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white';

const StaffEditorModal = ({ open, tenantId, editing, onClose, onSaved }: Props) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const passwordValidation = usePasswordValidation(password, email, 'signup');
  const [roleName, setRoleName] = useState('');
  // Department → Designation hierarchy — real global catalogs (departmentsAPI).
  // The staff↔department/designation link itself has no backend field yet, so
  // it's tracked locally; the designation's NAME is what goes to the staff API
  // as role_name.
  const assignments = useStaffAssignments(tenantId);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [loadingDesignations, setLoadingDesignations] = useState(false);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [designationId, setDesignationId] = useState<string | null>(null);
  const [newDept, setNewDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptDesc, setNewDeptDesc] = useState('');
  const [savingDept, setSavingDept] = useState(false);
  const [newDesignation, setNewDesignation] = useState(false);
  const [newDesignationName, setNewDesignationName] = useState('');
  const [newDesignationDesc, setNewDesignationDesc] = useState('');
  const [savingDesignation, setSavingDesignation] = useState(false);
  const [grants, setGrants] = useState<PermissionGrantMap>({});
  // Independent sub-tenant scope PER scoped module (command-center, sub-tenants).
  const [scopeMode, setScopeMode] = useState<Record<string, 'all' | 'select'>>({});
  const [managedIds, setManagedIds] = useState<Record<string, string[]>>({});
  const [invite, setInvite] = useState(true);
  const [saving, setSaving] = useState(false);

  const { user } = useAuth();
  // Sub-tenant assignment is a main-tenant capability (they own sub-tenants).
  const isMainTenant = !(user?.tenantRole === 'SUBTENANT_OWNER' || user?.tenantRole === 'SUBTENANT_MEMBER');
  const [subTenants, setSubTenants] = useState<Tenant[]>([]);

  const PASSWORD_MIN_LEN = 8;

  // Load the owner's sub-tenants for the assignment picker (main tenant only).
  useEffect(() => {
    if (!open || !isMainTenant) return;
    listSubTenants({ limit: 100 })
      .then(setSubTenants)
      .catch(() => setSubTenants([]));
  }, [open, isMainTenant]);

  // Load the global Departments catalog whenever the modal opens. If it comes
  // back empty, jump straight into "New department" — an empty dropdown with
  // nothing to pick is a dead end, so skip it and let them create one inline.
  const loadDepartments = () => {
    setLoadingDepartments(true);
    departmentsAPI
      .list({ limit: 100, sortBy: 'name', sortOrder: 'asc' })
      .then((res) => {
        setDepartments(res.departments);
        if (res.departments.length === 0 && !departmentId) {
          setNewDept(true);
        } else if (departmentId && !res.departments.some((d) => d.id === departmentId)) {
          // The previously-assigned department was deleted since — clear it
          // rather than silently showing a blank/invalid selection.
          setDepartmentId(null);
          setDesignationId(null);
        }
      })
      .catch(() => setDepartments([]))
      .finally(() => setLoadingDepartments(false));
  };
  useEffect(() => {
    if (!open) return;
    loadDepartments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Load that department's Designations whenever the selected department
  // changes. An empty result is a dead end too, so jump into "New
  // designation" automatically instead of leaving an empty dropdown.
  const loadDesignations = (deptId: string) => {
    setLoadingDesignations(true);
    designationsAPI
      .list({ department: deptId, limit: 100, sortBy: 'name', sortOrder: 'asc' })
      .then((res) => {
        setDesignations(res.designations);
        if (res.designations.length === 0 && !designationId) {
          setNewDesignation(true);
        } else if (designationId && !res.designations.some((d) => d.id === designationId)) {
          setDesignationId(null);
        }
      })
      .catch(() => setDesignations([]))
      .finally(() => setLoadingDesignations(false));
  };
  useEffect(() => {
    if (!open || !departmentId) {
      setDesignations([]);
      return;
    }
    loadDesignations(departmentId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, departmentId]);

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setShowPassword(false);
    setNewDept(false); setNewDeptName(''); setNewDeptDesc('');
    setNewDesignation(false); setNewDesignationName(''); setNewDesignationDesc('');
    if (editing) {
      setName(editing.name);
      setEmail(editing.email);
      setPhone(editing.phone || '');
      setRoleName(editing.roleName || '');
      // Restore the local department/designation assignment for this staff member.
      const a = assignments.assignmentFor(editing.id);
      setDepartmentId(a.departmentId);
      setDesignationId(a.designationId);
      setGrants(editing.grants || {});
      // Seed both scoped modules from the record's per-module scope maps.
      setScopeMode({ ...(editing.subTenantScopes || {}) } as any);
      setManagedIds({ ...(editing.managedSubTenantsByModule || {}) } as any);
      setInvite(false);
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setRoleName('');
      setDepartmentId(null);
      setDesignationId(null);
      setGrants({});
      setScopeMode({});
      setManagedIds({});
      setInvite(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editing]);

  const scopeOf = (moduleKey: string): 'all' | 'select' => scopeMode[moduleKey] || 'all';
  const idsOf = (moduleKey: string): string[] => managedIds[moduleKey] || [];
  const setScopeOf = (moduleKey: string, mode: 'all' | 'select') =>
    setScopeMode((prev) => ({ ...prev, [moduleKey]: mode }));
  const toggleManaged = (moduleKey: string, id: string) =>
    setManagedIds((prev) => {
      const cur = prev[moduleKey] || [];
      return { ...prev, [moduleKey]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    });

  // One shared sub-tenant scope for this staff member — governs both which
  // sub-tenants they can manage (Sub Tenants module) and which sub-tenants'
  // data their Command Center shows. Rendered inline under either module.
  // moduleKey scopes this picker to its own state so the two pickers
  // (command-center vs sub-tenants) don't share selections. stopPropagation on
  // clicks so they never bubble to the matrix's module/page toggles.
  const renderScopePicker = (moduleKey: string, heading: string, allText: string) => {
    const mode = scopeOf(moduleKey);
    const ids = idsOf(moduleKey);
    return (
      <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3" onClick={(e) => e.stopPropagation()}>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">
          {heading}
        </p>
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden w-full mb-2">
          {(['all', 'select'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={(e) => { e.stopPropagation(); setScopeOf(moduleKey, m); }}
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === m
                  ? 'bg-violet-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              }`}
            >
              {m === 'all' ? 'All sub-tenants' : 'Select sub-tenants'}
            </button>
          ))}
        </div>
        {mode === 'select' ? (
          subTenants.length === 0 ? (
            <p className="text-[11px] text-slate-400 dark:text-slate-500">No sub-tenants yet.</p>
          ) : (
            <>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {subTenants.map((t) => {
                  const checked = ids.includes(t.id);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleManaged(moduleKey, t.id); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    >
                      <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${checked ? 'bg-violet-600 border-violet-600' : 'border-slate-300 dark:border-slate-600'}`}>
                        {checked && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-slate-400" /> {t.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                {ids.length} of {subTenants.length} selected.
              </p>
            </>
          )
        ) : (
          <p className="text-[11px] text-slate-400 dark:text-slate-500">{allText}</p>
        )}
      </div>
    );
  };

  const grantCount = useMemo(() => countGrants(grants), [grants]);

  const save = async () => {
    if (!name.trim()) return appToast.error('Enter the staff member’s name.');
    if (!departmentId) return appToast.error('Select a department.');
    if (!roleName.trim()) return appToast.error('Select or create a designation.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return appToast.error('Enter a valid email.');
    if (phone.trim() && phone.trim().replace(/\D/g, '').length < 7) return appToast.error('Enter a valid phone number, or leave it blank.');
    if (!editing) {
      if (!password) return appToast.error('Set a password — required for them to sign in.');
      if (!passwordValidation.isValid) return appToast.error(passwordValidation.error || 'Password does not meet the requirements.');
    }
    if (grantCount === 0) return appToast.error('Grant at least one feature.');

    // accounts[] (API-required) = the UNION of every scoped module's selection
    // (all → every sub-tenant). Each entry { tenantId: owner id, subTenantId }.
    const ownerId = String(user?.id || tenantId);
    const allIds = subTenants.map((t) => t.id);
    const idsForModule = (mk: string) => (scopeOf(mk) === 'all' ? allIds : idsOf(mk));
    const scopedModuleKeys = Object.keys(grants).filter(
      (k) => grants[k] && (k.startsWith('module:command-center') || k.startsWith('module:sub-tenants'))
    );
    const unionIds = Array.from(new Set(scopedModuleKeys.flatMap((k) => idsForModule(k))));
    const accounts = unionIds.map((subTenantId) => ({ tenantId: ownerId, subTenantId }));
    if (isMainTenant && scopedModuleKeys.length > 0 && accounts.length === 0) {
      return appToast.error('Assign at least one sub-tenant account.');
    }
    // Per-module scope maps → encoded into the permission strings by the service.
    const subTenantScopes = isMainTenant ? scopeMode : undefined;
    const managedSubTenantsByModule = isMainTenant ? managedIds : undefined;

    setSaving(true);
    try {
      if (editing) {
        await staffAPI.update(editing.id, { name, email, phone, roleName, grants, subTenantScopes, managedSubTenantsByModule, accounts });
        // Persist the local department/designation assignment for this staff member.
        assignments.setAssignment(editing.id, departmentId, designationId);
        appToast.success('Staff updated');
      } else {
        const created = await staffAPI.create(tenantId, { name, email, phone, password, roleName, grants, subTenantScopes, managedSubTenantsByModule, accounts, invite });
        if (created?.id) assignments.setAssignment(created.id, departmentId, designationId);
        appToast.success(invite ? 'Staff invited' : 'Staff added');
      }
      onSaved();
    } catch (err: any) {
      appToast.error(err?.message || 'Failed to save staff');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={saving ? undefined : onClose} closeOnBackdrop={!saving} panelClassName="max-w-2xl">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">
                {editing ? 'Edit staff access' : 'Add staff member'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Grant access to only the features they need.</p>
            </div>
          </div>
          <button onClick={onClose} disabled={saving} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-40">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"><User className="w-3 h-3 text-slate-400" /> Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" className={INPUT} />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"><Mail className="w-3 h-3 text-slate-400" /> Email</label>
              <input type="email" value={email} disabled={!!editing} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" className={`${INPUT} ${editing ? 'opacity-60 cursor-not-allowed' : ''}`} />
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"><Phone className="w-3 h-3 text-slate-400" /> Phone <span className="text-slate-400 font-normal">(optional)</span></label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className={INPUT} />
            </div>
            {!editing && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"><Lock className="w-3 h-3 text-slate-400" /> Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={`At least ${PASSWORD_MIN_LEN} characters`}
                    className={`${INPUT} pr-9`}
                  />
                  <button type="button" onClick={() => setShowPassword((v) => !v)} tabIndex={-1} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}
          </div>
          {!editing && password && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 -mt-1">
              {AUTH_MESSAGES.validation.password_requirements.map((req) => {
                const satisfied = passwordValidation.requirements[req.id as keyof typeof passwordValidation.requirements];
                return (
                  <div key={req.id} className="flex items-center gap-1.5">
                    {satisfied ? (
                      <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3 h-3 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                    )}
                    <span className={`text-[11px] ${satisfied ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      {req.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {!editing && (
            <p className="text-[11px] text-slate-400 dark:text-slate-500 -mt-2">
              This email and password are what they'll use to sign in.
            </p>
          )}

          {/* Department → Designation hierarchy (global catalogs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Department */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <Building2 className="w-3 h-3 text-slate-400" /> Department
                </label>
                <button type="button" onClick={() => { setNewDept((v) => !v); setNewDesignation(false); }} className="text-[11px] font-medium text-violet-600 dark:text-violet-400 inline-flex items-center gap-0.5">
                  <UserPlus className="w-3 h-3" /> New
                </button>
              </div>
              {newDept ? (
                <div className="space-y-1.5">
                  <input value={newDeptName} onChange={(e) => setNewDeptName(e.target.value)} placeholder="Department name" className={INPUT} autoFocus />
                  <input value={newDeptDesc} onChange={(e) => setNewDeptDesc(e.target.value)} placeholder="Description" className={INPUT} />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        const nm = newDeptName.trim();
                        const desc = newDeptDesc.trim();
                        if (nm.length < 2 || !desc) return;
                        setSavingDept(true);
                        try {
                          const d = await departmentsAPI.create({ name: nm, description: desc });
                          setDepartments((prev) => [...prev, d].sort((a, b) => a.name.localeCompare(b.name)));
                          setDepartmentId(d.id);
                          setDesignationId(null);
                          setNewDeptName(''); setNewDeptDesc(''); setNewDept(false);
                        } catch (err: any) {
                          appToast.error(err?.message || 'Failed to create department');
                        } finally {
                          setSavingDept(false);
                        }
                      }}
                      disabled={savingDept || newDeptName.trim().length < 2 || !newDeptDesc.trim()}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {savingDept ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Create
                    </button>
                    <button type="button" onClick={() => { setNewDept(false); setNewDeptName(''); setNewDeptDesc(''); }} className="px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <select
                  value={departmentId ?? ''}
                  onChange={(e) => { setDepartmentId(e.target.value || null); setDesignationId(null); }}
                  className={INPUT}
                  disabled={loadingDepartments}
                >
                  <option value="">{loadingDepartments ? 'Loading…' : 'Select department…'}</option>
                  {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}
            </div>

            {/* Designation (scoped to department) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <Briefcase className="w-3 h-3 text-slate-400" /> Designation
                </label>
                {departmentId && !newDept && (
                  <button type="button" onClick={() => setNewDesignation((v) => !v)} className="text-[11px] font-medium text-violet-600 dark:text-violet-400 inline-flex items-center gap-0.5">
                    <UserPlus className="w-3 h-3" /> New
                  </button>
                )}
              </div>
              {!departmentId ? (
                <div className={`${INPUT} flex items-center text-slate-400`}>Pick a department first</div>
              ) : newDesignation ? (
                <div className="space-y-1.5">
                  <input value={newDesignationName} onChange={(e) => setNewDesignationName(e.target.value)} placeholder="Designation name" className={INPUT} autoFocus />
                  <input value={newDesignationDesc} onChange={(e) => setNewDesignationDesc(e.target.value)} placeholder="Description" className={INPUT} />
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={async () => {
                        const nm = newDesignationName.trim();
                        const desc = newDesignationDesc.trim();
                        if (nm.length < 2 || !desc || !departmentId) return;
                        setSavingDesignation(true);
                        try {
                          const created = await designationsAPI.create({ name: nm, description: desc, department: departmentId });
                          setDesignations((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
                          setDesignationId(created.id);
                          setRoleName(created.name);
                          setNewDesignationName(''); setNewDesignationDesc(''); setNewDesignation(false);
                        } catch (err: any) {
                          appToast.error(err?.message || 'Failed to create designation');
                        } finally {
                          setSavingDesignation(false);
                        }
                      }}
                      disabled={savingDesignation || newDesignationName.trim().length < 2 || !newDesignationDesc.trim()}
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {savingDesignation ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Create
                    </button>
                    <button type="button" onClick={() => { setNewDesignation(false); setNewDesignationName(''); setNewDesignationDesc(''); }} className="px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500"><X className="w-4 h-4" /></button>
                  </div>
                </div>
              ) : (
                <select
                  value={designationId ?? ''}
                  onChange={(e) => {
                    const id = e.target.value || null;
                    setDesignationId(id);
                    setRoleName(designations.find((d) => d.id === id)?.name || '');
                  }}
                  className={INPUT}
                  disabled={loadingDesignations}
                >
                  <option value="">{loadingDesignations ? 'Loading…' : 'Select designation…'}</option>
                  {designations.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 -mt-1">
            Departments &amp; designations organise your team. Choose the exact features they can access below.
          </p>

          {/* Per-staff feature access */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600 dark:text-slate-400">Feature access</label>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">{grantCount} granted</span>
            </div>
            <PermissionMatrixEditor
              grants={grants}
              onChange={setGrants}
              lockAlwaysOn={false}
              renderModuleExtra={
                isMainTenant
                  ? (moduleKey, granted) => {
                      if (!granted) return null;
                      if (moduleKey === 'module:sub-tenants')
                        return renderScopePicker(
                          moduleKey,
                          'Which sub-tenants can they manage?',
                          'Can manage every current and future sub-tenant.'
                        );
                      if (moduleKey === 'module:command-center')
                        return renderScopePicker(
                          moduleKey,
                          'Which sub-tenants’ activity can they see?',
                          'Command Center shows every sub-tenant’s calls, leads and follow-ups.'
                        );
                      return null;
                    }
                  : undefined
              }
            />
          </div>

          {!editing && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" checked={invite} onChange={(e) => setInvite(e.target.checked)} className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-violet-600 focus:ring-violet-500/40" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400 inline-flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5" /> Send an invite email now
              </span>
            </label>
          )}
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2.5">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2 disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {saving ? 'Saving…' : editing ? 'Save access' : invite ? 'Add & invite' : 'Add staff'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default StaffEditorModal;
