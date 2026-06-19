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
  await prisma.user.upsert({
    where: { email: "demo@ksplatform.dev" },
    update: {},
    create: {
      email: "demo@ksplatform.dev",
      name: "Demo Author",
      passwordHash,
      bio: "Sharing what I learn, one post at a time.",
    },
  });

  console.log("Seed complete. Demo login: demo@ksplatform.dev / password123");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
