'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { createTask } from '@/app/actions';
import { SubmitButton } from '@/components/SubmitButton';
import { estimateMinutes, humanize, PRIORITIES, TASK_TYPES, WEATHER } from '@/lib/domain';
import type { Machine, OperatorBasic } from '@/lib/queries';

export function NewTaskForm({
  operators, machines, defaultOperator,
}: { operators: OperatorBasic[]; machines: Machine[]; defaultOperator?: string }) {
  const [state, action] = useActionState(createTask, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  const [type, setType] = useState<string>(TASK_TYPES[0]);
  const [weather, setWeather] = useState<string>('clear');
  const [operator, setOperator] = useState(defaultOperator ?? '');
  const skill = operators.find((o) => o.id === operator)?.skillLevel;
  const suggested = estimateMinutes(type, weather, skill);
  const [estimate, setEstimate] = useState<string>(String(suggested));
  const [touched, setTouched] = useState(false);

  // Keep the estimate in sync with the formula until the supervisor overrides it.
  useEffect(() => {
    if (!touched) setEstimate(String(suggested));
  }, [suggested, touched]);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
      setType(TASK_TYPES[0]);
      setWeather('clear');
      setOperator(defaultOperator ?? '');
      setTouched(false);
    }
  }, [state, defaultOperator]);

  return (
    <form ref={formRef} action={action} className="form-grid">
      <label className="field span-2">
        <span className="label">Title</span>
        <input name="title" placeholder="e.g. Trench East Drainage Line" required maxLength={200} />
      </label>
      <label className="field">
        <span className="label">Task type</span>
        <select name="type" value={type} onChange={(e) => setType(e.target.value)}>
          {TASK_TYPES.map((t) => (
            <option key={t} value={t}>{humanize(t)}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="label">Priority</span>
        <select name="priority" defaultValue="medium">
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{humanize(p)}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="label">Assign to operator</span>
        <select name="assignedTo" value={operator} onChange={(e) => setOperator(e.target.value)}>
          <option value="">Unassigned (visible to all operators)</option>
          {operators.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} · {o.id} · {humanize(o.skillLevel)}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="label">Machine</span>
        <select name="machineId" defaultValue="">
          <option value="">Operator’s assigned machine</option>
          {machines.map((m) => (
            <option key={m.id} value={m.id} disabled={m.status === 'maintenance' || m.status === 'offline'}>
              {m.id} · {m.model}
              {m.status !== 'active' ? ` (${m.status})` : ''}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="label">Zone</span>
        <input name="zone" placeholder="Zone A - Sector 3" maxLength={100} />
      </label>
      <label className="field">
        <span className="label">Expected weather</span>
        <select value={weather} onChange={(e) => setWeather(e.target.value)}>
          {WEATHER.map((w) => (
            <option key={w} value={w}>{humanize(w)}</option>
          ))}
        </select>
      </label>
      <label className="field">
        <span className="label">Estimated minutes</span>
        <input
          name="estimatedMinutes"
          type="number"
          min={1}
          max={1440}
          value={estimate}
          onChange={(e) => {
            setTouched(true);
            setEstimate(e.target.value);
          }}
          required
        />
        <span className="hint">
          Formula suggests <b>{suggested} min</b> (task type × weather × operator skill).
          {touched && (
            <>
              {' '}
              <button type="button" className="btn ghost sm" onClick={() => setTouched(false)}>Use suggestion</button>
            </>
          )}
        </span>
      </label>
      <label className="field">
        <span className="label">Instructions</span>
        <textarea name="description" placeholder="What the operator needs to do" maxLength={2000} />
      </label>
      <label className="field span-2">
        <span className="label">Safety checklist (one item per line)</span>
        <textarea name="checklist" placeholder={'Inspect trench shoring\nVerify utility locate markers'} />
      </label>
      <div className="span-2 filters" style={{ justifyContent: 'space-between' }}>
        <div>
          {state?.error && <div className="notice error">{state.error}</div>}
          {state?.ok && <div className="notice ok">{state.ok}</div>}
        </div>
        <SubmitButton pendingLabel="Assigning…">Create &amp; assign task</SubmitButton>
      </div>
    </form>
  );
}
