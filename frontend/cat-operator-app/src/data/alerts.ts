/** Operator-facing wording for backend alerts (rule IDs from backend/app/routers/telemetry.py). */
import { ApiAlert } from '@/api/client';

export function alertTitle(a: Pick<ApiAlert, 'ruleId'> | null): string {
  const rule = a?.ruleId ?? '';
  if (rule === 'RULE-SEATBELT') return 'Seatbelt Unbuckled';
  if (rule === 'RULE-PROXIMITY-CRIT') return 'Proximity Hazard';
  if (rule === 'RULE-PROXIMITY-WARN') return 'Proximity Warning';
  if (rule.startsWith('ML-')) return `AI: ${rule.slice(3).replace(/_/g, ' ')}`;
  return 'Safety Alert';
}

/** "[AI Alert] Engine overheating detected. … - Action: …" → the message without the prefix. */
export const alertMessage = (a: Pick<ApiAlert, 'message'>) => a.message.replace(/^\[AI Alert\]\s*/, '');

export const isProximityAlert = (a: Pick<ApiAlert, 'ruleId'> | null) => !!a?.ruleId?.startsWith('RULE-PROXIMITY');
