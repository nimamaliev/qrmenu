import type { Metadata } from "next";
import ConceptStory from "@/components/lab/ConceptStory";
import { CONCEPT_1 } from "@/components/lab/concepts";

// Unlinked preview of a new homepage concept; nothing here is final.
export const metadata: Metadata = { title: "Concept 1 · Vectr + LightGearLab", robots: { index: false, follow: false } };

export default function Concept1() {
  return (
    <>
      <ConceptStory config={CONCEPT_1} />
      <section className="mx-auto max-w-3xl px-6 py-32 text-center">
        <p className="text-sm text-muted">Concept 1 · Vectr + LightGearLab · preview. The rest of the page (dashboard, plans, FAQ, contact) stays as it is today.</p>
      </section>
    </>
  );
}
