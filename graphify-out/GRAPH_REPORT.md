# Graph Report - .  (2026-07-11)

## Corpus Check
- Corpus is ~28,209 words - fits in a single context window. You may not need a graph.

## Summary
- 662 nodes · 1427 edges · 48 communities (30 shown, 18 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 10 edges (avg confidence: 0.77)
- Token cost: 86,628 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Feed & Filter UI|Feed & Filter UI]]
- [[_COMMUNITY_Posts & Comments Actions|Posts & Comments Actions]]
- [[_COMMUNITY_Feed Loading & Comment UI|Feed Loading & Comment UI]]
- [[_COMMUNITY_Profile Feed & Search|Profile Feed & Search]]
- [[_COMMUNITY_Appearance & Prisma 7 Conventions|Appearance & Prisma 7 Conventions]]
- [[_COMMUNITY_Runtime Dependencies|Runtime Dependencies]]
- [[_COMMUNITY_Dev Dependencies & Tooling|Dev Dependencies & Tooling]]
- [[_COMMUNITY_Markdown, Uploads & Tags|Markdown, Uploads & Tags]]
- [[_COMMUNITY_Appearance Constants|Appearance Constants]]
- [[_COMMUNITY_Appearance Pickers UI|Appearance Pickers UI]]
- [[_COMMUNITY_Preferences Actions|Preferences Actions]]
- [[_COMMUNITY_shadcnui Component Config|shadcn/ui Component Config]]
- [[_COMMUNITY_Admin Moderation Actions|Admin Moderation Actions]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Auth & Session Helpers|Auth & Session Helpers]]
- [[_COMMUNITY_Auth Actions & S3 Uploads|Auth Actions & S3 Uploads]]
- [[_COMMUNITY_Root Layout & Navbar|Root Layout & Navbar]]
- [[_COMMUNITY_Notifications UI & Actions|Notifications UI & Actions]]
- [[_COMMUNITY_Prisma Data Model|Prisma Data Model]]
- [[_COMMUNITY_Project Overview & Stack|Project Overview & Stack]]
- [[_COMMUNITY_Unified Timeline|Unified Timeline]]
- [[_COMMUNITY_DB Seeding|DB Seeding]]
- [[_COMMUNITY_Trigram Search|Trigram Search]]
- [[_COMMUNITY_Size Appearance Axis|Size Appearance Axis]]
- [[_COMMUNITY_Infinite Scroll Pattern|Infinite Scroll Pattern]]
- [[_COMMUNITY_React Compiler Lint Gotchas|React Compiler Lint Gotchas]]
- [[_COMMUNITY_Server Actions Convention|Server Actions Convention]]
- [[_COMMUNITY_Comment Thread Components|Comment Thread Components]]
- [[_COMMUNITY_Auth.js Type Augmentation|Auth.js Type Augmentation]]
- [[_COMMUNITY_Comment Query Helpers|Comment Query Helpers]]
- [[_COMMUNITY_User List Loading|User List Loading]]
- [[_COMMUNITY_Docker Entrypoint|Docker Entrypoint]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Next 16 Async Params Gotcha|Next 16 Async Params Gotcha]]
- [[_COMMUNITY_Formatting Helpers|Formatting Helpers]]
- [[_COMMUNITY_Route Handlers Convention|Route Handlers Convention]]
- [[_COMMUNITY_shadcnui Primitives Convention|shadcn/ui Primitives Convention]]
- [[_COMMUNITY_Tweets Query Helpers|Tweets Query Helpers]]
- [[_COMMUNITY_Verification Instructions|Verification Instructions]]
- [[_COMMUNITY_Upload API Handler|Upload API Handler]]
- [[_COMMUNITY_File Icon Asset|File Icon Asset]]
- [[_COMMUNITY_Globe Icon Asset|Globe Icon Asset]]
- [[_COMMUNITY_Window Icon Asset|Window Icon Asset]]
- [[_COMMUNITY_App Router Rendering Model|App Router Rendering Model]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 80 edges
2. `requireUserId()` - 30 edges
3. `getCurrentUser()` - 22 edges
4. `Button()` - 21 edges
5. `updatePreferencesAction()` - 16 edges
6. `compilerOptions` - 16 edges
7. `initialsOf()` - 15 edges
8. `Badge()` - 13 edges
9. `tweetInclude()` - 13 edges
10. `formatDate()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `vercel.svg (Vercel triangle logo)` --conceptually_related_to--> `Production deployment notes`  [AMBIGUOUS]
  public/vercel.svg → README.md
- `next.svg (Next.js wordmark logo)` --conceptually_related_to--> `Next.js 16 (non-standard fork)`  [INFERRED]
  public/next.svg → AGENTS.md
- `Troubleshooting section` --conceptually_related_to--> `pg_trgm GIN indexes (tag_name_trgm_idx, post_title_trgm_idx, tweet_body_trgm_idx)`  [INFERRED]
  README.md → CLAUDE.md
- `createPostAction` --calls--> `resolveTagIds()`  [EXTRACTED]
  README.md → CLAUDE.md
- `createPostAction` --calls--> `src/lib/slug.ts (slugify, uniqueSlug)`  [EXTRACTED]
  README.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Prisma 7 architecture: config, generator, adapter, raw SQL discipline** — claude_md_prisma_config_ts, claude_md_schema_prisma, claude_md_generated_prisma_client, claude_md_prisma_adapter_pg, claude_md_prisma_ts, claude_md_pg_trgm_indexes, claude_md_queryraw_rule [INFERRED 0.85]
- **9-axis appearance/theming system** — claude_md_appearance_axes, claude_md_fonts_ts, claude_md_globals_css, claude_md_appearancepicker, claude_md_updatepreferencesaction, readme_layout_tsx, readme_providers_tsx [INFERRED 0.85]
- **Dockerized dev/prod stack (app + postgres + minio + createbuckets)** — docker_compose_yml_app_service, docker_compose_yml_postgres_service, docker_compose_yml_minio_service, docker_compose_yml_createbuckets_service, readme_dockerfile, readme_docker_entrypoint_sh [EXTRACTED 1.00]

## Communities (48 total, 18 thin omitted)

### Community 0 - "Feed & Filter UI"
Cohesion: 0.07
Nodes (45): ConfirmDialog(), buildHref(), FeedFilters(), FilterTab(), Props, loadTrending(), TrendingPosts(), loadTagTrends() (+37 more)

### Community 1 - "Posts & Comments Actions"
Cohesion: 0.06
Nodes (49): ActionResult, addCommentAction(), deleteCommentAction(), ActionResult, createPostAction(), deletePostAction(), updatePostAction(), ActionResult (+41 more)

### Community 2 - "Feed Loading & Comment UI"
Cohesion: 0.08
Nodes (40): loadMoreUsers(), CommentForm(), CommentItem(), Row(), CommentSection(), InfiniteList(), Page, Props (+32 more)

### Community 3 - "Profile Feed & Search"
Cohesion: 0.09
Nodes (44): loadUserPosts(), loadUserTweets(), ProfilePostPage, ProfileTweetPage, normalize(), parseOffset(), PostSearchPage, searchPosts() (+36 more)

### Community 4 - "Appearance & Prisma 7 Conventions"
Cohesion: 0.05
Nodes (38): Appearance: 9 composable axes, AppearancePicker (generic component), src/lib/fonts.ts (appearance constants/guards), src/generated/prisma (generated client), src/app/globals.css, pg_trgm GIN indexes (tag_name_trgm_idx, post_title_trgm_idx, tweet_body_trgm_idx), Prisma 7 conventions, @prisma/adapter-pg driver adapter (+30 more)

### Community 5 - "Runtime Dependencies"
Cohesion: 0.07
Nodes (30): dependencies, @aws-sdk/client-s3, bcryptjs, class-variance-authority, clsx, dotenv, lucide-react, marked (+22 more)

### Community 6 - "Dev Dependencies & Tooling"
Cohesion: 0.07
Nodes (27): devDependencies, eslint, eslint-config-next, prisma, tailwindcss, @tailwindcss/postcss, @tailwindcss/typography, tsx (+19 more)

### Community 7 - "Markdown, Uploads & Tags"
Cohesion: 0.08
Nodes (25): KSPlatform npm/docker commands, Markdown.tsx, src/lib/markdown.ts (htmlToMarkdown/markdownToHtml/excerptFromMarkdown), MinIO S3_ENDPOINT vs S3_PUBLIC_URL distinction, Posts stored as Markdown (Post.contentMd), publicUrl(), src/lib/s3.ts, TagAutocomplete (+17 more)

### Community 8 - "Appearance Constants"
Cohesion: 0.08
Nodes (24): ACCENT_KEYS, AccentKey, ACCENTS, BaseKey, BORDER_DENSITY_KEYS, BorderDensityKey, CARD_STYLE_KEYS, CardStyleKey (+16 more)

### Community 9 - "Appearance Pickers UI"
Cohesion: 0.13
Nodes (17): Props, BASES, FontKey, FONTS, FontSelect(), ICONS, DropdownMenu(), DropdownMenuCheckboxItem() (+9 more)

### Community 10 - "Preferences Actions"
Cohesion: 0.18
Nodes (21): updatePreferencesAction(), BORDER_DENSITIES, CARD_STYLES, isAccent(), isBase(), isBorderDensity(), isCardStyle(), isFontKey() (+13 more)

### Community 11 - "shadcn/ui Component Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 12 - "Admin Moderation Actions"
Cohesion: 0.23
Nodes (16): ActionResult, adminDeletePost(), adminDeleteTweet(), adminDeleteUser(), adminListPosts(), adminListTweets(), adminListUsers(), AdminPostRow (+8 more)

### Community 13 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 14 - "Auth & Session Helpers"
Cohesion: 0.12
Nodes (16): Next 16 middleware→proxy gotcha, Moderation convention (owner or admin delete), notifySubscribers(), requireAdmin(), requireUserId(), resolveTagIds(), src/lib/session.ts, src/lib/slug.ts (slugify, uniqueSlug) (+8 more)

### Community 15 - "Auth Actions & S3 Uploads"
Cohesion: 0.15
Nodes (12): AuthFormState, loginAction(), logoutAction(), signupAction(), publicUrl(), s3, loginSchema, signupSchema (+4 more)

### Community 16 - "Root Layout & Navbar"
Cohesion: 0.17
Nodes (9): metadata, Navbar(), SearchBox(), UserMenu(), BASE_KEYS, fontVariables, Providers(), ThemeToggle() (+1 more)

### Community 17 - "Notifications UI & Actions"
Cohesion: 0.27
Nodes (7): markAllNotificationsReadAction(), markNotificationReadAction(), MarkAllReadButton(), NotificationItem(), Props, metadata, NotificationsPage()

### Community 18 - "Prisma Data Model"
Cohesion: 0.31
Nodes (11): Comment model (threaded replies), src/actions/comments.ts, Data model (User/Post/Tweet/Tag/Comment/...), Notification model, Post model, src/actions/search.ts, SearchBox (navbar), Tag model (+3 more)

### Community 19 - "Project Overview & Stack"
Cohesion: 0.25
Nodes (8): KSPlatform, Next.js 16 (non-standard fork), node_modules/next/dist/docs/ guides, KSPlatform Stack (Next 16, React 19, Prisma 7, Postgres 16, Auth.js v5, Tailwind v4, shadcn/ui, Tiptap 3, MinIO, zod), next.svg (Next.js wordmark logo), Features list, KSPlatform (project), Tech stack table

### Community 20 - "Unified Timeline"
Cohesion: 0.33
Nodes (6): src/actions/timeline.ts, Unified home timeline (loadTimeline), PostCard, TweetCard, Unified timeline architecture, UnifiedFeed

### Community 21 - "DB Seeding"
Cohesion: 0.50
Nodes (4): adapter, main(), prisma, slugify()

### Community 22 - "Trigram Search"
Cohesion: 0.50
Nodes (4): $queryRaw bound-params rule, actions/search.ts, api/tags/search route, components/feed/TrendingTags.tsx

### Community 23 - "Size Appearance Axis"
Cohesion: 0.50
Nodes (3): SizeKey, SIZES, SizeSelect()

### Community 24 - "Infinite Scroll Pattern"
Cohesion: 0.67
Nodes (3): src/lib/feed.ts, InfiniteList (generic component), Infinite scroll pattern (InfiniteList + IntersectionObserver)

### Community 25 - "React Compiler Lint Gotchas"
Cohesion: 0.67
Nodes (3): React Compiler lint (react-hooks/*), ThemeToggle.tsx (next-themes mount guard), TrendingPosts.tsx

### Community 26 - "Server Actions Convention"
Cohesion: 0.67
Nodes (3): Server Actions convention (src/actions/*), "use server" files export-only-async rule, src/lib/validation.ts (zod schemas)

### Community 27 - "Comment Thread Components"
Cohesion: 0.67
Nodes (3): CommentForm, CommentItem, CommentSection

## Ambiguous Edges - Review These
- `Production deployment notes` → `vercel.svg (Vercel triangle logo)`  [AMBIGUOUS]
  public/vercel.svg · relation: conceptually_related_to

## Knowledge Gaps
- **222 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+217 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **18 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Production deployment notes` and `vercel.svg (Vercel triangle logo)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `cn()` connect `Feed & Filter UI` to `Posts & Comments Actions`, `Feed Loading & Comment UI`, `Appearance Constants`, `Appearance Pickers UI`, `Preferences Actions`, `Notifications UI & Actions`, `Size Appearance Axis`?**
  _High betweenness centrality (0.080) - this node is a cross-community bridge._
- **Why does `Button()` connect `Feed & Filter UI` to `Posts & Comments Actions`, `Feed Loading & Comment UI`, `Profile Feed & Search`, `Appearance Pickers UI`, `Admin Moderation Actions`, `Root Layout & Navbar`, `Notifications UI & Actions`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **Why does `requireUserId()` connect `Posts & Comments Actions` to `Notifications UI & Actions`, `Preferences Actions`, `Profile Feed & Search`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `getCurrentUser()` (e.g. with `ProfilePage()` and `TweetDetailPage()`) actually correct?**
  _`getCurrentUser()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _235 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Feed & Filter UI` be split into smaller, more focused modules?**
  _Cohesion score 0.07198748043818466 - nodes in this community are weakly interconnected._