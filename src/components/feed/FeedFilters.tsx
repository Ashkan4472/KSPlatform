import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type Props = {
  tags: { name: string; slug: string }[];
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

export function FeedFilters({ tags, activeFilter, activeTag, isAuthed }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b">
        <FilterTab
          href={buildHref("all", activeTag)}
          active={activeFilter === "all"}
          label="All posts"
        />
        {isAuthed && (
          <FilterTab
            href={buildHref("subscribed", activeTag)}
            active={activeFilter === "subscribed"}
            label="My subscriptions"
          />
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link href={buildHref(activeFilter)}>
          <Badge
            variant={activeTag ? "outline" : "default"}
            className="cursor-pointer"
          >
            All tags
          </Badge>
        </Link>
        {tags.map((tag) => (
          <Link key={tag.slug} href={buildHref(activeFilter, tag.slug)}>
            <Badge
              variant={activeTag === tag.slug ? "default" : "secondary"}
              className="cursor-pointer hover:bg-accent"
            >
              #{tag.name}
            </Badge>
          </Link>
        ))}
      </div>
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
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </Link>
  );
}
