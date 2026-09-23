'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Item = { href: string; label: string; count?: number };

export function NavLinks({ items }: { items: Item[] }) {
  const path = usePathname();
  return (
    <nav className="nav">
      {items.map((it) => {
        const active = it.href === '/' ? path === '/' : path.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={active ? 'active' : undefined}>
            {it.label}
            {it.count ? <span className="count">{it.count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
