import { CreateDocumentButton } from "@/components/dashboard/CreateDocumentButton";
import { DocumentsDashboard } from "@/components/dashboard/DocumentsDashboard";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
            Documents
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Create and open collaborative spreadsheets.
          </p>
        </div>
        <CreateDocumentButton />
      </div>

      <div className="mt-6">
        <DocumentsDashboard />
      </div>
    </main>
  );
}