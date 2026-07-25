import type { Folder } from "@/lib/services/folder";
import type { Document } from "@/lib/services/document";
import { FolderCard } from "@/components/ui/folder-card";
import { DocumentCard } from "@/components/ui/document-card";

interface DocumentListProps {
  folders: Folder[];
  documents: Document[];
  isLoading?: boolean;
  error?: string;
  selectedLandId?: string;
  onEnterFolder: (id: number, name: string) => void;
}

export default function DocumentList({
  folders,
  documents,
  isLoading = false,
  error = "",
  selectedLandId,
  onEnterFolder,
}: DocumentListProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground shadow-sm animate-pulse">
        Memuat data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive animate-in fade-in duration-300">
        {error}
      </div>
    );
  }

  if (folders.length === 0 && documents.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-10 text-center text-muted-foreground shadow-sm animate-in fade-in duration-300">
        Data tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {folders.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Folder ({folders.length})
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
            {folders.map((folder, index) => (
              <div
                key={folder.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-backwards"
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
              >
                <FolderCard
                  id={folder.id}
                  name={folder.name}
                  itemCount={folder.item_count}
                  onEnter={onEnterFolder}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Dokumen ({documents.length})
          </h2>
          <div className="space-y-3">
            {documents.map((document, index) => (
              <div
                key={document.id}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-backwards"
                style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
              >
                <DocumentCard
                  id={document.id}
                  landId={document.landId ?? selectedLandId}
                  title={document.title}
                  description={document.description}
                  category={document.category}
                  type={document.type}
                  file={document.file}
                  targetTime={document.targetTime}
                  showOperatorActions
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
