import { DocEditorClient } from "@/components/editor/DocEditorClient";

export default async function DocEditorPage({
  params
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = await params;
  return <DocEditorClient docId={docId} />;
}