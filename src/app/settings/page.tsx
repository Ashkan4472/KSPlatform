import { requireUserId } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProfileForm } from "@/components/settings/ProfileForm";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { SubscribeButton } from "@/components/SubscribeButton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { FontSelect } from "@/components/theme/FontSelect";
import { AccentSelect } from "@/components/theme/AccentSelect";
import { SizeSelect } from "@/components/theme/SizeSelect";
import { AppearancePicker } from "@/components/theme/AppearancePicker";
import { TagSubscribeSearch } from "@/components/tags/TagSubscribeSearch";
import {
  isFontKey,
  isAccent,
  isSize,
  isSurface,
  isRadius,
  isCardStyle,
  isBorderDensity,
  isShadow,
  DEFAULT_FONT,
  DEFAULT_ACCENT,
  DEFAULT_SIZE,
  DEFAULT_SURFACE,
  DEFAULT_RADIUS,
  DEFAULT_CARD_STYLE,
  DEFAULT_BORDER_DENSITY,
  DEFAULT_SHADOW,
  SURFACES,
  RADII,
  CARD_STYLES,
  BORDER_DENSITIES,
  SHADOWS,
} from "@/lib/fonts";

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
        <p className="mb-4 text-sm text-muted-foreground">
          Mix and match a base, accent color, size, and font.
        </p>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border px-3 py-3">
            <div>
              <p className="text-sm font-medium">Base</p>
              <p className="text-sm text-muted-foreground">
                Light, dark, or follow your system.
              </p>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border px-3 py-3">
            <div>
              <p className="text-sm font-medium">Accent</p>
              <p className="text-sm text-muted-foreground">
                The primary color, on light or dark.
              </p>
            </div>
            <AccentSelect
              initial={
                user && isAccent(user.accent) ? user.accent : DEFAULT_ACCENT
              }
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border px-3 py-3">
            <div>
              <p className="text-sm font-medium">Size</p>
              <p className="text-sm text-muted-foreground">
                Scale the whole interface.
              </p>
            </div>
            <SizeSelect
              initial={user && isSize(user.size) ? user.size : DEFAULT_SIZE}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border px-3 py-3">
            <div>
              <p className="text-sm font-medium">Font</p>
              <p className="text-sm text-muted-foreground">
                Choose your reading font.
              </p>
            </div>
            <FontSelect
              initial={user && isFontKey(user.font) ? user.font : DEFAULT_FONT}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border px-3 py-3">
            <div>
              <p className="text-sm font-medium">Surface</p>
              <p className="text-sm text-muted-foreground">
                Background &amp; card tone.
              </p>
            </div>
            <AppearancePicker
              attr="surface"
              prefKey="surface"
              options={SURFACES}
              initial={
                user && isSurface(user.surface) ? user.surface : DEFAULT_SURFACE
              }
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border px-3 py-3">
            <div>
              <p className="text-sm font-medium">Radius</p>
              <p className="text-sm text-muted-foreground">
                Corner roundness.
              </p>
            </div>
            <AppearancePicker
              attr="radius"
              prefKey="radius"
              options={RADII}
              initial={
                user && isRadius(user.radius) ? user.radius : DEFAULT_RADIUS
              }
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border px-3 py-3">
            <div>
              <p className="text-sm font-medium">Card style</p>
              <p className="text-sm text-muted-foreground">
                Flat, bordered, or elevated cards.
              </p>
            </div>
            <AppearancePicker
              attr="card"
              prefKey="cardStyle"
              options={CARD_STYLES}
              initial={
                user && isCardStyle(user.cardStyle)
                  ? user.cardStyle
                  : DEFAULT_CARD_STYLE
              }
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border px-3 py-3">
            <div>
              <p className="text-sm font-medium">Borders</p>
              <p className="text-sm text-muted-foreground">
                Divider &amp; border strength.
              </p>
            </div>
            <AppearancePicker
              attr="border"
              prefKey="borderDensity"
              options={BORDER_DENSITIES}
              initial={
                user && isBorderDensity(user.borderDensity)
                  ? user.borderDensity
                  : DEFAULT_BORDER_DENSITY
              }
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-md border px-3 py-3">
            <div>
              <p className="text-sm font-medium">Shadow</p>
              <p className="text-sm text-muted-foreground">
                Card &amp; popover shadow depth.
              </p>
            </div>
            <AppearancePicker
              attr="shadow"
              prefKey="shadow"
              options={SHADOWS}
              initial={
                user && isShadow(user.shadow) ? user.shadow : DEFAULT_SHADOW
              }
            />
          </div>
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

      <Separator className="my-8" />

      <section>
        <h2 className="mb-3 text-lg font-medium">Account</h2>
        <AccountSettings
          initialNotificationsEnabled={user?.notificationsEnabled ?? true}
        />
      </section>
    </div>
  );
}
