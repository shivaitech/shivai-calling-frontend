import { useEffect, useState } from "react";
import { Check, Copy, Loader2, Mail, Share2, Smartphone, X } from "lucide-react";
import ModalOverlay from "../../../components/ModalOverlay";
import type { StaffMember } from "./staffStore";
import { staffDisplayName } from "./staffStore";
import {
  createOrUpdateDoctorShare,
  getDoctorCalendarUrl,
  getShareForStaff,
  markShareSent,
  openInviteEmailClient,
  buildInviteEmailBody,
} from "./doctorCalendarShareStore";
import { sendDoctorShareEmailViaApi, syncDoctorShareToServer } from "./doctorCalendarShareAPI";

interface Props {
  open: boolean;
  staff: StaffMember | null;
  onClose: () => void;
}

const ShareDoctorCalendarModal = ({ open, staff, onClose }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState<"link" | "all" | null>(null);
  const [emailViaApi, setEmailViaApi] = useState(false);

  useEffect(() => {
    if (!open || !staff) return;
    const existing = getShareForStaff(staff.id);
    setEmail(staff.email ?? existing?.doctorEmail ?? "");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSent(false);
    setShareUrl(existing ? getDoctorCalendarUrl(existing.shareToken) : "");
    setCopied(null);
    setEmailViaApi(false);
  }, [open, staff]);

  const handleSend = async () => {
    if (!staff) return;
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid doctor email");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const share = await createOrUpdateDoctorShare({
        staffId: staff.id,
        staffName: staffDisplayName(staff),
        doctorEmail: email,
        password,
        branchId: staff.branchId,
      });
      const url = getDoctorCalendarUrl(share.shareToken);
      setShareUrl(url);

      await syncDoctorShareToServer(share, password);
      const apiSent = await sendDoctorShareEmailViaApi(share, password);
      setEmailViaApi(apiSent);

      if (!apiSent) {
        openInviteEmailClient(share, password);
      }

      markShareSent(share.shareToken);
      setSent(true);
    } catch {
      setError("Could not create share link. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const copyText = async (text: string, kind: "link" | "all") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  if (!staff) return null;
  const name = staffDisplayName(staff);

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

        {!sent ? (
          <div className="px-5 py-4 space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed">
              Create login credentials for {name}. They can open the calendar on mobile or laptop and install it like an app.
            </p>

            <div>
              <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Doctor email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.com"
                className="mt-1 w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Confirm</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg text-sm common-bg-icons border border-slate-200 dark:border-slate-700"
                />
              </div>
            </div>

            <div className="rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200/70 dark:border-sky-800/50 px-3 py-2 flex gap-2">
              <Smartphone className="w-4 h-4 text-sky-600 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-sky-800 dark:text-sky-200 leading-relaxed">
                The invite email includes install steps for iPhone, Android, and desktop (Add to Home Screen / Install app).
              </p>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="button"
              onClick={handleSend}
              disabled={saving}
              className="w-full py-2.5 rounded-xl text-sm font-medium common-button-bg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {saving ? "Sending…" : "Create & send by email"}
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-sm font-medium">
              <Check className="w-4 h-4" />
              {emailViaApi ? "Invite email sent" : "Invite ready — email client opened"}
            </div>
            <p className="text-xs text-slate-500">
              {emailViaApi
                ? `Credentials were emailed to ${email}.`
                : `If your mail app did not open, copy the details below and send them to ${email}.`}
            </p>

            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 space-y-2 text-xs">
              <div>
                <p className="text-slate-500">Link</p>
                <p className="font-mono text-[11px] break-all text-slate-800 dark:text-slate-200">{shareUrl}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-slate-500">Email</p>
                  <p className="font-medium">{email}</p>
                </div>
                <div>
                  <p className="text-slate-500">Password</p>
                  <p className="font-medium font-mono">{password}</p>
                </div>
              </div>
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
                onClick={() => {
                  const share = getShareForStaff(staff.id);
                  if (share) copyText(buildInviteEmailBody(share, password), "all");
                }}
                className="flex-1 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1"
              >
                {copied === "all" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                Copy invite
              </button>
            </div>

            <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl text-sm font-medium common-button-bg">
              Done
            </button>
          </div>
        )}
      </div>
    </ModalOverlay>
  );
};

export default ShareDoctorCalendarModal;
