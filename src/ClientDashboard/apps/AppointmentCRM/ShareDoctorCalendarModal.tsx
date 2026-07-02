import { useEffect, useState } from "react";
import { Check, Copy, Mail, Share2, Smartphone, X } from "lucide-react";
import ModalOverlay from "../../../components/ModalOverlay";
import type { StaffMember } from "./staffStore";
import { staffDisplayName } from "./staffStore";
import {
  buildInviteEmailBody,
  getDoctorCalendarUrl,
  getShareForStaff,
} from "./doctorCalendarShareStore";

interface Props {
  open: boolean;
  staff: StaffMember | null;
  onClose: () => void;
}

const ShareDoctorCalendarModal = ({ open, staff, onClose }: Props) => {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState<"link" | "all" | null>(null);

  useEffect(() => {
    if (!open || !staff) return;
    setShareUrl(getDoctorCalendarUrl(staff.id));
    setCopied(null);
  }, [open, staff]);

  const copyText = async (text: string, kind: "link" | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const openEmailClient = () => {
    if (!staff) return;
    const share = getShareForStaff(staff.id);
    const recipient = staff.email?.trim() || share?.doctorEmail?.trim();
    const subject = encodeURIComponent(
      `${share?.companyName ?? "Your clinic"} — Your appointment calendar`,
    );
    const body = encodeURIComponent(
      buildInviteEmailBody(
        share ?? {
          shareToken: "",
          staffId: staff.id,
          staffName: staffDisplayName(staff),
          doctorEmail: recipient ?? "",
          passwordHash: "",
          branchId: staff.branchId,
          companyName: "Your clinic",
          createdAt: new Date().toISOString(),
          snapshot: {
            staff,
            branchId: staff.branchId,
            branchName: "",
            companyName: "",
            bookings: [],
            offlineBlocks: [],
            availability: { staffId: staff.id, weekly: [] },
            leaves: [],
            syncedAt: new Date().toISOString(),
          },
        },
      ),
    );
    window.location.href = recipient
      ? `mailto:${recipient}?subject=${subject}&body=${body}`
      : `mailto:?subject=${subject}&body=${body}`;
  };

  if (!staff) return null;
  const name = staffDisplayName(staff);
  const inviteBody = buildInviteEmailBody(
    getShareForStaff(staff.id) ?? {
      shareToken: "",
      staffId: staff.id,
      staffName: name,
      doctorEmail: staff.email ?? "",
      passwordHash: "",
      branchId: staff.branchId,
      companyName: "Your clinic",
      createdAt: new Date().toISOString(),
      snapshot: {
        staff,
        branchId: staff.branchId,
        branchName: "",
        companyName: "",
        bookings: [],
        offlineBlocks: [],
        availability: { staffId: staff.id, weekly: [] },
        leaves: [],
        syncedAt: new Date().toISOString(),
      },
    },
  );

  return (
    <ModalOverlay open={open} panelClassName="max-w-md" zIndex={120} onClose={onClose} closeOnBackdrop>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
        <div className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Share calendar</h2>
              <p className="text-xs text-slate-500">{name}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            Share this link with {name}. They sign in with their ShivAI clinic account — no separate password needed.
          </p>

          <div className="rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200/70 dark:border-sky-800/50 px-3 py-2 flex gap-2">
            <Smartphone className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-sky-800 dark:text-sky-200 leading-relaxed">
              Works on mobile and desktop. They can add it to their home screen like an app.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
            <p className="text-xs text-slate-500 mb-1">Calendar link</p>
            <p className="font-mono text-[11px] break-all text-slate-800 dark:text-slate-200">{shareUrl}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => copyText(shareUrl, "link")}
              className="flex-1 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1"
            >
              {copied === "link" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              Copy link
            </button>
            <button
              type="button"
              onClick={() => copyText(inviteBody, "all")}
              className="flex-1 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1"
            >
              {copied === "all" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              Copy invite
            </button>
          </div>

          <button
            type="button"
            onClick={openEmailClient}
            className="w-full py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Send by email
          </button>

          <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-medium common-button-bg">
            Done
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default ShareDoctorCalendarModal;
