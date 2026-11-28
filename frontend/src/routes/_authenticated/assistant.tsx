import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SendHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { FormAlert } from "@/components/site/FormField";
import { Page, PageHeader, Panel, Spinner } from "@/components/app/kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assistantApi } from "@/services/domain.service";
import type { AssistantAnswer } from "@/services/models";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [{ title: "Recycling assistant — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: Assistant,
});

type Turn = { q: string; a?: AssistantAnswer };

function Assistant() {
  const topics = useQuery({
    queryKey: ["assistant", "topics"],
    queryFn: assistantApi.topics,
    staleTime: Infinity,
  });
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const ask = useMutation({
    mutationFn: (q: string) => assistantApi.ask(q),
    onSuccess: (a, q) =>
      setTurns((t) => t.map((x, i) => (i === t.length - 1 && x.q === q ? { ...x, a } : x))),
  });
  useEffect(() => end.current?.scrollIntoView({ block: "end", behavior: "smooth" }), [turns]);

  function send(q: string) {
    const clean = q.trim();
    if (clean.length < 2 || ask.isPending) return;
    setTurns((t) => [...t, { q: clean }]);
    setText("");
    ask.mutate(clean);
  }

  return (
    <Page>
      <PageHeader
        eyebrow="Assistant"
        title="Recycling assistant"
        subtitle="Answers come from Resortify's built-in guide, not from an AI model. If it doesn't know, it says so."
      />
      <Panel className="mt-8">
        <div className="min-h-48 space-y-5" aria-live="polite">
          {turns.length === 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Try one of these:</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(topics.data ?? []).map((t) => (
                  <Button
                    key={t.id}
                    type="button"
                    size="sm"
                    variant="soft"
                    onClick={() => send(t.title)}
                  >
                    {t.title}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {turns.map((t, i) => (
            <div key={i} className="space-y-3">
              <p className="ml-auto w-fit max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                {t.q}
              </p>
              {t.a ? (
                <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-border bg-background px-4 py-3 text-sm">
                  <p>{t.a.answer}</p>
                  {t.a.related && t.a.related.length > 0 && (
                    <div className="mt-3 border-t border-border pt-3">
                      <p className="text-xs font-semibold text-muted-foreground">
                        Related: {t.a.related[0]!.title}
                      </p>
                      <p className="mt-1">{t.a.related[0]!.answer}</p>
                    </div>
                  )}
                  {t.a.actions.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {t.a.actions.map((a) => (
                        <Button key={a.to} asChild size="sm" variant="emerald">
                          <Link to={a.to as "/dashboard"}>{a.label}</Link>
                        </Button>
                      ))}
                    </div>
                  )}
                  {t.a.itemHint && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      This sounds like: {t.a.itemHint.label}.
                    </p>
                  )}
                  {t.a.sources.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      From the guide: {t.a.sources.map((s) => s.title).join(", ")}
                    </p>
                  )}
                </div>
              ) : ask.isError && i === turns.length - 1 ? (
                <FormAlert>{ask.error.message}</FormAlert>
              ) : (
                <p className="text-sm text-muted-foreground">
                  <Spinner className="mr-1 inline" /> Looking it up…
                </p>
              )}
            </div>
          ))}
          <div ref={end} />
        </div>
        <form
          noValidate
          className="mt-5 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <Input
            aria-label="Your question"
            placeholder="Ask about batteries, pickups, prices…"
            maxLength={400}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Button
            type="submit"
            variant="hero"
            disabled={ask.isPending || text.trim().length < 2}
            aria-label="Send"
          >
            <SendHorizontal />
          </Button>
        </form>
      </Panel>
    </Page>
  );
}
