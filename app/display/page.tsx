import DisplayPageClient from "@/app/display/display-page-client";
import { Suspense } from "react";

export default function DisplayPage() {
  return (
    <Suspense fallback={null}>
      <DisplayPageClient />
    </Suspense>
  );
}
