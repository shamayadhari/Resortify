import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { resolveApiAssetUrl } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { User } from "@/services/types";

export function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function UserAvatar({ user, src, className }: { user: User | null; src?: string | undefined; className?: string | undefined }) {
  const url = src ?? resolveApiAssetUrl(user?.avatarUrl);
  return (
    <Avatar className={cn("size-10 ring-2 ring-emerald/40", className)}>
      {url && <AvatarImage src={url} alt={user?.name ?? "Profile photo"} className="object-cover" />}
      <AvatarFallback className="bg-secondary font-semibold text-secondary-foreground">{initials(user?.name)}</AvatarFallback>
    </Avatar>
  );
}
