import { CreateForm } from "@/components/CreateForm";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Post" };

export default async function CreatePage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; q?: string }>;
}) {
  await requireUser();
  const params = await searchParams;
  return <CreateForm initialKind={params.kind ?? ""} initialQuery={params.q ?? ""} />;
}
