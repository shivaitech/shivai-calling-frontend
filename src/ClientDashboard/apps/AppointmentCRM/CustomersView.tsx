import { useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import GlassCard from "../../../components/GlassCard";
import { SectionTitle } from "../SupportCRM/ui";
import { useAppointmentIndustry } from "./industryConfig";
import { MOCK_CUSTOMERS } from "./mockData";

const CustomersView = () => {
  const { terms } = useAppointmentIndustry();
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const list = MOCK_CUSTOMERS.filter((c) =>
    `${c.name} ${c.phone}`.toLowerCase().includes(q.toLowerCase()),
  );

  const detail = selected ? MOCK_CUSTOMERS.find((c) => c.id === selected) : null;

  if (detail) {
    return (
      <div className="space-y-5">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="text-sm text-violet-600 dark:text-violet-400 font-medium hover:underline"
        >
          ← All {terms.customers}
        </button>
        <GlassCard>
          <div className="p-6">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{detail.name}</h2>
            <p className="text-sm text-slate-500 mt-1">{detail.phone} {detail.email && `· ${detail.email}`}</p>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <p className="text-2xl font-bold text-slate-800 dark:text-white">{detail.totalAppointments}</p>
                <p className="text-xs text-slate-500">Total visits</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-violet-50 dark:bg-violet-900/20">
                <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">{detail.upcoming}</p>
                <p className="text-xs text-slate-500">Upcoming</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{detail.noShows}</p>
                <p className="text-xs text-slate-500">No-shows</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-4">
              {detail.tags.map((t) => (
                <span key={t} className="text-[10px] px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title={terms.customers}
        subtitle={`360° view — ${terms.appointments.toLowerCase()}, history & contact details`}
        right={
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${terms.customers.toLowerCase()}…`}
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelected(c.id)}
            className="text-left"
          >
            <GlassCard hover>
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white truncate">{c.name}</p>
                  <p className="text-xs text-slate-500">{c.phone}</p>
                  <p className="text-[11px] text-slate-400 mt-1">{c.upcoming} upcoming · {c.totalAppointments} total</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </div>
            </GlassCard>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomersView;
