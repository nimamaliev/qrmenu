import type { Dictionary } from "@/i18n/dictionaries";
import "@/components/iso/iso.css";
import "./how.css";
import { LIVE, figureSvg } from "./art.mjs";
import HowItWorksLive from "./HowItWorksLive";

const SWATCH = {
  lit: (
    <svg className="iso-swatch" data-mark="lit" viewBox="0 0 16 10" aria-hidden="true">
      <path d="M2 4.5 8 1.5 14 4.5 14 6 8 9 2 6Z" />
      <path className="iso-swatch-crease" d="M2 4.5 8 7.5 14 4.5" />
    </svg>
  ),
  raised: (
    <svg className="iso-swatch" data-mark="raised" viewBox="0 0 16 10" aria-hidden="true">
      <path d="M2 4.5 8 1.5 14 4.5 14 6 8 9 2 6Z" />
      <path className="iso-swatch-crease" d="M2 4.5 8 7.5 14 4.5" />
    </svg>
  ),
};

/** The Anatomy figure (static SVG built on the server) plus the four steps; HowItWorksLive animates both. */
export default function HowItWorksFigure({ how }: { how: Dictionary["how"] }) {
  const f = how.figure;
  return (
    <div id="hw-figure" className="hw iso mt-14" data-theme="light">
      <figure className="iso-figure mx-auto max-w-5xl">
        <div className="iso-plate">
          <div className="iso-plate-corners" aria-hidden="true">
            <span className="iso-plate-corner" data-corner="fig">{f.fig}</span>
            <span className="iso-plate-corner" data-corner="title">{f.title}</span>
            <span className="iso-plate-corner" data-corner="hint">{f.hint}</span>
            <span className="iso-plate-corner" data-corner="readout" data-readout="">
              1 · {f.readout.photos} 0/{LIVE.PHOTOS}
            </span>
          </div>
          <div
            className="iso-stage"
            tabIndex={0}
            role="slider"
            aria-label={f.slider}
            aria-valuemin={1}
            aria-valuemax={4}
            aria-valuenow={1}
            aria-valuetext={`1/4: ${how.steps[0].title}`}
            dangerouslySetInnerHTML={{ __html: figureSvg(f.label) }}
          />
        </div>
        <figcaption className="iso-legend">
          <span className="iso-keys">
            <span className="iso-key">{SWATCH.lit}{f.keys[0]}</span>
            <span className="iso-key">{SWATCH.raised}{f.keys[1]}</span>
          </span>
        </figcaption>
      </figure>
      <ol className="mt-10 grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
        {how.steps.map((step, i) => (
          <li key={step.title} data-step={i} className="border-t-2 border-line pt-4 transition-colors duration-500 data-on:border-accent">
            <span className="headline text-4xl text-text/25">{String(i + 1).padStart(2, "0")}</span>
            <h3 className="mt-2 text-xl font-medium tracking-[-0.01em]">{step.title}</h3>
            <p className="mt-1.5 text-muted">{step.text}</p>
          </li>
        ))}
      </ol>
      <HowItWorksLive live={LIVE} readout={f.readout} titles={how.steps.map((s) => s.title)} />
    </div>
  );
}
