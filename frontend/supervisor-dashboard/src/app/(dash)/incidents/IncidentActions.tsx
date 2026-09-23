'use client';

import { useActionState, useEffect, useRef } from 'react';
import { updateIncident } from '@/app/actions';
import { SubmitButton } from '@/components/SubmitButton';
import { humanize, INCIDENT_STATUSES } from '@/lib/domain';

export function IncidentActions({ id, status }: { id: string; status: string }) {
  const [state, action] = useActionState(updateIncident, undefined);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state?.ok && notesRef.current) notesRef.current.value = '';
  }, [state]);

  return (
    <form action={action} style={{ display: 'grid', gap: 8 }}>
      <input type="hidden" name="incidentId" value={id} />
      <div className="incident-form">
        <select name="status" defaultValue={status === 'open' ? 'investigating' : status} aria-label="New status">
          {INCIDENT_STATUSES.map((s) => (
            <option key={s} value={s}>{humanize(s)}</option>
          ))}
        </select>
        <textarea
          ref={notesRef}
          name="resolutionNotes"
          rows={2}
          style={{ minHeight: 40 }}
          placeholder="Supervisor notes — findings, corrective action (required to resolve)"
          maxLength={2000}
        />
        <SubmitButton className="btn sm" pendingLabel="Saving…">Update</SubmitButton>
      </div>
      {state?.error && <div className="notice error">{state.error}</div>}
      {state?.ok && <div className="notice ok">{state.ok}</div>}
    </form>
  );
}
