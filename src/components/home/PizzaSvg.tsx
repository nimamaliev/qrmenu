import { useId } from "react";

/** Top-down Margherita, drawn in SVG. Used in phone mockups and as the no-WebGL fallback. */
const CHEESE = [
  [38, 40, 11], [62, 36, 10], [70, 58, 12], [48, 63, 11], [30, 60, 9], [56, 50, 8], [42, 52, 7],
] as const;
const TOMATOES = [
  [50, 30], [33, 48], [66, 46], [58, 68], [38, 70],
] as const;
const BASIL = [
  [44, 44, 30], [60, 60, -40], [53, 38, 110], [36, 58, 200],
] as const;

export default function PizzaSvg({ className }: { className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}crust`} cx="50%" cy="45%" r="55%">
          <stop offset="78%" stopColor="#e0a95e" />
          <stop offset="92%" stopColor="#c27f38" />
          <stop offset="100%" stopColor="#8f5524" />
        </radialGradient>
        <radialGradient id={`${id}sauce`} cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#d23a22" />
          <stop offset="100%" stopColor="#9c2213" />
        </radialGradient>
        <radialGradient id={`${id}cheese`} cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#fffaf0" />
          <stop offset="100%" stopColor="#f0d69a" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${id}crust)`} />
      {[[22, 30], [76, 26], [80, 70], [26, 78], [50, 90], [12, 52]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.6" fill="#5a3415" opacity="0.6" />
      ))}
      <circle cx="50" cy="50" r="39" fill={`url(#${id}sauce)`} />
      {CHEESE.map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 0.85} fill={`url(#${id}cheese)`} />
      ))}
      {TOMATOES.map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="4.6" fill="#c92a17" />
          <circle cx={x} cy={y} r="3.4" fill="#ef6a49" />
          <circle cx={x - 1} cy={y - 0.6} r="0.7" fill="#f6dd8a" />
          <circle cx={x + 1.1} cy={y + 0.4} r="0.7" fill="#f6dd8a" />
        </g>
      ))}
      {BASIL.map(([x, y, rot], i) => (
        <path
          key={i}
          d="M0 -6 C 4 -3, 4 3, 0 6 C -4 3, -4 -3, 0 -6 Z"
          transform={`translate(${x} ${y}) rotate(${rot})`}
          fill="#2f6d26"
          stroke="#1f4d19"
          strokeWidth="0.4"
        />
      ))}
    </svg>
  );
}
