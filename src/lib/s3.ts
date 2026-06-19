import { S3Client } from "@aws-sdk/client-s3";

export const S3_BUCKET = process.env.S3_BUCKET ?? "ksplatform-uploads";
export const S3_PUBLIC_URL =
  process.env.S3_PUBLIC_URL ?? "http://localhost:9000/ksplatform-uploads";

export const s3 = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT ?? "http://localhost:9000",
  // Required for MinIO and other S3-compatible providers.
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "minioadmin",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "minioadmin",
  },
});

/** Public, browser-reachable URL for a stored object key. */
export function publicUrl(key: string): string {
  return `${S3_PUBLIC_URL.replace(/\/$/, "")}/${key}`;
}
