import type { Metadata } from "next";
import { PushBroadcastForm } from "./PushBroadcastForm";

export const metadata: Metadata = { title: "Push Broadcast" };

export default function PushPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Push Broadcast</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Send notifications to a segment. Always dry-run first.
        </p>
      </div>
      <PushBroadcastForm />
    </div>
  );
}
