import { Plus, Trash2, Info } from 'lucide-react';
import { useRef, useState } from 'react';
import { SheetColumn } from '../../services/authAPI';
import ColumnRoleGuide from './ColumnRoleGuide';
import ColumnAutoClassifyGuide from './ColumnAutoClassifyGuide';
import {
  COLUMN_ROLE_OPTIONS,
  createEmptyColumn,
  fieldFromHeader,
  isRecordIdColumn,
  getRecordIdPrefixDefault,
  resolveColumnRole,
  roleBadgeClass,
} from './sheetColumnUtils';
import type { SheetColumnRole } from './sheetTypes';

let nextRowKeyId = 0;
function createRowKey() {
  nextRowKeyId += 1;
  return `sheet-col-${nextRowKeyId}`;
}

interface SheetColumnEditorProps {
  columns: SheetColumn[];
  onChange: (columns: SheetColumn[]) => void;
  disabled?: boolean;
  compact?: boolean;
}

const SheetColumnEditor = ({
  columns,
  onChange,
  disabled,
  compact = true,
}: SheetColumnEditorProps) => {
  const [roleGuideOpen, setRoleGuideOpen] = useState(false);
  const [clsGuideOpen, setClsGuideOpen] = useState(false);
  const rowKeysRef = useRef<string[]>([]);
  while (rowKeysRef.current.length < columns.length) {
    rowKeysRef.current.push(createRowKey());
  }
  rowKeysRef.current.length = columns.length;

  const updateAt = (index: number, patch: Partial<SheetColumn>) => {
    const next = columns.map((col, i) => {
      if (i !== index) return col;
      const updated = { ...col, ...patch };
      if (patch.role === 'caller') {
        updated.auto_classify = true;
      } else if (patch.role && patch.role !== 'caller') {
        updated.auto_classify = false;
      }
      if (patch.header !== undefined && !isRecordIdColumn(updated)) {
        updated.field = fieldFromHeader(patch.header);
      }
      return updated;
    });
    onChange(next);
  };

  const removeAt = (index: number) => {
    rowKeysRef.current.splice(index, 1);
    onChange(columns.filter((_, i) => i !== index));
  };

  const addColumn = () => {
    onChange([...columns, createEmptyColumn()]);
  };

  const inputBase =
    'w-full h-8 px-2 text-xs rounded-lg outline-none transition-colors min-w-0 ' +
    'text-slate-800 dark:text-slate-100 placeholder:text-slate-400 ' +
    'border border-slate-200/70 dark:border-slate-700/70 ' +
    'bg-white/90 dark:bg-slate-900/60 ' +
    'focus:border-blue-400/80 focus:ring-2 focus:ring-blue-500/10';

  if (!compact) {
    return (
      <div className="space-y-2">
        {columns.length === 0 ? (
          <EmptyHint />
        ) : (
          <div className="space-y-2 max-h-[min(340px,50vh)] overflow-y-auto pr-0.5">
            {columns.map((col, index) => (
              <CardRow
                key={rowKeysRef.current[index]}
                col={col}
                index={index}
                disabled={disabled}
                removeAt={removeAt}
              />
            ))}
          </div>
        )}
        <AddButton disabled={disabled} onClick={addColumn} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1">
        <ColumnRoleGuide open={roleGuideOpen} onOpenChange={setRoleGuideOpen} />
        <ColumnAutoClassifyGuide open={clsGuideOpen} onOpenChange={setClsGuideOpen} />
      </div>
      {columns.length === 0 ? (
        <EmptyHint />
      ) : (
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden bg-slate-50/40 dark:bg-slate-900/20">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[468px] table-fixed border-collapse">
              <colgroup>
                <col style={{ width: '108px' }} />
                <col style={{ width: '112px' }} />
                <col style={{ width: '92px' }} />
                <col style={{ width: '36px' }} />
                <col style={{ width: '48px' }} />
                <col style={{ width: '36px' }} />
                <col style={{ width: '32px' }} />
              </colgroup>
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-700/80">
                  {['Column', 'Field', 'Role', 'Req', 'Prefix', 'Cls', ''].map((label, i) => (
                    <th
                      key={label || 'del'}
                      className={`px-2 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 ${
                        i >= 3 && i <= 5 ? 'text-center' : 'text-left'
                      }`}
                      title={
                        label === 'Req'
                          ? 'Required'
                          : label === 'Cls'
                            ? 'Auto-classify — AI fills from conversation'
                            : label === 'Prefix'
                              ? 'ID prefix — e.g. TKT becomes TKT-001'
                              : label === 'Field'
                                ? 'Auto-generated from column name'
                                : undefined
                      }
                    >
                      {label === 'Role' ? (
                        <span className="inline-flex items-center gap-1">
                          Role
                          <button
                            type="button"
                            onClick={() => setRoleGuideOpen(v => !v)}
                            className={`p-0.5 rounded-md transition-colors ${
                              roleGuideOpen
                                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40'
                                : 'text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                            }`}
                            aria-label="Show role guide"
                            title="What do column roles mean?"
                          >
                            <Info className="w-3 h-3" />
                          </button>
                        </span>
                      ) : label === 'Cls' ? (
                        <span className="inline-flex items-center gap-1 justify-center">
                          Cls
                          <button
                            type="button"
                            onClick={() => setClsGuideOpen(v => !v)}
                            className={`p-0.5 rounded-md transition-colors ${
                              clsGuideOpen
                                ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40'
                                : 'text-slate-400 hover:text-violet-600 dark:hover:text-violet-400'
                            }`}
                            aria-label="Show auto-classify guide"
                            title="What is auto-classify?"
                          >
                            <Info className="w-3 h-3" />
                          </button>
                        </span>
                      ) : (
                        label
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {columns.map((col, index) => {
                  const recordId = isRecordIdColumn(col);
                  const canAutoClassify =
                    resolveColumnRole(col.role) === 'caller' && !recordId;
                  const displayField =
                    col.field?.trim() ||
                    (col.header?.trim() ? fieldFromHeader(col.header) : '');
                  return (
                  <tr
                    key={rowKeysRef.current[index]}
                    className="group border-b border-slate-100 dark:border-slate-800/80 last:border-0 hover:bg-white/70 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="px-2 py-1">
                      <input
                        type="text"
                        value={col.header}
                        disabled={disabled}
                        onChange={e => updateAt(index, { header: e.target.value })}
                        placeholder="Name"
                        title={col.header}
                        className={`${inputBase} font-medium`}
                      />
                    </td>
                    <td className="px-2 py-1">
                      <div
                        className={`${inputBase} font-mono text-[11px] text-slate-500 dark:text-slate-400 bg-slate-100/90 dark:bg-slate-800/60 cursor-default select-all`}
                        title="System-generated from column name"
                      >
                        {displayField || (
                          <span className="text-slate-300 dark:text-slate-600">auto</span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1">
                      <select
                        value={resolveColumnRole(col.role)}
                        disabled={disabled || recordId}
                        onChange={e =>
                          updateAt(index, {
                            role: e.target.value as SheetColumnRole,
                          })
                        }
                        className={`${inputBase} text-[11px] font-medium border ${roleBadgeClass(col.role)} cursor-pointer ${recordId ? 'opacity-90' : ''}`}
                      >
                        {COLUMN_ROLE_OPTIONS.map(opt => (
                          <option key={opt.label} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-1 py-1 text-center align-middle">
                      <label className="inline-flex items-center justify-center w-8 h-8 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={recordId || col.required}
                          disabled={disabled || recordId}
                          onChange={e => updateAt(index, { required: e.target.checked })}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500/30 dark:border-slate-600"
                        />
                      </label>
                    </td>
                    <td className="px-1.5 py-1 text-center align-middle">
                      {recordId ? (
                        <input
                          type="text"
                          value={col.prefix ?? ''}
                          disabled={disabled}
                          onChange={e => {
                            const v = e.target.value
                              .toUpperCase()
                              .replace(/[^A-Z0-9]/g, '')
                              .slice(0, 8);
                            updateAt(index, { prefix: v || undefined });
                          }}
                          placeholder={getRecordIdPrefixDefault(col)}
                          title={`ID prefix (e.g. ${getRecordIdPrefixDefault(col)}-001)`}
                          className={`${inputBase} text-center text-[11px] font-mono font-semibold uppercase px-1`}
                        />
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-1 py-1 text-center align-middle">
                      {canAutoClassify ? (
                        <label className="inline-flex items-center justify-center w-8 h-8 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(col.auto_classify)}
                            disabled={disabled}
                            onChange={e =>
                              updateAt(index, { auto_classify: e.target.checked })
                            }
                            className="w-3.5 h-3.5 rounded border-slate-300 text-violet-600 focus:ring-violet-500/30 dark:border-slate-600"
                          />
                        </label>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-1 py-1 text-center align-middle">
                      {!isRecordIdColumn(col) && (
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => removeAt(index)}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-slate-300 opacity-0 group-hover:opacity-100 hover:!opacity-100 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all disabled:opacity-40"
                          aria-label="Remove column"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <AddButton disabled={disabled} onClick={addColumn} />
    </div>
  );
};

function EmptyHint() {
  return (
    <p className="text-xs text-slate-500 dark:text-slate-400 py-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/20">
      No columns yet. Pick a template or add columns below.
    </p>
  );
}

function AddButton({ disabled, onClick }: { disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 dark:hover:text-blue-400 transition-colors disabled:opacity-40"
    >
      <Plus className="w-3.5 h-3.5" />
      Add column
    </button>
  );
}

function CardRow({
  col,
  index,
  disabled,
  removeAt,
}: {
  col: SheetColumn;
  index: number;
  disabled?: boolean;
  removeAt: (i: number) => void;
}) {
  return (
    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/40">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-md border ${roleBadgeClass(col.role)}`}>
          {resolveColumnRole(col.role)}
        </span>
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{col.header}</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => removeAt(index)}
          className="ml-auto p-1 text-slate-400 hover:text-red-500"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default SheetColumnEditor;
