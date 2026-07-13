import type { Folder } from "@/lib/services/folder";
import type { Document } from "@/lib/services/document";
import { FolderCard } from "@/components/ui/folder-card";
import { DocumentCard } from "@/components/ui/document-card";

interface DocumentListProps {
  folders: Folder[];
  documents: Document[];
  isLoading?: boolean;
  error?: string;
  onEnterFolder: (id: number, name: string) => void;
}

export default function DocumentList({
  folders,
  documents,
  isLoading = false,
  error = "",
  onEnterFolder,
}: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
        Memuat data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (folders.length === 0 && documents.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
        Data tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {folders.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Folder ({folders.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {folders.map((folder) => (
              <FolderCard
                key={folder.id}
                id={folder.id}
                name={folder.name}
                itemCount={folder.item_count}
                onEnter={onEnterFolder}
              />
            ))}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Dokumen ({documents.length})
          </h2>
          <div className="space-y-3">
            {documents.map((document) => (
                <DocumentCard
                  key={document.id}
                  id={document.id}
                  landId={document.landId}
                  title={document.title}
                  description={document.description}
                category={document.category}
                type={document.type}
                file={document.file}
                targetTime={document.targetTime}
                showOperatorActions
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
