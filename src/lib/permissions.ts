/**
 * specs/006: permissions are composed from three fixed taxonomies rather
 * than an ad-hoc flat list — feature (the resource), group (whose
 * content: your own vs anyone's), action (the verb). A permission key is
 * always `${feature}:${group}:${action}`.
 */
export const FEATURES = ["post", "tweet", "comment", "user"] as const;
export type Feature = (typeof FEATURES)[number];

export const GROUPS = ["self", "all"] as const;
export type Group = (typeof GROUPS)[number];

export const ACTIONS = ["read", "create", "update", "delete"] as const;
export type Action = (typeof ACTIONS)[number];

/** Compose a permission key from the taxonomy — use this, not a hand-typed string. */
function permission<F extends Feature, G extends Group, A extends Action>(
  feature: F,
  group: G,
  action: A,
): `${F}:${G}:${A}` {
  return `${feature}:${group}:${action}`;
}

/**
 * The curated set of feature×group×action combinations that map to a real
 * capability in the app today — not the full cartesian product (most
 * combinations, e.g. "user:all:create", don't correspond to anything).
 * `Permission` is derived from this list, not from the full taxonomy
 * product, so the type system only allows real permissions.
 */
export const PERMISSIONS = [
  permission("post", "self", "delete"),
  permission("post", "all", "delete"),
  permission("tweet", "self", "delete"),
  permission("tweet", "all", "delete"),
  permission("comment", "self", "delete"),
  permission("comment", "all", "delete"),
  permission("user", "self", "delete"),
  permission("user", "all", "delete"),
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export const PERMISSION_LABELS: Record<Permission, string> = {
  "post:self:delete": "Delete your own posts",
  "post:all:delete": "Delete any post (moderation)",
  "tweet:self:delete": "Delete your own tweets",
  "tweet:all:delete": "Delete any tweet (moderation)",
  "comment:self:delete": "Delete your own comments",
  "comment:all:delete": "Delete any comment (moderation)",
  "user:self:delete": "Delete your own account",
  "user:all:delete": "Delete any user (admin)",
};

/**
 * Baseline permissions every signed-in USER already has, regardless of any
 * grant — these mirror the app's existing ownership-based capabilities
 * (you can already delete your own post/tweet/comment/account). Modeling
 * them as permissions keeps the system uniform without changing behavior.
 */
export const DEFAULT_USER_PERMISSIONS: readonly Permission[] = [
  permission("post", "self", "delete"),
  permission("tweet", "self", "delete"),
  permission("comment", "self", "delete"),
  permission("user", "self", "delete"),
];

/**
 * Permissions meaningful to grant/revoke via the IAM screen — the "self"
 * baseline above is implicit for everyone already, so it isn't admin-
 * delegable (revoking someone's ability to delete their own content isn't
 * a capability this spec offers).
 */
export const GRANTABLE_PERMISSIONS: readonly Permission[] = PERMISSIONS.filter(
  (p) => !DEFAULT_USER_PERMISSIONS.includes(p),
);

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

export function isGrantablePermission(value: string): value is Permission {
  return (GRANTABLE_PERMISSIONS as readonly string[]).includes(value);
}
