import { useState } from "react";
import { Ban, CalendarPlus, Coffee, Plus, Trash2 } from "lucide-react";
import {
  StaffOfflineBlock,
  OfflineBlockType,
  addOfflineBlock,
  blockTypeLabel,
  formatBlockTimeRange,
  getOfflineBlocksForStaff,
  isManualBookingBlock,
  removeOfflineBlock,
} from "./offlineBlocksStore";
import { toIsoDate } from "./availabilityStore";
import { useAppointmentIndustry } from "./industryConfig";

interface Props {
  staffId: string;
  staffName: string;
}

const EMPTY_FORM = {
  date: toIsoDate(new Date()),
  fromTime: "09:00",
  toTime: "09:30",
  patientName: "",
  patientId: "",
  notes: "",
};

const StaffOfflineBookingPanel = ({ staffId, staffName }: Props) => {
  const { terms } = useAppointmentIndustry();
  const [blocks, setBlocks] = useState<StaffOfflineBlock[]>(() => getOfflineBlocksForStaff(staffId));
  const [activeForm, setActiveForm] = useState<OfflineBlockType | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const refresh = () => setBlocks(getOfflineBlocksForStaff(staffId));

  const openForm = (type: OfflineBlockType) => {
    if (activeForm === type) {
      setActiveForm(null);
      return;
    }
    setActiveForm(type);
    if (type === "break") {
      setForm((f) => ({ ...f, fromTime: "13:00", toTime: "14:00", notes: "Lunch break" }));
    } else if (type === "manual_booking") {
      setForm((f) => ({ ...f, fromTime: "09:00", toTime: "09:30", notes: "" }));
    } else {
      setForm((f) => ({ ...f, notes: "" }));
    }
  };

  const handleAdd = () => {
    if (!activeForm || !form.date || !form.fromTime || !form.toTime) return;
    addOfflineBlock({
      staffId,
      date: form.date,
      fromTime: form.fromTime,
      toTime: form.toTime,
      type: activeForm,
      patientName: activeForm === "manual_booking" ? form.patientName : undefined,
      patientId: activeForm === "manual_booking" ? form.patientId : undefined,
      notes: form.notes,
    });
    setForm((f) => ({ ...f, patientName: "", patientId: "", notes: "" }));
    refresh();
  };

  const tabs: { type: OfflineBlockType; label: string; icon: typeof CalendarPlus }[] = [
    { type: "manual_booking", label: "Manual booking", icon: CalendarPlus },
    { type: "unavailable", label: "Unavailable", icon: Ban },
    { type: "break", label: "Lunch / break", icon: Coffee },
  ];

  return (
    <div className="space-y-3 pb-4 border-b border-slate-100 dark:border-slate-800">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <CalendarPlus className="w-4 h-4 text-amber-600" />
          <p className="text-xs font-semibold text-slate-800 dark:text-white">Manual booking & block slots</p>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
          Choose an action below — the form opens when you tap Manual booking, Unavailable, or Lunch / break.
        </p>
      </div>

      <div className="flex gap-1.5">
        {tabs.map(({ type, label, icon: Icon }) => {
          const active = activeForm === type;
          const isManual = type === "manual_booking";
          const isBreak = type === "break";
          return (
            <button
              key={type}
              type="button"
              onClick={() => openForm(type)}
              className={`flex-1 py-2 px-1.5 rounded-lg text-[10px] font-medium border transition-colors flex flex-col items-center gap-1 ${
                active
                  ? isManual
                    ? "bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300"
                    : isBreak
                      ? "bg-sky-50 dark:bg-sky-950/30 border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-400 dark:border-slate-500 text-slate-800 dark:text-slate-200"
                  : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          );
        })}
      </div>

      {activeForm && (
        <div className="space-y-2.5 pt-1 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 p-3">
          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="mt-1 w-full px-2.5 py-2 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">From</label>
              <input
                type="time"
                value={form.fromTime}
                onChange={(e) => setForm((f) => ({ ...f, fromTime: e.target.value }))}
                className="mt-1 w-full px-2.5 py-2 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">To</label>
              <input
                type="time"
                value={form.toTime}
                onChange={(e) => setForm((f) => ({ ...f, toTime: e.target.value }))}
                className="mt-1 w-full px-2.5 py-2 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          {activeForm === "manual_booking" && (
            <>
              <div>
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                  {terms.customer} name
                </label>
                <input
                  value={form.patientName}
                  onChange={(e) => setForm((f) => ({ ...f, patientName: e.target.value }))}
                  placeholder={`${staffName}'s walk-in ${terms.customer.toLowerCase()}`}
                  className="mt-1 w-full px-2.5 py-2 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                  {terms.customer} ID
                </label>
                <input
                  value={form.patientId}
                  onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
                  placeholder="e.g. UHID-10482"
                  className="mt-1 w-full px-2.5 py-2 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Notes</label>
            <input
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder={
                activeForm === "unavailable"
                  ? "e.g. Surgery, meeting"
                  : activeForm === "break"
                    ? "e.g. Lunch break"
                    : "Optional"
              }
              className="mt-1 w-full px-2.5 py-2 rounded-lg text-xs common-bg-icons border border-slate-200 dark:border-slate-700"
            />
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className={`w-full py-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 ${
              activeForm === "manual_booking"
                ? "bg-amber-500 hover:bg-amber-600 text-white"
                : activeForm === "break"
                  ? "bg-sky-600 hover:bg-sky-700 text-white"
                  : "bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 text-white"
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            {activeForm === "manual_booking"
              ? "Add manual booking"
              : activeForm === "break"
                ? "Add break"
                : "Block as unavailable"}
          </button>
        </div>
      )}

      {blocks.length > 0 && (
        <ul className="space-y-1.5 max-h-[140px] overflow-y-auto pt-1">
          {blocks
            .slice()
            .sort((a, b) => a.date.localeCompare(b.date) || a.fromTime.localeCompare(b.fromTime))
            .map((block) => {
              const isManual = isManualBookingBlock(block);
              const isBreak = block.type === "break";
              return (
                <li
                  key={block.id}
                  className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border text-[11px] ${
                    isManual
                      ? "bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/70 dark:border-amber-800/50"
                      : isBreak
                        ? "bg-sky-50/80 dark:bg-sky-950/20 border-sky-200/70 dark:border-sky-800/50"
                        : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="min-w-0 flex items-start gap-1.5">
                    {isManual ? (
                      <CalendarPlus className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    ) : isBreak ? (
                      <Coffee className="w-3.5 h-3.5 text-sky-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <Ban className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800 dark:text-white truncate">
                        {block.date} · {formatBlockTimeRange(block)}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 truncate">
                        {isManual
                          ? [block.patientName || "Manual booking", block.patientId].filter(Boolean).join(" · ")
                          : block.notes || blockTypeLabel(block)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      removeOfflineBlock(block.id);
                      refresh();
                    }}
                    className="text-slate-400 hover:text-red-500 flex-shrink-0"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
};

export default StaffOfflineBookingPanel;
