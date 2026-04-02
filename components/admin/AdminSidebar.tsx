'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin', label: 'Dashboard', icon: 'D' },
  { href: '/admin/issues', label: 'Issues', icon: 'I' },
  { href: '/admin/generate', label: 'New Issue', icon: '+' },
  { href: '/admin/carousels', label: 'Carousels', icon: 'C' },
  { href: '/admin/intelligence', label: 'Intelligence', icon: '\u2726' },
  { href: '/admin/subscribers', label: 'Subscribers', icon: 'S' },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-[#1C1C1C] border-r border-[#333333] flex flex-col min-h-screen">
      {/* Header */}
      <div className="p-5 border-b border-[#333333]">
        <Link href="/admin" className="flex items-center gap-3">
          <Image src="/images/dg-logo.png" alt="DG" width={28} height={28} />
          <div>
            <div className="font-[family-name:var(--font-playfair)] text-sm font-bold text-white">AI Report</div>
            <div className="text-[10px] text-[#B8860B] uppercase tracking-widest">Magazine</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/admin'
            ? pathname === '/admin'
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm mb-1 transition-colors ${
                isActive
                  ? 'bg-[#B8860B]/10 text-[#B8860B] border border-[#B8860B]/20'
                  : 'text-[#B0B0B0] hover:text-white hover:bg-[#222222]'
              }`}
            >
              <span className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold ${
                isActive ? 'bg-[#B8860B]/20 text-[#B8860B]' : 'bg-[#333333] text-[#888888]'
              }`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#333333]">
        <p className="text-[10px] text-[#666666]">David & Goliath</p>
        <p className="text-[10px] text-[#666666]">Intelligence Publication</p>
      </div>
    </aside>
  );
}
