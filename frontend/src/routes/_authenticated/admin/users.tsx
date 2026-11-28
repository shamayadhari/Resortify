import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import {
  EmptyState,
  NativeSelect,
  Page,
  PageHeader,
  Pager,
  Panel,
  Pill,
  QueryView,
} from "@/components/app/kit";
import { FormAlert } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { dateLabel } from "@/lib/format";
import { PARTNER_ROLES, ROLES, ROLE_LABELS, type Role } from "@/lib/roles";
import { adminApi } from "@/services/domain.service";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [{ title: "Users & partners — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: Users,
});

function Users() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const [f, setF] = useState({ q: "", role: "", pending: true });
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["admin", "users", f, page],
    queryFn: () => adminApi.users({ ...f, pending: f.pending || undefined, page }),
    placeholderData: (p) => p,
  });
  const update = useMutation({
    mutationFn: ({
      id,
      ...b
    }: {
      id: string;
      status?: "active" | "suspended";
      partnerVerified?: boolean;
    }) => adminApi.updateUser(id, b),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  return (
    <Page wide>
      <PageHeader
        eyebrow="Administration"
        title="Users & partners"
        subtitle="Verify dealers, recyclers, collectors and NGOs before they can take actions. Check their details first."
      />
      <Panel className="mt-8">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Input
            aria-label="Search"
            placeholder="Name or email"
            className="max-w-xs"
            value={f.q}
            onChange={(e) => {
              setF((s) => ({ ...s, q: e.target.value }));
              setPage(1);
            }}
          />
          <NativeSelect
            aria-label="Role"
            className="max-w-[14rem]"
            value={f.role}
            disabled={f.pending}
            onChange={(e) => {
              setF((s) => ({ ...s, role: e.target.value }));
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r as Role]}
              </option>
            ))}
          </NativeSelect>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-[var(--color-emerald)]"
              checked={f.pending}
              onChange={(e) => {
                setF((s) => ({ ...s, pending: e.target.checked }));
                setPage(1);
              }}
            />{" "}
            Awaiting verification only
          </label>
        </div>
        {update.isError && <FormAlert>{update.error.message}</FormAlert>}
        <QueryView
          query={q}
          empty={(d) => (d.items.length === 0 ? <EmptyState title="No users found" /> : null)}
        >
          {(d) => (
            <>
              <ul className="divide-y divide-border">
                {d.items.map((u) => (
                  <li
                    key={u._id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="font-semibold">
                        {u.name} <Pill>{ROLE_LABELS[u.role as Role]}</Pill>{" "}
                        {u.status === "suspended" && <Pill tone="danger">Suspended</Pill>}{" "}
                        {PARTNER_ROLES.includes(u.role as Role) && (
                          <Pill tone={u.partnerVerified ? "success" : "warning"}>
                            {u.partnerVerified ? "Verified" : "Not verified"}
                          </Pill>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {u.email}
                        {u.phone ? ` · ${u.phone}` : ""}
                        {u.address?.city ? ` · ${u.address.city}` : ""} · joined{" "}
                        {dateLabel(u.createdAt)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {PARTNER_ROLES.includes(u.role as Role) && (
                        <Button
                          type="button"
                          size="sm"
                          variant={u.partnerVerified ? "outline" : "emerald"}
                          disabled={update.isPending}
                          onClick={() =>
                            update.mutate({ id: u._id, partnerVerified: !u.partnerVerified })
                          }
                        >
                          {u.partnerVerified ? "Remove verification" : "Verify"}
                        </Button>
                      )}
                      {u._id !== me?._id && u.role !== "admin" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={update.isPending}
                          onClick={() => {
                            if (
                              u.status === "active"
                                ? window.confirm(
                                    `Suspend ${u.name}? They won't be able to sign in.`,
                                  )
                                : true
                            )
                              update.mutate({
                                id: u._id,
                                status: u.status === "active" ? "suspended" : "active",
                              });
                          }}
                        >
                          {u.status === "active" ? "Suspend" : "Reinstate"}
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <Pager data={d} onPage={setPage} />
            </>
          )}
        </QueryView>
      </Panel>
    </Page>
  );
}
