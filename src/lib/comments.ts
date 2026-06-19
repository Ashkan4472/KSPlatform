import type { Prisma } from "@/generated/prisma/client";

const author = { select: { id: true, name: true, image: true } } as const;

/** Include for top-level comments with their (one-level) replies. */
export const commentThreadInclude = {
  author,
  replies: {
    orderBy: { createdAt: "asc" },
    include: { author },
  },
} satisfies Prisma.CommentInclude;

export type CommentAuthor = {
  id: string;
  name: string;
  image: string | null;
};

export type CommentNode = {
  id: string;
  body: string;
  createdAt: Date;
  author: CommentAuthor;
  replies: {
    id: string;
    body: string;
    createdAt: Date;
    author: CommentAuthor;
  }[];
};
