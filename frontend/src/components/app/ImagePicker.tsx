import { Camera, X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";

const MAX = 4;
const MAX_BYTES = 5 * 1024 * 1024;

/** Choose or capture up to 4 photos. Phones offer the camera directly. */
export function ImagePicker({
  files,
  onChange,
  onError,
}: {
  files: File[];
  onChange: (f: File[]) => void;
  onError?: (m: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  function add(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
        onError?.("Use JPG, PNG or WebP photos.");
        continue;
      }
      if (f.size > MAX_BYTES) {
        onError?.(`${f.name} is larger than 5 MB.`);
        continue;
      }
      if (next.length >= MAX) {
        onError?.("You can add up to 4 photos.");
        break;
      }
      next.push(f);
    }
    onChange(next);
    if (input.current) input.current.value = "";
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {urls.map((u, i) => (
          <div key={u} className="relative">
            <img
              src={u}
              alt={`Photo ${i + 1}`}
              className="size-24 rounded-xl border border-border object-cover"
            />
            <button
              type="button"
              aria-label={`Remove photo ${i + 1}`}
              onClick={() => onChange(files.filter((_, j) => j !== i))}
              className="absolute -right-2 -top-2 grid size-6 place-items-center rounded-full bg-foreground text-background shadow"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {files.length < MAX && (
          <Button
            type="button"
            variant="soft"
            className="size-24 flex-col gap-1 rounded-xl text-xs"
            onClick={() => input.current?.click()}
          >
            <Camera className="size-5" /> Add photo
          </Button>
        )}
      </div>
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        multiple
        className="sr-only"
        aria-label="Add photos"
        onChange={(e) => add(e.target.files)}
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Up to 4 photos, 5 MB each. Photos help the collector. The category suggestion comes from
        your description, not from the picture.
      </p>
    </div>
  );
}
