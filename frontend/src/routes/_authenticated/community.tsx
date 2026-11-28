import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Flag, Heart, MessageCircle, Trash2 } from "lucide-react";
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
  Spinner,
} from "@/components/app/kit";
import { FormAlert, FormField } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { dateLabel } from "@/lib/format";
import { ROLE_LABELS, type Role } from "@/lib/roles";
import { communityApi } from "@/services/domain.service";
import type { Post } from "@/services/models";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({
    meta: [{ title: "Community — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: Community,
});

const KIND = { tip: "Tip", question: "Question", event: "Event" } as const;

function Community() {
  const qc = useQueryClient();
  const [kind, setKind] = useState("");
  const [page, setPage] = useState(1);
  const q = useQuery({
    queryKey: ["community", kind, page],
    queryFn: () => communityApi.posts({ kind, page }),
    placeholderData: (p) => p,
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: ["community"] });
  return (
    <Page>
      <PageHeader
        eyebrow="Community"
        title="Community"
        subtitle="Share tips, ask questions and announce local events. Be kind, and never post phone numbers or addresses."
        actions={
          <NativeSelect
            aria-label="Filter"
            value={kind}
            onChange={(e) => {
              setKind(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All posts</option>
            {Object.entries(KIND).map(([k, v]) => (
              <option key={k} value={k}>
                {v}s
              </option>
            ))}
          </NativeSelect>
        }
      />
      <div className="mt-8 space-y-6">
        <Composer onDone={refresh} />
        <QueryView
          query={q}
          empty={(d) =>
            d.items.length === 0 ? (
              <EmptyState title="No posts yet">Be the first to share a tip.</EmptyState>
            ) : null
          }
        >
          {(d) => (
            <>
              <div className="space-y-4">
                {d.items.map((p) => (
                  <PostCard key={p._id} p={p} onChange={refresh} />
                ))}
              </div>
              <Pager data={d} onPage={setPage} />
            </>
          )}
        </QueryView>
      </div>
    </Page>
  );
}

function Composer({ onDone }: { onDone: () => void }) {
  const [f, setF] = useState({ kind: "tip", title: "", body: "" });
  const m = useMutation({
    mutationFn: () =>
      communityApi.create({ kind: f.kind, title: f.title.trim(), body: f.body.trim() }),
    onSuccess: () => {
      setF({ kind: "tip", title: "", body: "" });
      onDone();
    },
  });
  const ok = f.title.trim().length >= 3 && f.body.trim().length >= 3;
  return (
    <Panel title="Share something">
      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (ok) m.mutate();
        }}
      >
        {m.isError && <FormAlert>{m.error.message}</FormAlert>}
        <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
          <FormField id="kind" label="Type">
            <NativeSelect
              id="kind"
              value={f.kind}
              onChange={(e) => setF((s) => ({ ...s, kind: e.target.value }))}
            >
              {Object.entries(KIND).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </NativeSelect>
          </FormField>
          <FormField id="ptitle" label="Title">
            <Input
              id="ptitle"
              maxLength={120}
              value={f.title}
              onChange={(e) => setF((s) => ({ ...s, title: e.target.value }))}
            />
          </FormField>
        </div>
        <FormField id="pbody" label="Your post">
          <Textarea
            id="pbody"
            rows={3}
            maxLength={2000}
            value={f.body}
            onChange={(e) => setF((s) => ({ ...s, body: e.target.value }))}
          />
        </FormField>
        <Button type="submit" variant="hero" disabled={m.isPending || !ok}>
          {m.isPending && <Spinner />} Post
        </Button>
      </form>
    </Panel>
  );
}

function PostCard({ p, onChange }: { p: Post; onChange: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reported, setReported] = useState(false);
  const like = useMutation({ mutationFn: () => communityApi.like(p._id), onSuccess: onChange });
  const del = useMutation({ mutationFn: () => communityApi.remove(p._id), onSuccess: onChange });
  const report = useMutation({
    mutationFn: () => communityApi.report(p._id),
    onSuccess: () => setReported(true),
  });
  const canDelete = user?._id === p.author._id || user?.role === "admin";
  return (
    <article className="rounded-3xl border border-border bg-paper p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Pill tone={p.kind === "question" ? "warning" : p.kind === "event" ? "info" : "success"}>
          {KIND[p.kind]}
        </Pill>
        <span>
          {p.author.name} · {ROLE_LABELS[p.author.role as Role] ?? p.author.role} ·{" "}
          {dateLabel(p.createdAt)}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-semibold">{p.title}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{p.body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={p.liked ? "emerald" : "soft"}
          aria-pressed={p.liked}
          disabled={like.isPending}
          onClick={() => like.mutate()}
        >
          <Heart className="size-4" /> {p.likeCount}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="soft"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <MessageCircle className="size-4" /> {p.commentCount}
        </Button>
        {user?._id !== p.author._id && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={reported || report.isPending}
            onClick={() => report.mutate()}
          >
            <Flag className="size-4" /> {reported ? "Reported" : "Report"}
          </Button>
        )}
        {canDelete && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={del.isPending}
            onClick={() => {
              if (window.confirm("Delete this post?")) del.mutate();
            }}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
        )}
      </div>
      {open && <Comments id={p._id} onChange={onChange} />}
    </article>
  );
}

function Comments({ id, onChange }: { id: string; onChange: () => void }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["community", "comments", id],
    queryFn: () => communityApi.comments(id),
  });
  const [body, setBody] = useState("");
  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["community", "comments", id] });
    onChange();
  };
  const add = useMutation({
    mutationFn: () => communityApi.comment(id, body.trim()),
    onSuccess: () => {
      setBody("");
      refresh();
    },
  });
  const del = useMutation({
    mutationFn: (cid: string) => communityApi.removeComment(cid),
    onSuccess: refresh,
  });
  return (
    <div className="mt-4 border-t border-border pt-4">
      <QueryView query={q} rows={1}>
        {(list) => (
          <ul className="space-y-3">
            {list.map((c) => (
              <li key={c._id} className="text-sm">
                <strong>{c.author.name}</strong>{" "}
                <span className="text-xs text-muted-foreground">{dateLabel(c.createdAt)}</span>
                {(user?._id === c.author._id || user?.role === "admin") && (
                  <button
                    type="button"
                    className="ml-2 text-xs text-muted-foreground underline"
                    onClick={() => del.mutate(c._id)}
                  >
                    delete
                  </button>
                )}
                <p>{c.body}</p>
              </li>
            ))}
            {list.length === 0 && (
              <li className="text-sm text-muted-foreground">No comments yet.</li>
            )}
          </ul>
        )}
      </QueryView>
      <form
        noValidate
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (body.trim()) add.mutate();
        }}
      >
        <Input
          aria-label="Add a comment"
          placeholder="Add a comment"
          maxLength={800}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <Button type="submit" variant="hero" size="sm" disabled={add.isPending || !body.trim()}>
          Send
        </Button>
      </form>
      {add.isError && (
        <div className="mt-2">
          <FormAlert>{add.error.message}</FormAlert>
        </div>
      )}
    </div>
  );
}
