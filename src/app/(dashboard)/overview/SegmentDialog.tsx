"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import {
  getOverviewSegment,
  type OverviewSegment,
  type SegmentUser,
} from "@/lib/api";

interface SegmentDialogProps {
  segment: OverviewSegment;
  title: string;
  description?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LIMIT = 20;

function fmtDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SegmentDialog({
  segment,
  title,
  description,
  open,
  onOpenChange,
}: SegmentDialogProps) {
  const { data: session } = useSession();
  const token = session?.accessToken;

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<SegmentUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset paging whenever the dialog re-opens for a fresh segment.
  useEffect(() => {
    if (open) setPage(1);
  }, [open, segment]);

  useEffect(() => {
    if (!open || !token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getOverviewSegment(token, segment, page, LIMIT)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setTotal(res.total);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, token, segment, page]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] p-0 bg-[#0c0e12] border-[#1e2530] text-gray-200">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#1e2530]">
          <DialogTitle className="text-white">{title}</DialogTitle>
          {description ? (
            <DialogDescription className="text-gray-500">
              {description}
            </DialogDescription>
          ) : null}
        </DialogHeader>

        <div className="max-h-[60vh] overflow-auto">
          {error ? (
            <div className="px-5 py-6 text-sm text-red-400">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-[#1e2530] hover:bg-transparent">
                  <TableHead className="text-gray-500">Email</TableHead>
                  <TableHead className="text-gray-500">Name</TableHead>
                  <TableHead className="text-gray-500">Created</TableHead>
                  <TableHead className="text-gray-500">Last Login</TableHead>
                  <TableHead className="text-gray-500">Country</TableHead>
                  <TableHead className="text-gray-500">Provider</TableHead>
                  <TableHead className="text-gray-500">Pro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow
                      key={`sk-${i}`}
                      className="border-[#1e2530] hover:bg-transparent"
                    >
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : rows.length === 0 ? (
                  <TableRow className="border-[#1e2530] hover:bg-transparent">
                    <TableCell
                      colSpan={7}
                      className="text-center text-gray-500 py-10"
                    >
                      No users in this segment yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((u) => (
                    <TableRow
                      key={u._id}
                      className="border-[#1e2530] hover:bg-[#111318]"
                    >
                      <TableCell>
                        <Link
                          href={`/users/${u._id}`}
                          className="text-[#C6FF00] hover:underline"
                          onClick={() => onOpenChange(false)}
                        >
                          {u.email}
                        </Link>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {u.displayName || "—"}
                      </TableCell>
                      <TableCell className="text-gray-400 text-xs tabular-nums">
                        {fmtDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-gray-400 text-xs tabular-nums">
                        {fmtDate(u.lastLoginAt)}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {u.lastLoginCountry || "—"}
                      </TableCell>
                      <TableCell className="text-gray-400">
                        {u.lastLoginProvider || "—"}
                      </TableCell>
                      <TableCell>
                        {u.isPremium ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/20">
                            PRO
                          </span>
                        ) : (
                          <span className="text-gray-600 text-xs">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <Pagination
          page={page}
          total={total}
          limit={LIMIT}
          label="users"
          onChange={setPage}
        />
      </DialogContent>
    </Dialog>
  );
}
