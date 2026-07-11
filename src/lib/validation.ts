import { z } from "zod";
import { GRANTABLE_PERMISSIONS } from "@/lib/permissions";

export const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(60),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const grantablePermissionSchema = z.enum(
  GRANTABLE_PERMISSIONS as [string, ...string[]],
);

export const postSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(160),
  contentMd: z.string().min(1, "Content cannot be empty"),
  tags: z.array(z.string().min(1).max(40)).max(8, "Up to 8 tags allowed"),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export const TWEET_MAX_LENGTH = 280;

export const tweetSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Say something")
    .max(TWEET_MAX_LENGTH, `Tweets are limited to ${TWEET_MAX_LENGTH} characters`),
  imageUrl: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string().min(1).max(40)).max(8, "Up to 8 tags allowed"),
});

export const deviceCodeSchema = z.object({
  device_code: z.string().min(1, "device_code is required"),
});

export const approveCodeSchema = z.object({
  userCode: z
    .string()
    .trim()
    .toUpperCase()
    .min(1, "Enter the code shown in the extension"),
});

export const commentSchema = z
  .object({
    postId: z.string().min(1).optional(),
    tweetId: z.string().min(1).optional(),
    parentId: z.string().min(1).optional(),
    body: z.string().min(1, "Comment cannot be empty").max(2000),
  })
  .refine((d) => !!d.postId !== !!d.tweetId, {
    message: "A comment must target exactly one post or tweet",
  });

export type TweetInput = z.infer<typeof tweetSchema>;

export const profileSchema = z.object({
  name: z.string().min(2).max(60),
  bio: z.string().max(280).optional().or(z.literal("")),
  image: z.string().url().optional().or(z.literal("")),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PostInput = z.infer<typeof postSchema>;
