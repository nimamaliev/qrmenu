import type { CSSProperties, ElementType } from "react";

/** A headline whose words come into focus one after another as it scrolls into view (CSS only, see `.focus-in`). */
export default function FocusHeadline({ as: Tag = "h2", text, className = "" }: { as?: ElementType; text: string; className?: string }) {
  const words = text.split(/\s+/).filter(Boolean);
  return (
    <Tag className={`headline focus-in ${className}`}>
      {words.map((word, i) => (
        <span key={i} className="w" style={{ "--i": i, "--n": words.length } as CSSProperties}>
          {word}
          {i < words.length - 1 ? " " : ""}
        </span>
      ))}
    </Tag>
  );
}
