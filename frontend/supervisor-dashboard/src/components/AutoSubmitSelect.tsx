'use client';

import type { ReactNode } from 'react';

/** A <select> that submits its parent server-action form as soon as the value changes. */
export function AutoSubmitSelect({
  name, defaultValue, children, ariaLabel,
}: { name: string; defaultValue: string; children: ReactNode; ariaLabel: string }) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      aria-label={ariaLabel}
      className="compact"
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
    >
      {children}
    </select>
  );
}
