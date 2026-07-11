import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { initialsOf } from "@/lib/format";
import { canModerate } from "@/lib/roles";
import type { UserSummary } from "@/lib/users";

export function UserCard({ user }: { user: UserSummary }) {
  return (
    <Card className="transition-colors hover:border-foreground/20">
      <CardContent className="flex items-start gap-3">
        <Link href={`/u/${user.id}`}>
          <Avatar className="h-11 w-11">
            {user.image ? (
              <AvatarImage src={user.image} alt={user.name} />
            ) : null}
            <AvatarFallback>{initialsOf(user.name)}</AvatarFallback>
          </Avatar>
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/u/${user.id}`}
              className="font-medium hover:underline"
            >
              {user.name}
            </Link>
            {canModerate(user) && <Badge variant="outline">Admin</Badge>}
          </div>
          {user.bio && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {user.bio}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {user.postCount} post{user.postCount === 1 ? "" : "s"} ·{" "}
            {user.tweetCount} tweet{user.tweetCount === 1 ? "" : "s"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
