import Link from "next/link";
import { Bell, PenSquare } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/layout/UserMenu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  let unread = 0;
  if (user?.id) {
    unread = await prisma.notification.count({
      where: { userId: user.id, read: false },
    });
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="rounded-md bg-foreground px-1.5 py-0.5 text-sm text-background">
            KS
          </span>
          <span className="hidden sm:inline">KSPlatform</span>
        </Link>

        <nav className="flex items-center gap-2">
          <ThemeToggle />
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/new">
                  <PenSquare className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Write</span>
                </Link>
              </Button>
              <Button
                asChild
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Notifications"
              >
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-white">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </Link>
              </Button>
              <UserMenu
                id={user.id}
                name={user.name ?? "User"}
                email={user.email}
                image={user.image}
              />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">Sign up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
