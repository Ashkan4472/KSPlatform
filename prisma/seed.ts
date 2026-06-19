import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  const tagNames = [
    "javascript",
    "typescript",
    "react",
    "nextjs",
    "devops",
    "databases",
    "career",
  ];

  for (const name of tagNames) {
    await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name, slug: slugify(name) },
    });
  }

  const passwordHash = await bcrypt.hash("password123", 10);
  const demo = await prisma.user.upsert({
    where: { email: "demo@ksplatform.dev" },
    update: {},
    create: {
      email: "demo@ksplatform.dev",
      name: "Demo Author",
      passwordHash,
      bio: "Sharing what I learn, one post at a time.",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@ksplatform.dev" },
    update: { role: "ADMIN" },
    create: {
      email: "admin@ksplatform.dev",
      name: "Site Admin",
      passwordHash,
      role: "ADMIN",
      bio: "Keeping things tidy.",
    },
  });

  // A couple of sample tweets (idempotent-ish: only if the demo user has none).
  const tweetCount = await prisma.tweet.count({ where: { authorId: demo.id } });
  if (tweetCount === 0) {
    const nextTag = await prisma.tag.findUnique({ where: { name: "nextjs" } });
    await prisma.tweet.create({
      data: {
        body: "Just shipped infinite scroll on the feed — cursor pagination keeps it snappy at scale. 🚀",
        authorId: demo.id,
        tags: nextTag ? { create: [{ tagId: nextTag.id }] } : undefined,
      },
    });
    await prisma.tweet.create({
      data: {
        body: "Hot take: storing posts as Markdown makes export trivial and keeps content portable.",
        authorId: demo.id,
      },
    });
  }

  console.log(
    "Seed complete.\n  User:  demo@ksplatform.dev / password123\n  Admin: admin@ksplatform.dev / password123",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
