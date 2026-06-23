"use client";

import { useState } from "react";
import type { MemberRow } from "@/app/(app)/actions/members";
import type { MembershipStatus } from "@/lib/membership";
import { StatusCounters } from "@/components/status-counters";
import { MemberTable } from "@/components/member-table";

export function MembersDashboard({ members }: { members: MemberRow[] }) {
  const [statusFilter, setStatusFilter] = useState<MembershipStatus | null>(
    null,
  );

  function toggleStatusFilter(status: MembershipStatus) {
    setStatusFilter((current) => (current === status ? null : status));
  }

  return (
    <>
      <StatusCounters
        members={members}
        selected={statusFilter}
        onSelect={toggleStatusFilter}
      />
      <MemberTable
        members={members}
        statusFilter={statusFilter}
        onClearStatusFilter={() => setStatusFilter(null)}
      />
    </>
  );
}
