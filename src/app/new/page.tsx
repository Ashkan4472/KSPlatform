import { requireUserId } from "@/lib/session";
import { PostForm } from "@/components/editor/PostForm";

export const metadata = { title: "Write a post — KSPlatform" };

export default async function NewPostPage() {
  await requireUserId("/new");

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Write a post</h1>
      <PostForm mode="create" />
    </div>
  );
}
