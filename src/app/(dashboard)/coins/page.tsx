"use client";

import { useState } from "react";
import { BulkCoinDropForm } from "./BulkCoinDropForm";
import { OverviewTab } from "./OverviewTab";
import { TransactionsTab } from "./TransactionsTab";
import { PackagesTab } from "./PackagesTab";

type Tab = "overview" | "transactions" | "packages" | "bulk-drop";

const TABS: { id: Tab; label: string; subtitle: string }[] = [
  { id: "overview", label: "Overview", subtitle: "Economy snapshot" },
  { id: "transactions", label: "Transactions", subtitle: "Global tx explorer" },
  { id: "packages", label: "Packages", subtitle: "IAP catalog & revenue" },
  { id: "bulk-drop", label: "Bulk Drop", subtitle: "Credit a segment" },
];

export default function CoinsPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const active = TABS.find((t) => t.id === tab) ?? TABS[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Coins</h1>
        <p className="text-sm text-gray-500 mt-0.5">{active.subtitle}</p>
      </div>

      <div className="flex gap-1.5 flex-wrap border-b border-[#1e2530] pb-0">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                isActive
                  ? "border-[#C6FF00] text-white"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "transactions" && <TransactionsTab />}
      {tab === "packages" && <PackagesTab />}
      {tab === "bulk-drop" && <BulkCoinDropForm />}
    </div>
  );
}
