import React from 'react';
import type { TenantStatus } from '../../../permissions/types';

const STATUS_META: Record<TenantStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  suspended: { label: 'Suspended', className: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' },
  pending_invite: { label: 'Invite Pending', className: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' },
};

const TenantStatusBadge: React.FC<{ status: TenantStatus }> = ({ status }) => {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${meta.className}`}>
      {meta.label}
    </span>
  );
};

export default TenantStatusBadge;
