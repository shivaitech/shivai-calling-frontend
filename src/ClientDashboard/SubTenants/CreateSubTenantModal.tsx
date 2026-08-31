import { useEffect, useState } from 'react';
import { Building2, X, Loader2, User, Mail, Phone, MapPin, Globe, Briefcase, Lock, Eye, EyeOff } from 'lucide-react';
import ModalOverlay from '../../components/ModalOverlay';
import SearchableSelect from '../../components/SearchableSelect';
import { tenantAPI } from '../../services/tenantAPI';
import type { PermissionTemplate } from '../../permissions/types';

interface CreateSubTenantModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const NAME_MAX_LEN = 80;
const NOTES_MAX_LEN = 300;
const PASSWORD_MIN_LEN = 8;

const INDUSTRY_OPTIONS = [
  'Healthcare',
  'Real Estate',
  'Legal Services',
  'Automotive Services',
  'Retail / E-commerce',
  'Hospitality',
  'Education',
  'Finance & Insurance',
  'Home Services',
  'Other',
].map((v) => ({ value: v, label: v }));

const FieldLabel = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
  <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
    <Icon className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {children}
  </label>
);

const inputClass =
  'w-full px-3 py-2 rounded-lg text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-violet-500/40 text-slate-800 dark:text-white';

const CreateSubTenantModal = ({ open, onClose, onCreated }: CreateSubTenantModalProps) => {
  // Company
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [location, setLocation] = useState('');
  // Contact
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  // Plan
  const [maxAgents, setMaxAgents] = useState('5');
  const [maxUsers, setMaxUsers] = useState('10');
  const [templateId, setTemplateId] = useState('tpl-standard');
  const [templates, setTemplates] = useState<PermissionTemplate[]>([]);
  // Invite
  const [sendInvite, setSendInvite] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName('');
    setIndustry('');
    setWebsite('');
    setLocation('');
    setOwnerName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setPhone('');
    setNotes('');
    setMaxAgents('5');
    setMaxUsers('10');
    setTemplateId('tpl-standard');
    setSendInvite(true);
    setError(null);
    tenantAPI.listTemplates().then(setTemplates);
  }, [open]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Give this sub-tenant a business name.');
      return;
    }
    if (trimmedName.length > NAME_MAX_LEN) {
      setError(`Business name must be ${NAME_MAX_LEN} characters or fewer.`);
      return;
    }
    if (!ownerName.trim()) {
      setError("Enter the business owner's or main contact's name.");
      return;
    }
    if (!email.trim()) {
      setError('Add an email — required for them to sign in.');
      return;
    }
    if (!password) {
      setError('Set a password — required for them to sign in.');
      return;
    }
    if (password.length < PASSWORD_MIN_LEN) {
      setError(`Password must be at least ${PASSWORD_MIN_LEN} characters.`);
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await tenantAPI.createSubTenant({
        name: trimmedName,
        sendInvite,
        email: email.trim(),
        password,
        templateId,
        maxAgents: Number(maxAgents) || undefined,
        maxUsers: Number(maxUsers) || undefined,
        contact: {
          ownerName: ownerName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          location: location.trim(),
          industry: industry || undefined,
          website: website.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      });
      onCreated();
    } catch (err: any) {
      setError(err?.message || 'Failed to create sub-tenant. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalOverlay open={open} onClose={isSubmitting ? undefined : onClose} closeOnBackdrop={!isSubmitting} panelClassName="max-w-xl">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">Add Sub Tenant</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                They'll get their own ShivAI panel under your branding.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex-shrink-0 disabled:opacity-40"
          >
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Company details */}
          <div className="space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Company Details
            </p>
            <div>
              <FieldLabel icon={Building2}>Business Name</FieldLabel>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, NAME_MAX_LEN))}
                placeholder="e.g. Northwind Dental Clinic"
                className={inputClass}
              />
              <div className="flex justify-end mt-1">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{name.length}/{NAME_MAX_LEN}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel icon={Briefcase}>Industry</FieldLabel>
                <SearchableSelect
                  options={INDUSTRY_OPTIONS}
                  value={industry}
                  onChange={setIndustry}
                  placeholder="Select industry…"
                />
              </div>
              <div>
                <FieldLabel icon={MapPin}>Location</FieldLabel>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, State"
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <FieldLabel icon={Globe}>Website (optional)</FieldLabel>
              <input
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="theirbusiness.com"
                className={inputClass}
              />
            </div>
          </div>

          {/* Contact */}
          <div className="space-y-3 pt-1 border-t border-slate-200 dark:border-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pt-3">
              Primary Contact
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel icon={User}>Owner / Contact Name</FieldLabel>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Full name"
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel icon={Phone}>Phone (optional)</FieldLabel>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel icon={Mail}>Email</FieldLabel>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@theirbusiness.com"
                  className={inputClass}
                />
              </div>
              <div>
                <FieldLabel icon={Lock}>Password</FieldLabel>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={`At least ${PASSWORD_MIN_LEN} characters`}
                    className={`${inputClass} pr-9`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 -mt-1.5">
              This email and password are what they'll use to sign in to their ShivAI panel.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, NOTES_MAX_LEN))}
                placeholder="Anything worth remembering about this client…"
                rows={2}
                className={`${inputClass} resize-none`}
              />
              <div className="flex justify-end mt-1">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{notes.length}/{NOTES_MAX_LEN}</span>
              </div>
            </div>
          </div>

          {/* Plan & permissions */}
          <div className="space-y-3 pt-1 border-t border-slate-200 dark:border-slate-700">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 pt-3">
              Plan & Access
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Max Employees</label>
                <input
                  type="number"
                  min={1}
                  value={maxAgents}
                  onChange={(e) => setMaxAgents(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">Max Team Members</label>
                <input
                  type="number"
                  min={1}
                  value={maxUsers}
                  onChange={(e) => setMaxUsers(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                Starting Permission Template
              </label>
              <SearchableSelect
                options={templates.map((t) => ({ value: t.id, label: t.name }))}
                value={templateId}
                onChange={setTemplateId}
                placeholder="Choose a template…"
              />
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                You can fine-tune exactly what they can access afterward.
              </p>
            </div>
          </div>

          <div className="pt-1 border-t border-slate-200 dark:border-slate-700">
            <label className="flex items-center gap-2 py-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-violet-600 focus:ring-violet-500/40"
              />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Send an invite link to this email now</span>
            </label>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 flex gap-2.5">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-700 text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
            {isSubmitting ? 'Creating…' : 'Create Sub Tenant'}
          </button>
        </div>
      </div>
    </ModalOverlay>
  );
};

export default CreateSubTenantModal;
