# KSPlatform — Knowledge Sharing Platform

A full-stack Next.js application where people sign up, write knowledge posts in a
WYSIWYG editor (with image upload and one-click Markdown export) or short
tweet-style updates, tag them, and subscribe to tags to curate their feed and get
notified about new content. Readers can comment (with threaded replies), like, and
bookmark; everyone gets a public profile with an avatar. Admins can moderate.

The whole stack is Dockerized — `docker compose up --build` brings up the app,
PostgreSQL, and MinIO, runs database migrations automatically, and serves the app
on port 3000.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
  - [Request & rendering model](#request--rendering-model)
  - [Data model](#data-model)
  - [Authentication & roles](#authentication--roles)
  - [Image uploads (MinIO / S3)](#image-uploads-minio--s3)
  - [Editor & Markdown pipeline](#editor--markdown-pipeline)
  - [Tweets & the unified timeline](#tweets--the-unified-timeline)
  - [Pagination & infinite scroll](#pagination--infinite-scroll)
  - [Comments & threaded replies](#comments--threaded-replies)
  - [Admin & moderation](#admin--moderation)
  - [Tag search (pg_trgm)](#tag-search-pg_trgm)
  - [Theming & fonts](#theming--fonts)
  - [Notifications](#notifications)
- [Project layout](#project-layout)
- [Development](#development)
- [Production deployment](#production-deployment)
- [Environment variables](#environment-variables)
- [Database & migrations](#database--migrations)
- [npm scripts](#npm-scripts)
- [Troubleshooting](#troubleshooting)

---

## Features

- **Auth** — email/password signup & login (bcrypt-hashed, JWT sessions).
- **WYSIWYG editor** — Tiptap with bold/italic/headings/lists/quote/code/link and
  **image upload**; content is persisted as **Markdown**.
- **Export to `.md`** — one-click download of any post as a Markdown file.
- **Tweets** — short (≤280 char) updates with one optional image and tags; they get
  likes, threaded replies, and appear on `/tweets`, on profiles, and interleaved into
  the home timeline.
- **Free-form tags** — created on the fly, with **typo-tolerant search** when adding
  tags to a post/tweet and when finding tags to subscribe to.
- **Feed filtering + infinite scroll** — a unified post+tweet timeline with **All** /
  **My subscriptions** / by **tag**, cursor-paginated so it scales.
- **Most liked this week** — a trending sidebar on the home dashboard.
- **People directory** — browse all users at `/people` (infinite scroll).
- **Drafts + edit/delete** — author-only; drafts are visible only to their author.
- **Subscriptions + in-app notifications** — publishing a post or tweet fans out
  notifications to subscribers of its tags; a bell badge shows the unread count.
- **Engagement** — comments with **threaded replies** (posts & tweets), likes, bookmarks.
- **Public profiles** with **avatar upload**.
- **Admin role** — admins can delete any post, tweet, comment, or user via an `/admin`
  dashboard and inline moderation controls.
- **Appearance** — a **theme picker** (Light, Dark, Midnight, Rose, Emerald, Solarized
  + System) and a **font** picker, both saved per account and synced across devices.

---

## Tech stack

| Layer            | Choice                                                                 |
| ---------------- | ---------------------------------------------------------------------- |
| Framework        | **Next.js 16** (App Router, Server Actions, `output: "standalone"`)    |
| Language         | TypeScript (strict)                                                    |
| UI               | **shadcn/ui** (radix-nova) + **Tailwind CSS v4** + lucide-react + sonner |
| Database         | **PostgreSQL 16**                                                      |
| ORM              | **Prisma 7** — new `prisma-client` generator + `@prisma/adapter-pg` driver adapter |
| Auth             | **Auth.js v5** (`next-auth@beta`) — Credentials provider, JWT sessions |
| Editor           | **Tiptap 3** (StarterKit + Image)                                      |
| Markdown         | `turndown` (HTML→MD) + `marked` (MD→HTML) + `react-markdown`/`remark-gfm` (render) |
| Object storage   | **MinIO** (S3-compatible) via `@aws-sdk/client-s3`                      |
| Theming          | `next-themes` (theme) + `data-font` attribute + `next/font/google`     |
| Validation       | `zod`                                                                  |
| Containerization | Docker multi-stage build + docker-compose (app, postgres, minio)       |

> **Note on versions:** This project intentionally targets the current majors
> (Next 16, Prisma 7, Tailwind 4, Auth.js v5). Several conventions differ from older
> tutorials — see [`CLAUDE.md`](./CLAUDE.md) for the specifics that bite (e.g.
> `middleware`→`proxy`, async `params`/`searchParams`, Prisma's `prisma.config.ts`).

---

## Architecture

### Request & rendering model

- **App Router, server-first.** Pages are React Server Components that read the
  session and query the database directly via the Prisma singleton
  (`src/lib/prisma.ts`). They are dynamic (they read cookies via `auth()`), so they
  render per-request.
- **Mutations are Server Actions** (`src/actions/*`), not REST endpoints. Each action
  re-validates auth/ownership server-side and calls `revalidatePath()` or relies on
  the client `router.refresh()` to refresh the UI.
- **Route Handlers** (`src/app/api/*`) exist only where a non-action HTTP endpoint is
  needed: Auth.js callbacks, image upload (multipart), and tag search (GET).
- **Auth is enforced in pages/actions, not middleware.** `requireUserId()` redirects
  unauthenticated users; every Server Action that mutates re-checks ownership. (Next
  16 renamed `middleware`→`proxy`; we deliberately don't rely on it for auth.)

A typical write flow (create a post):

```
PostForm (client)
  → createPostAction(input)            // src/actions/posts.ts ("use server")
      → requireUserId()                // auth guard
      → zod validate (postSchema)
      → uniqueSlug() + resolveTagIds() // upsert free-form tags
      → prisma.post.create(...)
      → notifySubscribers()            // fan-out Notification rows on publish
      → revalidatePath("/") + redirect("/posts/[slug]")
```

### Data model

Defined in [`prisma/schema.prisma`](./prisma/schema.prisma). Cuid ids; cascading
deletes on owning relations.

```
User ──< Post  ──< PostTag  >── Tag ──< TweetTag >── Tweet >── User
 │        │                     │                      │
 │        ├──< Comment >─┐       ├──< Subscription >── User
 │        ├──< Like      │ (Comment also ──< Tweet, and self-relation for replies)
 │        └──< Bookmark  │       └──< Notification >── User  (Post OR Tweet)
 └──< Tweet ──< TweetLike / TweetTag / Comment
```

- **User** — `email`(unique), `name`, `passwordHash`, `bio?`, `image?`, `role`
  (`USER|ADMIN`), plus per-account UI prefs `theme` and `font`.
- **Post** — `title`, `slug`(unique), `contentMd`, `excerpt?`, `status`
  (`DRAFT|PUBLISHED`), `authorId`, `publishedAt?`. Indexed on `(status, publishedAt)`.
- **Tweet** — `body`(≤280), `imageUrl?`, `authorId`, `createdAt`. Has `TweetLike` and
  `TweetTag` join tables.
- **Tag** — `name`(unique), `slug`(unique). A GIN trigram index on `name` powers
  fuzzy search. Joins to both posts (`PostTag`) and tweets (`TweetTag`).
- **Comment** — belongs to exactly one of **Post or Tweet**, with a self-relation
  `parentId` for single-level threaded replies.
- **Subscription / Like / Bookmark / TweetLike** — composite-PK join tables.
- **Notification** — `userId`, `tagId`, `read`, and exactly one of `postId`/`tweetId`.

### Authentication & roles

- `src/auth.ts` configures Auth.js with a **Credentials** provider that looks up the
  user and `bcrypt.compare`s the password. **JWT session strategy** (no DB session
  tables). The user `id` and `role` are threaded into the JWT and session via
  callbacks; the session type is augmented in `src/types/next-auth.d.ts`.
- `src/app/api/auth/[...nextauth]/route.ts` exposes the Auth.js handlers.
- `src/actions/auth.ts` holds `signupAction` / `loginAction` / `logoutAction`.
- `src/lib/session.ts` provides `getCurrentUser()`, `requireUserId(redirectTo?)`,
  `isAdmin()`, and `requireAdmin()`.
- **Roles** default to `USER`. Set `ADMIN` directly in the DB, or set the `ADMIN_EMAIL`
  env var to auto-promote that account on its next login. Because the role lives in the
  JWT, a hand-edited role takes effect on the user's next login.

### Image uploads (MinIO / S3)

- `src/lib/s3.ts` builds an `S3Client` pointed at MinIO (`forcePathStyle: true`).
- `src/app/api/upload/route.ts` (auth-required) validates type/size (≤5 MB, images),
  stores under `posts/`, `avatars/`, or `tweets/<userId>/…` (chosen by a `kind` form
  field), and returns a public URL via `publicUrl()`.
- The bucket is created and made publicly readable by the `createbuckets` one-shot
  container in `docker-compose.yml`.
- **Important:** the server talks to MinIO over the internal network
  (`S3_ENDPOINT=http://minio:9000`) but returns **browser-reachable** URLs
  (`S3_PUBLIC_URL`). These differ in Docker.

### Editor & Markdown pipeline

- `src/components/editor/TiptapEditor.tsx` is the WYSIWYG surface. On every change it
  converts the editor HTML to Markdown (`turndown` + GFM) and reports it upward; when
  editing an existing post, stored Markdown is converted back to HTML (`marked`) to
  seed the editor. Image button → `/api/upload` → inserts the returned URL.
- Posts are **stored as Markdown** (`Post.contentMd`), which makes "Export to `.md`"
  trivial (`PostActions.tsx` builds a Blob and downloads it).
- Published posts are rendered with `react-markdown` + `remark-gfm`
  (`src/components/posts/Markdown.tsx`), styled with `@tailwindcss/typography`.

### Tweets & the unified timeline

- Tweets are a separate model (`src/actions/tweets.ts`, `src/lib/tweets.ts`). The
  composer (`TweetComposer`) enforces the 280-char limit, uploads one optional image
  (`kind=tweet`), and attaches tags via the shared `TagAutocomplete`.
- The home page is a **unified timeline**: `loadTimeline` (`src/actions/timeline.ts`)
  queries posts and tweets separately, merges them by activity time, and paginates with
  an **ISO-timestamp cursor** (each next page returns items strictly older than the
  cursor). `UnifiedFeed` renders each item as a `PostCard` or `TweetCard`.
- `/tweets` is a tweet-only feed; `/tweets/[id]` is the detail view with replies.

### Pagination & infinite scroll

- `src/components/InfiniteList.tsx` is a generic client component: it renders an SSR
  first page, then an `IntersectionObserver` sentinel calls a `loadMore(cursor)` server
  action and appends pages until the cursor is `null`.
- Posts/tweets use id- or time-based cursors; the `/people` directory
  (`loadMoreUsers`) paginates users the same way. Shared query helpers live in
  `src/lib/feed.ts`, `src/lib/tweets.ts`, and `src/lib/users.ts`.

### Comments & threaded replies

- `Comment` targets a post **or** a tweet and supports one level of replies
  (`parentId`). `src/actions/comments.ts` validates the target and persists replies.
- The reusable `src/components/comments/*` (`CommentSection`, `CommentItem`,
  `CommentForm`) render the thread on both the post page and the tweet detail page.

### Admin & moderation

- `requireAdmin()` guards the `/admin` dashboard, which lists users, posts, and tweets
  with delete controls (deleting a user cascades their content).
- Post/tweet/comment delete actions allow the **owner or an admin**, so admins also get
  inline delete controls on content (`src/actions/admin.ts` powers the dashboard).

### Tag search (pg_trgm)

Because tags are free-form and user-created, exact matching isn't enough.

- The migration enables the Postgres `pg_trgm` extension and adds a GIN index:
  `CREATE INDEX tag_name_trgm_idx ON "Tag" USING gin (name gin_trgm_ops);`
- `src/app/api/tags/search/route.ts` runs a raw query matching on trigram similarity
  (`name % q`) **or** prefix (`ILIKE q%`), ranked by `similarity()` then post count.
- `src/components/tags/useTagSearch.ts` is a debounced fetch hook reused by both:
  - `TagAutocomplete.tsx` — in the post editor; suggests existing tags and offers a
    "Create '<name>'" option (free-form creation preserved; the server upserts).
  - `TagSubscribeSearch.tsx` — in Settings; search tags and subscribe inline.

### Theming & fonts

- **Theme** uses `next-themes` (`src/components/theme/Providers.tsx`,
  `attribute="class"`, `enableSystem`) with a **value map** to class names. Six curated
  palettes (Light, Dark, Midnight, Rose, Emerald, Solarized) plus System are defined as
  CSS token sets in `globals.css`; the picker lives in the navbar and Settings. The
  `dark` Tailwind variant is extended to the dark-based custom themes so `dark:`
  utilities and prose inversion apply under them.
- **Font** is applied via a `data-font` attribute on `<html>` that CSS maps to
  Tailwind's `--font-sans` (see the `[data-font="…"]` rules in `globals.css`). All
  fonts are loaded once in `src/lib/fonts.ts` via `next/font/google`.
- **Per-account persistence:** the root layout reads the logged-in user's `theme`/
  `font` from the DB and seeds the providers / `data-font` server-side (so a fresh
  device gets the saved preference with no flash). Changes call
  `updatePreferencesAction` (`src/actions/preferences.ts`) to persist.

### Notifications

- On publishing a post, `notifySubscribers()` (in `src/actions/posts.ts`) creates one
  `Notification` per subscriber of the post's or tweet's tags (deduped per user,
  excluding the author). The shared `notifySubscribers` helper lives in
  `src/lib/tagging.ts`.
- The navbar bell shows the unread count; `/notifications` lists them (post or tweet)
  and supports mark-one / mark-all-read.

---

## Project layout

```
.
├── prisma/
│   ├── schema.prisma            # data model (Prisma 7 prisma-client generator)
│   ├── seed.ts                  # seeds demo + admin users, tags, sample tweets
│   └── migrations/              # init, prefs_and_tag_search, tweets_admin_threading
├── prisma.config.ts             # Prisma 7 config: datasource url + seed command
├── src/
│   ├── auth.ts                  # Auth.js config (Credentials, JWT, role)
│   ├── app/
│   │   ├── layout.tsx           # root layout: fonts, theme/font seeding, navbar
│   │   ├── globals.css          # Tailwind v4 + shadcn tokens + themes + [data-font]
│   │   ├── page.tsx             # unified home timeline (posts + tweets) + trending
│   │   ├── (auth)/login, signup # auth pages
│   │   ├── new/                 # create post
│   │   ├── posts/[slug]/        # post view + /edit
│   │   ├── tweets/              # tweet feed + /[id] detail
│   │   ├── people/             # users directory (infinite scroll)
│   │   ├── admin/               # admin dashboard (guarded)
│   │   ├── u/[id]/              # public profile (posts + tweets)
│   │   ├── settings/            # profile, avatar, appearance, subscriptions
│   │   ├── notifications/       # notifications list
│   │   └── api/                 # auth, upload (MinIO), tags/search (trigram)
│   ├── actions/                 # server actions: auth, posts, tweets, timeline,
│   │   │                        # feed, comments, reactions, subscriptions,
│   │   │                        # notifications, profile, preferences, admin
│   ├── components/
│   │   ├── editor/              # TiptapEditor, PostForm
│   │   ├── feed/                # FeedFilters, PostCard, UnifiedFeed, TrendingPosts
│   │   ├── tweets/              # TweetComposer, TweetCard, TweetFeed
│   │   ├── comments/            # CommentSection, CommentItem, CommentForm
│   │   ├── people/              # UserCard, PeopleFeed
│   │   ├── admin/               # AdminDeleteButton
│   │   ├── posts/               # Markdown, PostActions
│   │   ├── tags/                # TagAutocomplete, TagSubscribeSearch, useTagSearch
│   │   ├── theme/               # Providers, ThemeToggle, FontSelect
│   │   ├── layout/              # Navbar, UserMenu
│   │   ├── notifications/       # NotificationItem, MarkAllReadButton
│   │   ├── settings/            # ProfileForm (with avatar upload)
│   │   ├── InfiniteList.tsx     # generic cursor infinite scroll
│   │   ├── SubscribeButton.tsx
│   │   └── ui/                  # shadcn primitives
│   ├── lib/                     # prisma, s3, session, slug, markdown, fonts,
│   │                            # feed, tweets, users, comments, tagging,
│   │                            # format, validation (zod schemas), utils
│   ├── types/                   # next-auth + module type augmentations
│   └── generated/prisma/        # generated Prisma client (gitignored)
├── Dockerfile                   # multi-stage standalone build
├── docker-compose.yml           # app + postgres + minio + createbuckets
├── docker-entrypoint.sh         # runs `prisma migrate deploy` then starts server
├── .env.example
└── next.config.ts               # output: "standalone" + image remotePatterns
```

---

## Development

### Prerequisites

- Node.js 20+ (22 recommended) and npm
- Docker + Docker Compose (for Postgres + MinIO; and to run the full stack)

### Option A — full stack in Docker (closest to production)

```bash
export AUTH_SECRET="$(openssl rand -base64 32)"   # optional; a dev default exists
docker compose up --build
```

- App: http://localhost:3000
- MinIO console: http://localhost:9001 (`minioadmin` / `minioadmin`)
- Migrations run automatically on app startup; the uploads bucket is created and made
  public by the `createbuckets` job.

Seed demo data (optional, run from the host while the stack is up):

```bash
npm install        # generates the Prisma client via postinstall
npm run db:seed    # demo + admin users (password123), starter tags, sample tweets
```

### Option B — app on the host, infra in Docker (fast iteration)

```bash
# 1. Start only the infrastructure
docker compose up -d postgres minio createbuckets

# 2. Configure environment
cp .env.example .env            # then set AUTH_SECRET (openssl rand -base64 32)

# 3. Install deps, set up the DB, seed, run
npm install
npm run db:migrate              # applies migrations to the dev DB
npm run db:seed
npm run dev                     # http://localhost:3000 (hot reload)
```

In this mode the app runs with `DATABASE_URL` and `S3_ENDPOINT` pointing at
`localhost` (the published container ports). The `.env.example` defaults already do
this.

### Demo login

After seeding: **`demo@ksplatform.dev`** / **`password123`** (regular user) and
**`admin@ksplatform.dev`** / **`password123`** (admin).

### Code quality

```bash
npx tsc --noEmit     # type check
npm run lint         # eslint (next + react-hooks rules)
npm run build        # full production build (prisma generate + next build)
```

---

## Production deployment

The app is built as a **Next.js standalone** image and run behind the bundled
`docker-entrypoint.sh`, which applies pending migrations (`prisma migrate deploy`)
before starting the server.

### With docker-compose (single host)

```bash
# Set a strong secret (required for stable sessions across restarts)
export AUTH_SECRET="$(openssl rand -base64 32)"
docker compose up --build -d
```

`docker-compose.yml` provisions:

- **postgres** — PostgreSQL 16 with a persistent `pgdata` volume and a healthcheck.
- **minio** — S3-compatible storage with a persistent `miniodata` volume; API on
  9000, console on 9001.
- **createbuckets** — a one-shot `mc` job that creates `ksplatform-uploads` and sets
  it to public-read, then exits.
- **app** — built from the `Dockerfile`; waits for postgres (healthy) and
  createbuckets (completed), runs migrations, then serves on 3000.

### Production checklist / notes

- **`AUTH_SECRET`** — set a real 32+ byte secret. The compose file falls back to a
  dev-only placeholder; **override it in production** (env or a secrets manager).
- **`S3_PUBLIC_URL`** — must be the URL the **browser** uses to fetch images. In the
  default compose it's `http://localhost:9000/ksplatform-uploads`. Behind a domain,
  point this at your public MinIO/S3 endpoint (e.g.
  `https://cdn.example.com/ksplatform-uploads`) and keep `S3_ENDPOINT` as the
  server-to-server address.
- **Reverse proxy / TLS** — terminate TLS at a proxy (nginx/Caddy/Traefik) in front of
  the app on 3000. Auth.js trusts the host because `AUTH_TRUST_HOST=true`; ensure the
  proxy forwards `X-Forwarded-*` headers.
- **Managed Postgres / external S3** — you can drop the `postgres`/`minio` services
  and point `DATABASE_URL` at a managed Postgres and the `S3_*` vars at AWS S3, R2,
  etc. `pg_trgm` must be available on the managed instance (it ships with standard
  Postgres; the migration runs `CREATE EXTENSION IF NOT EXISTS pg_trgm`).
- **Migrations** — applied automatically at container start. To run them out-of-band
  instead, remove the `migrate deploy` line from `docker-entrypoint.sh` and run
  `npm run db:deploy` as a job/step.
- **Scaling** — the app is stateless (JWT sessions), so it scales horizontally behind
  a load balancer. Object storage and Postgres are the shared state.
- **Image build note** — the Dockerfile uses `npm install` (not `npm ci`) in the deps
  stage because the macOS-generated lockfile omits Linux-only optional deps; a
  build-time placeholder `DATABASE_URL` lets `prisma generate` run. Both are
  documented inline.

---

## Environment variables

See [`.env.example`](./.env.example).

**App runtime** (used by `npm run dev` and the app container):

| Variable          | Required | Example                                                    | Purpose                                                       |
| ----------------- | :------: | ---------------------------------------------------------- | ------------------------------------------------------------- |
| `DATABASE_URL`    |    ✅    | `postgresql://ksuser:kspassword@localhost:5432/ksplatform` | Postgres connection string                                    |
| `AUTH_SECRET`     |    ✅    | `openssl rand -base64 32`                                  | Auth.js JWT signing secret                                    |
| `AUTH_TRUST_HOST` |    ✅    | `true`                                                     | Trust the deployment host (needed behind a proxy / in Docker) |
| `ADMIN_EMAIL`     |    —     | `you@example.com`                                          | If set, this account is auto-promoted to ADMIN on login       |
| `S3_ENDPOINT`     |    ✅    | `http://minio:9000`                                        | MinIO/S3 API endpoint (server-to-server)                      |
| `S3_REGION`       |    ✅    | `us-east-1`                                                | S3 region                                                     |
| `S3_ACCESS_KEY`   |    ✅    | `minioadmin`                                               | S3 access key                                                 |
| `S3_SECRET_KEY`   |    ✅    | `minioadmin`                                               | S3 secret key                                                 |
| `S3_BUCKET`       |    ✅    | `ksplatform-uploads`                                       | Uploads bucket name                                           |
| `S3_PUBLIC_URL`   |    ✅    | `http://localhost:9000/ksplatform-uploads`                 | **Browser-reachable** base URL for uploaded objects           |

**Docker Compose** (substituted into `docker-compose.yml`; all have safe defaults but
should be overridden in production):

| Variable                                | Example              | Purpose                              |
| --------------------------------------- | -------------------- | ------------------------------------ |
| `POSTGRES_USER` / `_PASSWORD` / `_DB`   | `ksuser` / … / `ksplatform` | Postgres credentials + database name |
| `POSTGRES_PORT`                         | `5432`               | Host port for Postgres               |
| `MINIO_ROOT_USER` / `_PASSWORD`         | `minioadmin`         | MinIO root creds (also the app's S3 keys) |
| `MINIO_API_PORT` / `_CONSOLE_PORT`      | `9000` / `9001`      | Host ports for the MinIO API/console |
| `APP_PORT`                              | `3000`               | Host port for the app                |

> In docker-compose, the app uses host `postgres`/`minio` (internal network) while the
> `.env.example` uses `localhost` for host-based development. `S3_ENDPOINT` and
> `S3_PUBLIC_URL` differ on purpose (internal vs. browser).

---

## Database & migrations

This project uses **Prisma 7**, which differs from older Prisma:

- The schema's `datasource` has **no `url`** — the connection URL lives in
  [`prisma.config.ts`](./prisma.config.ts) (`datasource.url = env("DATABASE_URL")`).
- The client is generated by the new `prisma-client` generator into
  `src/generated/prisma` (gitignored) and imported from `@/generated/prisma/client`.
- Runtime uses the **`@prisma/adapter-pg`** driver adapter (see `src/lib/prisma.ts`).
- The seed command is configured under `migrations.seed` in `prisma.config.ts`.

Common workflows:

```bash
# Create + apply a new migration during development
npm run db:migrate -- --name your_change

# Create a migration without applying (to hand-edit SQL, e.g. extensions/indexes)
npx prisma migrate dev --create-only --name your_change

# Apply pending migrations (production / CI)
npm run db:deploy

# Regenerate the client after editing the schema
npx prisma generate

# Browse data
npm run db:studio
```

Migrations: `init` (core schema), `prefs_and_tag_search` (adds `User.theme`/`font`,
enables `pg_trgm`, and the GIN index on `Tag.name`), and `tweets_admin_threading`
(adds `Role`, the `Tweet`/`TweetLike`/`TweetTag` models, threaded comments, and tweet
notifications).

---

## npm scripts

| Script             | What it does                                          |
| ------------------ | ----------------------------------------------------- |
| `npm run dev`      | Start the dev server (hot reload)                     |
| `npm run build`    | `prisma generate` + `next build` (standalone output)  |
| `npm run start`    | Start the production server (use the Docker image in prod) |
| `npm run lint`     | ESLint                                                |
| `npm run db:migrate` | `prisma migrate dev` (create/apply dev migration)   |
| `npm run db:deploy`  | `prisma migrate deploy` (apply pending migrations)  |
| `npm run db:seed`    | Seed demo user + starter tags                       |
| `npm run db:studio`  | Open Prisma Studio                                  |

---

## Troubleshooting

- **"Timed out trying to acquire a postgres advisory lock" on startup** — a stale
  `prisma migrate` process is holding the migration lock. Kill any lingering
  `prisma migrate` processes (and the idle DB backend) and restart the app. Only one
  migration process should touch the DB at a time.
- **`npm ci` fails in Docker with "Missing: @emnapi/… from lock file"** — the
  macOS-generated lockfile omits Linux-only optional deps. The Dockerfile already uses
  `npm install` to avoid this; if you re-introduce `npm ci`, regenerate the lockfile on
  Linux first.
- **Images don't load in the browser** — check `S3_PUBLIC_URL` is reachable from the
  browser and the bucket is public (the `createbuckets` job sets `download` policy).
- **Theme/font flicker or not persisting** — preferences are seeded from the DB in the
  root layout for logged-in users; guests use defaults. Ensure you're logged in and
  the `prefs_and_tag_search` migration has been applied.
- **Auth/session issues after redeploy** — make sure `AUTH_SECRET` is stable and set;
  a changing secret invalidates existing JWTs.
