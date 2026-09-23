import type { ReactNode } from 'react';
import type { Tone } from '@/lib/domain';

/** Status pill — always colour + dot + text, never colour alone (docs/DESIGN.md §2). */
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}
