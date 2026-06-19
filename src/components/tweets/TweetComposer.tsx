"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ImageIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { TagAutocomplete } from "@/components/tags/TagAutocomplete";
import { cn } from "@/lib/utils";
import { createTweetAction } from "@/actions/tweets";
import { TWEET_MAX_LENGTH } from "@/lib/validation";

export function TweetComposer() {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const remaining = TWEET_MAX_LENGTH - body.length;
  const over = remaining < 0;

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", "tweet");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Upload failed");
      }
      const { url } = (await res.json()) as { url: string };
      setImageUrl(url);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function submit() {
    if (body.trim().length === 0) return;
    if (over) {
      toast.error("Tweet is too long");
      return;
    }
    startTransition(async () => {
      const res = await createTweetAction({ body: body.trim(), imageUrl, tags });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      setBody("");
      setImageUrl("");
      setTags([]);
      router.refresh();
      toast.success("Posted");
    });
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's happening?"
          rows={3}
          className="resize-none border-0 px-0 shadow-none focus-visible:ring-0"
        />

        {imageUrl && (
          <div className="relative w-fit">
            <Image
              src={imageUrl}
              alt=""
              width={400}
              height={300}
              className="max-h-60 rounded-md border object-cover"
            />
            <button
              type="button"
              onClick={() => setImageUrl("")}
              aria-label="Remove image"
              className="absolute right-2 top-2 rounded-full bg-background/80 p-1 hover:bg-background"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <TagAutocomplete value={tags} onChange={setTags} />

        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label="Add image"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ImageIcon className="h-5 w-5" />
            )}
          </Button>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "text-xs tabular-nums",
                over ? "text-destructive" : "text-muted-foreground",
              )}
            >
              {remaining}
            </span>
            <Button
              onClick={submit}
              disabled={pending || uploading || over || body.trim().length === 0}
            >
              {pending ? "Posting…" : "Tweet"}
            </Button>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={onPickImage}
        />
      </CardContent>
    </Card>
  );
}
