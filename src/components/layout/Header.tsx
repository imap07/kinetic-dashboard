"use client";

import { LogOut, User, ChevronDown, Bell } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useSession, signOut } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession();
  const name = session?.user?.name || "Admin";
  const email = session?.user?.email || "";

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-[#0B0E11]/80 backdrop-blur-md border-b border-[#1e2530]">
      <div />

      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button
          className="relative flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-white/5 transition-all"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* User menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all group">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#C6FF00]/10 border border-[#C6FF00]/20">
                <User className="w-3.5 h-3.5 text-[#C6FF00]" />
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-medium text-gray-200 leading-none">{name}</p>
                <p className="text-[10px] text-gray-500 leading-none mt-0.5 max-w-[140px] truncate">
                  {email}
                </p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-colors" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              align="end"
              sideOffset={8}
              className="z-50 min-w-[180px] overflow-hidden rounded-xl bg-[#141920] border border-[#1e2530] shadow-2xl shadow-black/50 animate-in fade-in-0 zoom-in-95"
            >
              <div className="px-3 py-2.5 border-b border-[#1e2530]">
                <p className="text-xs font-medium text-gray-200">Signed in as</p>
                <p className="text-xs text-gray-500 truncate">{email}</p>
              </div>

              <div className="p-1">
                <DropdownMenu.Item
                  className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer outline-none transition-colors"
                  onSelect={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign out
                </DropdownMenu.Item>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
}
