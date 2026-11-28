import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { EmptyState, Page, PageHeader, Panel, QueryView } from "@/components/app/kit";
import { FormAlert } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { dateTimeLabel } from "@/lib/format";
import { adminApi } from "@/services/domain.service";

export const Route = createFileRoute("/_authenticated/admin/moderation")({
  head: () => ({
    meta: [{ title: "Moderation & inbox — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: Moderation,
});

function Moderation() {
  const qc = useQueryClient();
  const posts = useQuery({ queryKey: ["admin", "reported"], queryFn: adminApi.reportedPosts });
  const inbox = useQuery({
    queryKey: ["admin", "contact"],
    queryFn: () => adminApi.contact({ handled: "false" }),
  });
  const audit = useQuery({ queryKey: ["admin", "audit"], queryFn: () => adminApi.audit() });
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin"] });
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
    void qc.invalidateQueries({ queryKey: ["community"] });
  };
  const setStatus = useMutation({
    mutationFn: ({ id, s }: { id: string; s: "hidden" | "visible" }) =>
      adminApi.setPostStatus(id, s),
    onSuccess: refresh,
  });
  const handle = useMutation({
    mutationFn: (id: string) => adminApi.handleContact(id, true),
    onSuccess: refresh,
  });
  return (
    <Page>
      <PageHeader eyebrow="Administration" title="Moderation & inbox" />
      <div className="mt-8 space-y-6">
        {(setStatus.isError || handle.isError) && (
          <FormAlert>{(setStatus.error ?? handle.error)?.message}</FormAlert>
        )}
        <Panel title="Reported posts">
          <QueryView
            query={posts}
            empty={(d) => (d.length === 0 ? <EmptyState title="No reported posts" /> : null)}
          >
            {(list) => (
              <ul className="divide-y divide-border">
                {list.map((p) => (
                  <li key={p._id} className="py-3">
                    <p className="font-semibold">
                      {p.title}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        · {p.reportCount} report(s) · by {p.author.name}
                      </span>
                    </p>
                    <p className="mt-1 text-sm">{p.body}</p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={setStatus.isPending}
                        onClick={() => setStatus.mutate({ id: p._id, s: "hidden" })}
                      >
                        Hide post
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="soft"
                        disabled={setStatus.isPending}
                        onClick={() => setStatus.mutate({ id: p._id, s: "visible" })}
                      >
                        Dismiss reports
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </QueryView>
        </Panel>
        <Panel title="Contact messages (unhandled)">
          <QueryView
            query={inbox}
            empty={(d) => (d.items.length === 0 ? <EmptyState title="Inbox is clear" /> : null)}
          >
            {(d) => (
              <ul className="divide-y divide-border">
                {d.items.map((m) => (
                  <li key={m._id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                    <div>
                      <p className="font-semibold">
                        {m.name}{" "}
                        <a
                          className="text-sm font-normal text-primary underline"
                          href={`mailto:${m.email}`}
                        >
                          {m.email}
                        </a>
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{m.message}</p>
                      <p className="text-xs text-muted-foreground">{dateTimeLabel(m.createdAt)}</p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="soft"
                      disabled={handle.isPending}
                      onClick={() => handle.mutate(m._id)}
                    >
                      Mark handled
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </QueryView>
        </Panel>
        <Panel title="Recent admin actions">
          <QueryView
            query={audit}
            empty={(d) =>
              d.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
              ) : null
            }
          >
            {(d) => (
              <ul className="divide-y divide-border text-sm">
                {d.items.map((a) => (
                  <li key={a._id} className="flex justify-between gap-3 py-2">
                    <span>
                      <code>{a.action}</code> by {a.actor?.name ?? "unknown"}
                      {a.target ? ` on ${a.target.kind}` : ""}
                    </span>
                    <span className="text-muted-foreground">{dateTimeLabel(a.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </QueryView>
        </Panel>
      </div>
    </Page>
  );
}
