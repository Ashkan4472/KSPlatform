import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Props = {
  activeFilter: "all" | "subscribed";
  activeTag?: string;
  isAuthed: boolean;
};

function buildHref(filter: string, tag?: string) {
  const params = new URLSearchParams();
  if (filter && filter !== "all") params.set("filter", filter);
  if (tag) params.set("tag", tag);
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

export function FeedFilters({ activeFilter, activeTag, isAuthed }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1 border-b">
        <FilterTab
          href={buildHref("all", activeTag)}
          active={activeFilter === "all"}
          label="All"
        />
        {isAuthed && (
          <FilterTab
            href={buildHref("subscribed", activeTag)}
            active={activeFilter === "subscribed"}
            label="My subscriptions"
          />
        )}
      </div>

      {activeTag && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Filtered by</span>
          <Link href={buildHref(activeFilter)}>
            <Badge variant="secondary" className="gap-1">
              #{activeTag}
              <X className="h-3 w-3" />
            </Badge>
          </Link>
        </div>
      )}
    </div>
  );
}

function FilterTab({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
