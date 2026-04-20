"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ScrollText,
  Share2,
  Zap,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Overview",
    href: "/overview",
    icon: LayoutDashboard,
  },
  {
    label: "Users",
    href: "/users",
    icon: Users,
  },
  {
    label: "Referrals",
    href: "/referrals",
    icon: Share2,
  },
  {
    label: "Audit Log",
    href: "/audit-log",
    icon: ScrollText,
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex flex-col w-[240px] bg-[#0d1117] border-r border-[#1e2530]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-[#1e2530] shrink-0">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#C6FF00]/10 border border-[#C6FF00]/20">
          <Zap className="w-4 h-4 text-[#C6FF00]" />
        </div>
        <div>
          <span className="text-sm font-bold text-white tracking-tight">
            Kinetic
          </span>
          <span className="ml-1.5 text-xs font-medium text-[#C6FF00] bg-[#C6FF00]/10 px-1.5 py-0.5 rounded-full">
            Admin
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] font-semibold text-gray-600 uppercase tracking-widest">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "sidebar-link group",
                isActive && "active"
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive ? "text-[#C6FF00]" : "text-gray-500 group-hover:text-gray-300"
                )}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3.5 h-3.5 text-[#C6FF00]/50" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-[#1e2530]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-500">
            API connected
          </span>
        </div>
        <p className="mt-1 text-[10px] text-gray-700">
          Redak Code Inc.
        </p>
      </div>
    </aside>
  );
}
