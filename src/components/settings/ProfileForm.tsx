"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfileAction } from "@/actions/profile";
import { initialsOf } from "@/lib/format";

export function ProfileForm({
  name,
  bio,
  image,
}: {
  name: string;
  bio: string;
  image: string;
}) {
  const [state, formAction, pending] = useActionState(updateProfileAction, {});
  const [imageUrl, setImageUrl] = useState(image);
  const [displayName, setDisplayName] = useState(name);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) toast.success("Profile updated");
    if (state.error) toast.error(state.error);
  }, [state]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", "avatar");
      const res = await fetch("/api/upload", { method: "POST", body });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Upload failed");
      }
      const { url } = (await res.json()) as { url: string };
      setImageUrl(url);
      toast.success("Avatar uploaded — save to apply");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          {imageUrl ? <AvatarImage src={imageUrl} alt={displayName} /> : null}
          <AvatarFallback className="text-lg">
            {initialsOf(displayName || name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {imageUrl ? "Change avatar" : "Upload avatar"}
          </Button>
          {imageUrl && (
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="text-left text-xs text-muted-foreground hover:text-destructive"
            >
              Remove avatar
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={onPick}
        />
      </div>

      {/* Carries the uploaded URL (or empty to clear) to the server action. */}
      <input type="hidden" name="image" value={imageUrl} />

      <div className="space-y-2">
        <Label htmlFor="name">Display name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={name}
          onChange={(e) => setDisplayName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={bio}
          rows={3}
          maxLength={280}
          placeholder="Tell others a bit about yourself"
        />
      </div>
      <Button type="submit" disabled={pending || uploading}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
