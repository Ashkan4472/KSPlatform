export type UserSummary = {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  role: "USER" | "ADMIN";
  postCount: number;
  tweetCount: number;
};

export type UserPage = { items: UserSummary[]; nextCursor: string | null };

export const usersSelect = {
  id: true,
  name: true,
  image: true,
  bio: true,
  role: true,
  _count: { select: { posts: true, tweets: true } },
} as const;

type RawUser = {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  role: "USER" | "ADMIN";
  _count: { posts: number; tweets: number };
};

export function toUserSummary(u: RawUser): UserSummary {
  return {
    id: u.id,
    name: u.name,
    image: u.image,
    bio: u.bio,
    role: u.role,
    postCount: u._count.posts,
    tweetCount: u._count.tweets,
  };
}
