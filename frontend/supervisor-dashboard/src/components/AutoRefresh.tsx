'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

/** Re-fetches server data on an interval so operator activity shows up live. Pauses in background tabs. */
export function AutoRefresh({ intervalMs = 10_000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [last, setLast] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onVis = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const [wasHidden, setWasHidden] = useState(false);

  useEffect(() => {
    if (!visible) {
      setWasHidden(true);
      return;
    }
    if (wasHidden) {
      // Catch up immediately when the tab comes back into view.
      router.refresh();
      setLast(Date.now());
    }
    const id = setInterval(() => {
      router.refresh();
      setLast(Date.now());
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs, visible, wasHidden]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const ago = Math.max(0, Math.round((now - last) / 1000));
  return (
    <span className={`live${visible ? '' : ' paused'}`} title={`Refreshes every ${intervalMs / 1000}s`}>
      <span className="dot" />
      {visible ? `Live · synced ${ago}s ago` : 'Paused'}
    </span>
  );
}
