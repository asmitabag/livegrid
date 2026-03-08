import type { Document as LiveGridDocument } from "@/models";
import { DocumentCard } from "@/components/dashboard/DocumentCard";

export function DocumentsList({ docs }: { docs: LiveGridDocument[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {docs.map((d) => (
        <DocumentCard key={d.id} doc={d} />
      ))}
    </div>
  );
}