import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { FacilityCard } from "@/components/app/FacilityCard";
import { EmptyState, NativeSelect, Page, PageHeader, Pager, QueryView } from "@/components/app/kit";
import { FormAlert } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { facilitiesApi } from "@/services/domain.service";

export const Route = createFileRoute("/_authenticated/admin/facilities")({
  head: () => ({
    meta: [{ title: "Verify facilities — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: AdminFacilities,
});

function AdminFacilities() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState("false");
  const q = useQuery({
    queryKey: ["facilities", "admin", page, filter],
    queryFn: () => facilitiesApi.adminList({ page, verified: filter || undefined }),
  });
  const verify = useMutation({
    mutationFn: ({ id, v }: { id: string; v: boolean }) => facilitiesApi.verify(id, v),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["facilities"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
  return (
    <Page>
      <PageHeader
        eyebrow="Administration"
        title="Verify facilities"
        subtitle="Check the operator's authorisation and details before marking a place Verified. Moving a verified place removes its badge."
        actions={
          <NativeSelect
            aria-label="Filter"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="false">Unverified</option>
            <option value="">All</option>
          </NativeSelect>
        }
      />
      <div className="mt-8 space-y-4">
        {verify.isError && <FormAlert>{verify.error.message}</FormAlert>}
        <QueryView
          query={q}
          empty={(d) => (d.items.length === 0 ? <EmptyState title="Nothing to review" /> : null)}
        >
          {(d) => (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {d.items.map((f) => {
                  const owner = typeof f.owner === "object" ? f.owner : null;
                  return (
                    <FacilityCard key={f._id} f={f}>
                      {owner && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Owner: {owner.name} ({owner.email})
                        </p>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        className="mt-3"
                        variant={f.verified ? "outline" : "emerald"}
                        disabled={verify.isPending}
                        onClick={() => verify.mutate({ id: f._id, v: !f.verified })}
                      >
                        {f.verified ? "Remove verification" : "Mark as verified"}
                      </Button>
                    </FacilityCard>
                  );
                })}
              </div>
              <Pager data={d} onPage={setPage} />
            </>
          )}
        </QueryView>
      </div>
    </Page>
  );
}
