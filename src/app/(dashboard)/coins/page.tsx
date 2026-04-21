import type { Metadata } from "next";
import { BulkCoinDropForm } from "./BulkCoinDropForm";

export const metadata: Metadata = { title: "Bulk Coin Drop" };

export default function CoinsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Bulk Coin Drop</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Credit KineticCoins to a segment (promo, apology, campaign). Dry-run first.
        </p>
      </div>
      <BulkCoinDropForm />
    </div>
  );
}
