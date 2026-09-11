import { useMemo, useState, type ReactNode } from 'react';
import { ChevronDown, Search, Lock } from 'lucide-react';
import SearchableSelect from '../../components/SearchableSelect';
import { PERMISSION_REGISTRY, LOCKED_MODULE_KEYS } from '../../permissions/registry';
import type { PermissionGrantMap, PermissionTemplate } from '../../permissions/types';

interface PermissionMatrixEditorProps {
  grants: PermissionGrantMap;
  onChange: (grants: PermissionGrantMap) => void;
  templates: PermissionTemplate[];
  /** Optional extra content rendered inside a module's expanded body (e.g. a
   * sub-tenant scope picker under the Sub Tenants module). Called per module
   * with whether that module is currently granted. Return null to render
   * nothing for a module. */
  renderModuleExtra?: (moduleKey: string, granted: boolean) => ReactNode;
  /** Lock the always-on modules (Dashboard) so they can't be toggled off.
   * Defaults true (sub-tenants). Pass false for Staff so a tenant can choose
   * whether a staff member gets Dashboard access. */
  lockAlwaysOn?: boolean;
}

/** Toggle switch matching the app's compact control sizing (no external lib). */
const Toggle = ({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => !disabled && onChange(!checked)}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${
      checked ? 'bg-violet-600' : 'bg-slate-300 dark:bg-slate-600'
    } ${disabled ? 'opacity-70 cursor-not-allowed' : ''}`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
        checked ? 'translate-x-5' : 'translate-x-1'
      }`}
    />
  </button>
);

// Modules every sub-tenant always has and can't be toggled off (Dashboard is the
// landing surface). Their toggles render locked-on. Sourced from the registry.
const LOCKED_MODULES = new Set<string>(LOCKED_MODULE_KEYS);

const PermissionMatrixEditor = ({ grants, onChange, templates, renderModuleExtra, lockAlwaysOn = true }: PermissionMatrixEditorProps) => {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const setGrant = (key: string, value: boolean) => {
    onChange({ ...grants, [key]: value });
  };

  // Granting a page (or action) implies its module is on — so a child grant is
  // never orphaned under a disabled module. Turning a child off leaves the
  // module as-is.
  const setChildGrant = (moduleKey: string, key: string, value: boolean) => {
    const next = { ...grants, [key]: value };
    if (value) next[moduleKey] = true;
    onChange(next);
  };

  // Toggling a module off cascades to its pages/actions (spec §5.5) — toggling
  // it on does NOT auto-grant children, so a Main Business isn't surprised by
  // access it didn't explicitly check.
  const setModuleGrant = (moduleKey: string, pageKeys: string[], actionKeys: string[], value: boolean) => {
    const next = { ...grants, [moduleKey]: value };
    if (!value) {
      for (const k of pageKeys) next[k] = false;
      for (const k of actionKeys) next[k] = false;
    }
    onChange(next);
  };

  const applyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) onChange({ ...template.grants });
  };

  const filteredRegistry = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PERMISSION_REGISTRY;
    return PERMISSION_REGISTRY.map((mod) => {
      const modMatches = mod.label.toLowerCase().includes(q);
      const pages = mod.pages.filter(
        (page) =>
          modMatches ||
          page.label.toLowerCase().includes(q) ||
          (page.actions || []).some((a) => a.label.toLowerCase().includes(q)),
      );
      return { ...mod, pages };
    }).filter((mod) => mod.pages.length > 0 || mod.label.toLowerCase().includes(q));
  }, [query]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 z-10" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search modules, pages, actions…"
            className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 text-slate-800 dark:text-white text-sm transition-all"
          />
        </div>
        <div className="sm:w-56">
          <SearchableSelect
            options={templates.map((t) => ({ value: t.id, label: `Apply: ${t.name}` }))}
            value=""
            onChange={applyTemplate}
            placeholder="Apply a template…"
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700 overflow-hidden">
        {filteredRegistry.map((mod) => {
          const pageKeys = mod.pages.map((p) => p.key);
          const actionKeys = mod.pages.flatMap((p) => (p.actions || []).map((a) => a.key));
          const isCollapsed = collapsed[mod.key] ?? false;
          const isLocked = lockAlwaysOn && LOCKED_MODULES.has(mod.key);
          // Locked modules (Dashboard) are always granted and can't be toggled.
          const moduleGranted = isLocked || grants[mod.key] === true;

          return (
            <div key={mod.key} className="bg-white dark:bg-slate-900">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-50/60 dark:bg-slate-800/40">
                <button
                  type="button"
                  onClick={() => setCollapsed((prev) => ({ ...prev, [mod.key]: !isCollapsed }))}
                  className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                </button>
                <span className="text-sm font-semibold text-slate-800 dark:text-white flex-1">{mod.label}</span>
                {isLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                    <Lock className="w-3 h-3" /> Always on
                  </span>
                )}
                <Toggle
                  checked={moduleGranted}
                  disabled={isLocked}
                  onChange={(v) => setModuleGrant(mod.key, pageKeys, actionKeys, v)}
                />
              </div>

              {!isCollapsed && (
                <div className={`divide-y divide-slate-100 dark:divide-slate-800 ${moduleGranted ? '' : 'opacity-60'}`}>
                  {mod.pages.map((page) => (
                    <div key={page.key} className="px-3 py-2 pl-9">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex-1">{page.label}</span>
                        <Toggle
                          checked={isLocked || grants[page.key] === true}
                          disabled={isLocked}
                          onChange={(v) => setChildGrant(mod.key, page.key, v)}
                        />
                      </div>
                      {(isLocked || grants[page.key] === true) && page.actions && page.actions.length > 0 && (
                        <div className="mt-1.5 space-y-1 pl-3 border-l border-slate-200 dark:border-slate-700">
                          {page.actions.map((action) => (
                            <div key={action.key} className="flex items-center gap-2 py-0.5">
                              <span className="text-[11px] text-slate-500 dark:text-slate-400 flex-1">{action.label}</span>
                              <Toggle
                                checked={isLocked || grants[action.key] === true}
                                disabled={isLocked}
                                onChange={(v) => setChildGrant(mod.key, action.key, v)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  {renderModuleExtra && renderModuleExtra(mod.key, moduleGranted) && (
                    <div className="px-3 py-2.5 pl-9">{renderModuleExtra(mod.key, moduleGranted)}</div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PermissionMatrixEditor;
