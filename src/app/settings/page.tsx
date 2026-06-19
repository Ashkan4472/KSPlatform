import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { SubscribeButton } from "@/components/SubscribeButton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { FontSelect } from "@/components/theme/FontSelect";
import { TagSubscribeSearch } from "@/components/tags/TagSubscribeSearch";
import { isFontKey, DEFAULT_FONT } from "@/lib/fonts";

export const metadata = { title: "Settings — KSPlatform" };

export default async function SettingsPage() {
  const userId = await requireUserId("/settings");

  const [user, subs] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.subscription.findMany({
      where: { userId },
      orderBy: { tag: { name: "asc" } },
      select: { tag: { select: { id: true, name: true, slug: true } } },
    }),
  ]);

  const subscribedTags = subs.map((s) => s.tag);
  const subscribedIds = subscribedTags.map((t) => t.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="mt-6">
        <h2 className="mb-3 text-lg font-medium">Profile</h2>
        <ProfileForm
          name={user?.name ?? ""}
          bio={user?.bio ?? ""}
          image={user?.image ?? ""}
        />
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="mb-3 text-lg font-medium">Appearance</h2>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border px-3 py-3">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-sm text-muted-foreground">
              Light, dark, or follow your system.
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4 rounded-md border px-3 py-3">
          <div>
            <p className="text-sm font-medium">Font</p>
            <p className="text-sm text-muted-foreground">
              Choose your reading font.
            </p>
          </div>
          <FontSelect
            initial={
              user && isFontKey(user.font) ? user.font : DEFAULT_FONT
            }
          />
        </div>
      </section>

      <Separator className="my-8" />

      <section>
        <h2 className="text-lg font-medium">Tag subscriptions</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Subscribe to tags to follow them in your feed and get notified about
          new posts.
        </p>

        {subscribedTags.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium">Your subscriptions</h3>
            <div className="space-y-2">
              {subscribedTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between rounded-md border px-3 py-2"
                >
                  <Badge variant="secondary">#{tag.name}</Badge>
                  <SubscribeButton tagId={tag.id} initialSubscribed />
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="mb-2 text-sm font-medium">Find tags</h3>
        <TagSubscribeSearch subscribedIds={subscribedIds} />
      </section>
    </div>
  );
}
