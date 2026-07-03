import OperatorPageClient from "@/app/operator/operator-page-client";
import {
  getInitialDocuments,
  getInitialFolders,
  getInitialLands,
} from "@/lib/services/workspace-server";

export default async function OperatorPage() {
  const initialLands = await getInitialLands();
  const firstLand = initialLands[0] ?? null;
  const [initialFolders, initialDocuments] = firstLand
    ? await Promise.all([
        getInitialFolders(firstLand.id),
        getInitialDocuments(firstLand.id),
      ])
    : [[], []];

  return (
    <OperatorPageClient
      initialLands={initialLands}
      initialFolders={initialFolders}
      initialDocuments={initialDocuments}
    />
  );
}
