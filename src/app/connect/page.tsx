import { requireUserId } from "@/lib/session";
import { ConnectForm } from "@/components/connect/ConnectForm";

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  await requireUserId(`/connect${code ? `?code=${code}` : ""}`);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-12">
      <ConnectForm initialCode={code ?? ""} />
    </div>
  );
}
