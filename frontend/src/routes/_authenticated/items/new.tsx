import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { ImagePicker } from "@/components/app/ImagePicker";
import {
  CategorySelect,
  NativeSelect,
  Page,
  PageHeader,
  Panel,
  Pill,
  Spinner,
} from "@/components/app/kit";
import { FormAlert, FormField } from "@/components/site/FormField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONDITION_LABEL } from "@/lib/format";
import { itemsApi } from "@/services/domain.service";
import type { Condition } from "@/services/models";

export const Route = createFileRoute("/_authenticated/items/new")({
  head: () => ({
    meta: [{ title: "Report an item — Resortify" }, { name: "robots", content: "noindex" }],
  }),
  component: NewItem,
});

function useDebounced<T>(value: T, ms = 500) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

function NewItem() {
  const navigate = useNavigate();
  const [f, setF] = useState({
    title: "",
    description: "",
    condition: "working" as Condition,
    weightKg: "",
    ageYears: "",
  });
  const [category, setCategory] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState("");
  const [touched, setTouched] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const text = useDebounced(`${f.title}\n${f.description}`);
  const suggestion = useQuery({
    queryKey: ["classify", text],
    queryFn: () => itemsApi.classify(f.title, f.description),
    enabled: f.title.trim().length >= 3,
    staleTime: 60_000,
  });
  const suggested = suggestion.data;
  // Follow the suggestion until the person picks a category themselves.
  const effective =
    category || (suggested && suggested.confidence > 0 ? suggested.category : "other_ewaste");

  const create = useMutation({
    mutationFn: () =>
      itemsApi.create(
        {
          title: f.title.trim(),
          description: f.description.trim(),
          condition: f.condition,
          weightKg: f.weightKg,
          ageYears: f.ageYears || undefined,
          category: effective,
        },
        files,
      ),
    onSuccess: (item) => navigate({ to: "/items/$itemId", params: { itemId: item._id } }),
  });

  const weight = Number(f.weightKg);
  const errors = {
    title: touched && f.title.trim().length < 2 ? "Enter a title" : undefined,
    weightKg:
      touched && !(weight > 0 && weight <= 500)
        ? "Enter a weight between 0.01 and 500 kg"
        : undefined,
  };

  return (
    <Page>
      <PageHeader
        eyebrow="Waste scanner"
        title="Report an item"
        subtitle="Describe what you have. We'll suggest a category and show its best next life."
      />
      <form
        noValidate
        className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]"
        onSubmit={(e) => {
          e.preventDefault();
          setTouched(true);
          if (f.title.trim().length >= 2 && weight > 0 && weight <= 500) create.mutate();
        }}
      >
        <Panel title="About the item">
          <div className="space-y-5">
            {create.isError && <FormAlert>{create.error.message}</FormAlert>}
            {fileError && <FormAlert>{fileError}</FormAlert>}
            <ImagePicker
              files={files}
              onChange={(x) => {
                setFiles(x);
                setFileError("");
              }}
              onError={setFileError}
            />
            <FormField
              id="title"
              label="What is it?"
              error={errors.title}
              hint="For example: Samsung phone with a cracked screen"
            >
              <Input id="title" value={f.title} onChange={set("title")} maxLength={100} />
            </FormField>
            <FormField id="description" label="Details (optional)">
              <Textarea
                id="description"
                value={f.description}
                onChange={set("description")}
                maxLength={1000}
                rows={3}
              />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-3">
              <FormField id="condition" label="Condition">
                <NativeSelect id="condition" value={f.condition} onChange={set("condition")}>
                  {(Object.keys(CONDITION_LABEL) as Condition[]).map((c) => (
                    <option key={c} value={c}>
                      {CONDITION_LABEL[c]}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
              <FormField id="weightKg" label="Weight (kg)" error={errors.weightKg}>
                <Input
                  id="weightKg"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min="0.01"
                  value={f.weightKg}
                  onChange={set("weightKg")}
                />
              </FormField>
              <FormField id="ageYears" label="Age (years)">
                <Input
                  id="ageYears"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="40"
                  value={f.ageYears}
                  onChange={set("ageYears")}
                />
              </FormField>
            </div>
          </div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Category">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {suggestion.isFetching ? (
                  <>
                    <Spinner className="mr-1 inline" /> Checking…
                  </>
                ) : suggested && suggested.confidence > 0 ? (
                  <>
                    Suggested from your words: <strong>{suggested.label}</strong>{" "}
                    <Pill tone="info">{Math.round(suggested.confidence * 100)}% match</Pill>
                  </>
                ) : f.title.trim().length >= 3 ? (
                  "We couldn't match a category. Please choose one."
                ) : (
                  "Type a title and we'll suggest a category."
                )}
              </p>
              <FormField id="category" label="Category (you can change it)">
                <CategorySelect id="category" value={effective} onChange={setCategory} />
              </FormField>
              {suggested && suggested.confidence > 0 && suggested.matched.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Matched words: {suggested.matched.join(", ")}.
                </p>
              )}
            </div>
          </Panel>
          <Button
            type="submit"
            variant="hero"
            size="xl"
            className="w-full"
            disabled={create.isPending}
          >
            {create.isPending && <Spinner />} Report item
          </Button>
        </div>
      </form>
    </Page>
  );
}
