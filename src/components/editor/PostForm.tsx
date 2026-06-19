"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TiptapEditor } from "@/components/editor/TiptapEditor";
import { TagAutocomplete } from "@/components/tags/TagAutocomplete";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPostAction, updatePostAction, deletePostAction } from "@/actions/posts";
import type { PostInput } from "@/lib/validation";

type Props = {
  mode: "create" | "edit";
  post?: {
    id: string;
    title: string;
    contentMd: string;
    tags: string[];
  };
};

export function PostForm({ mode, post }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(post?.title ?? "");
  const [contentMd, setContentMd] = useState(post?.contentMd ?? "");
  const [tags, setTags] = useState<string[]>(post?.tags ?? []);
  const [pending, startTransition] = useTransition();
  const [deleting, startDelete] = useTransition();

  function submit(status: "DRAFT" | "PUBLISHED") {
    if (title.trim().length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }
    if (contentMd.trim().length === 0) {
      toast.error("Content cannot be empty");
      return;
    }
    const input: PostInput = { title: title.trim(), contentMd, tags, status };
    startTransition(async () => {
      const result =
        mode === "edit" && post
          ? await updatePostAction(post.id, input)
          : await createPostAction(input);
      // On success the action redirects and this line is unreachable.
      if (result?.error) toast.error(result.error);
    });
  }

  function onDelete() {
    if (!post) return;
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    startDelete(async () => {
      const result = await deletePostAction(post.id);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A clear, descriptive title"
          className="text-base"
        />
      </div>

      <div className="space-y-2">
        <Label>Content</Label>
        <TiptapEditor
          initialMarkdown={post?.contentMd ?? ""}
          onChangeMarkdown={setContentMd}
        />
        <p className="text-xs text-muted-foreground">
          Use the toolbar to format text and insert images. Saved as Markdown.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <TagAutocomplete value={tags} onChange={setTags} />
        <p className="text-xs text-muted-foreground">
          Search existing tags or create new ones. Up to 8 tags.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => submit("PUBLISHED")} disabled={pending}>
          {pending ? "Saving…" : "Publish"}
        </Button>
        <Button
          variant="outline"
          onClick={() => submit("DRAFT")}
          disabled={pending}
        >
          Save draft
        </Button>
        <Button variant="ghost" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
        {mode === "edit" && (
          <Button
            variant="ghost"
            className="ml-auto text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        )}
      </div>
    </div>
  );
}
