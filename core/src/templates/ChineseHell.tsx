// 25 s horizontal mythology explainer, second-person "you just died" walkthrough of Chinese hell.
// Dark ink-wash look: black-red ground, drifting fog, embers, grain, gold serif captions, brush-script Chinese accents.
// Every picture is procedural vector art (no third-party images).
import React from "react";
import { AbsoluteFill, Easing, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadSerif } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";
import { loadFont as loadBrush } from "@remotion/google-fonts/MaShanZheng";
import { Sfx } from "../Sfx";
import words from "../../public/hell/words.json";
import lines from "../../public/hell/lines.json";

const { fontFamily: SERIF } = loadSerif("normal", { weights: ["600", "700"], subsets: ["latin"] });
const { fontFamily: CINZEL } = loadCinzel("normal", { weights: ["700"], subsets: ["latin"] });
const { fontFamily: BRUSH } = loadBrush();

export const HELL_SEC = 25;
const FPS = 30;
const C = { ink: "#07060a", blood: "#5a0b0f", red: "#b3121b", ember: "#ff6a2a", gold: "#d4b061", paper: "#ece2c9", jade: "#2e6b5e", white: "#f4f1ea" };
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const E = Easing.bezier(0.16, 1, 0.3, 1);
const p = (t: number, a: number, b: number, e: (x: number) => number = E) => interpolate(t, [a, b], [0, 1], { ...CL, easing: e });

type Wd = { w: string; start: number; end: number; line: number };
type Ln = { i: number; start: number; end: number; text: string };
const W = words as Wd[];
const L = lines as Ln[];
const at = (i: number) => L[i].start;

// scenes: [start, end] with 0.5 s cross-fades
const SC = { door: [0, 4.4], pair: [4.4, 7.1], fire: [7.1, 8.8], office: [8.8, 12.8], mirror: [12.8, 15.75], bridge: [15.75, 18.05], soup: [18.05, 22.4], end: [22.4, 25] } as const;

const Scene: React.FC<{ t: number; r: readonly [number, number]; children: (k: number, u: number) => React.ReactNode; push?: number }> = ({ t, r, children, push = 0.06 }) => {
  const [a, b] = r;
  if (t < a - 0.5 || t > b + 0.5) return null;
  const k = Math.min(p(t, a - 0.25, a + 0.35), 1 - p(t, b - 0.2, b + 0.4));
  const u = (t - a) / (b - a);
  return (
    <AbsoluteFill style={{ opacity: k, transform: `scale(${1 + push * u})` }}>
      {children(k, u)}
    </AbsoluteFill>
  );
};

const Fog: React.FC<{ t: number; color?: string; y?: number; o?: number }> = ({ t, color = "rgba(200,190,175,0.10)", y = 760, o = 1 }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", opacity: o }}>
    <defs><filter id={`fb${y}`}><feGaussianBlur stdDeviation={40} /></filter></defs>
    <g filter={`url(#fb${y})`}>
      {Array.from({ length: 7 }).map((_, i) => {
        const x = ((i * 380 + t * (22 + i * 6)) % 2600) - 340;
        return <ellipse key={i} cx={x} cy={y + Math.sin(t * 0.4 + i) * 30 + (i % 3) * 60} rx={360} ry={70 + (i % 2) * 30} fill={color} />;
      })}
    </g>
  </svg>
);

const Embers: React.FC<{ t: number; n?: number; color?: string }> = ({ t, n = 40, color = C.ember }) => (
  <svg width={1920} height={1080} style={{ position: "absolute" }}>
    {Array.from({ length: n }).map((_, i) => {
      const sp = 40 + random("es" + i) * 90, x0 = random("ex" + i) * 1920, ph = random("ep" + i) * 1200;
      const y = 1100 - ((t * sp + ph) % 1250);
      const x = x0 + Math.sin(t * 0.8 + i) * 30;
      const r = 1.5 + random("er" + i) * 3;
      return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={0.35 + 0.5 * Math.abs(Math.sin(t * 3 + i))} />;
    })}
  </svg>
);

// tall-hatted escort silhouette (generic folk-figure shape, not a copy of any artwork)
const Escort: React.FC<{ x: number; y: number; s: number; white?: boolean; t: number }> = ({ x, y, s, white, t }) => {
  const body = white ? "#e9e4da" : "#121014";
  const edge = white ? "#bdb5a6" : "#3a3238";
  const sway = Math.sin(t * 1.2 + (white ? 0 : 2)) * 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${sway})`}>
      <path d="M-70 0 L-95 -330 Q0 -370 95 -330 L70 0 Z" fill={body} stroke={edge} strokeWidth={4} />
      <path d="M-95 -330 Q-120 -200 -130 -60 L-100 -60 L-80 -300 Z M95 -330 Q120 -200 130 -60 L100 -60 L80 -300 Z" fill={body} stroke={edge} strokeWidth={3} />
      <circle cx={0} cy={-385} r={48} fill={body} stroke={edge} strokeWidth={4} />
      <path d="M-42 -420 L-30 -560 L30 -560 L42 -420 Z" fill={body} stroke={edge} strokeWidth={4} />
      <rect x={-14} y={-540} width={28} height={100} fill={white ? C.red : C.gold} opacity={0.85} />
      <circle cx={-16} cy={-392} r={5} fill={white ? "#222" : C.red} />
      <circle cx={16} cy={-392} r={5} fill={white ? "#222" : C.red} />
      {white && <path d="M-8 -365 Q0 -330 8 -365 L6 -250 Q0 -235 -6 -250 Z" fill={C.red} opacity={0.9} />}
    </g>
  );
};

const Chain: React.FC<{ x1: number; y1: number; x2: number; y2: number; t: number }> = ({ x1, y1, x2, y2, t }) => {
  const n = 18;
  return (
    <g>
      {Array.from({ length: n }).map((_, i) => {
        const u = i / (n - 1);
        const x = x1 + (x2 - x1) * u, y = y1 + (y2 - y1) * u + Math.sin(u * Math.PI) * (80 + Math.sin(t * 2) * 12);
        return <ellipse key={i} cx={x} cy={y} rx={i % 2 ? 9 : 14} ry={i % 2 ? 14 : 9} fill="none" stroke="#8d8a90" strokeWidth={5} />;
      })}
    </g>
  );
};

const Grain: React.FC<{ f: number }> = ({ f }) => (
  <svg width={1920} height={1080} style={{ position: "absolute", mixBlendMode: "overlay", opacity: 0.22, pointerEvents: "none" }}>
    <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={f % 8} /></filter>
    <rect width={1920} height={1080} filter="url(#gr)" />
  </svg>
);

const Brush: React.FC<{ text: string; t: number; from: number; x: number; y: number; size?: number; color?: string; vertical?: boolean }> = ({ text, t, from, x, y, size = 120, color = C.red, vertical = true }) => {
  const k = p(t, from, from + 0.8);
  return (
    <div style={{ position: "absolute", left: x, top: y, fontFamily: BRUSH, fontSize: size, color, writingMode: vertical ? "vertical-rl" : undefined,
      opacity: k * 0.9, filter: `blur(${(1 - k) * 8}px)`, transform: `translateY(${(1 - k) * 20}px)`, textShadow: "0 0 30px rgba(179,18,27,0.45)", letterSpacing: 6 }}>{text}</div>
  );
};

const Title: React.FC<{ text: string; t: number; from: number; to: number; x?: number; y?: number; size?: number; color?: string }> = ({ text, t, from, to, x = 960, y = 480, size = 110, color = C.paper }) => {
  const k = p(t, from, from + 0.5) * (1 - p(t, to - 0.3, to));
  if (k <= 0) return null;
  return (
    <div style={{ position: "absolute", left: x - 900, width: 1800, top: y, textAlign: "center", fontFamily: CINZEL, fontWeight: 700, fontSize: size, color,
      letterSpacing: 10 + (1 - k) * 30, opacity: k, textShadow: "0 0 40px rgba(0,0,0,0.9)" }}>{text}</div>
  );
};

const Captions: React.FC<{ t: number }> = ({ t }) => {
  const ln = L.find((l, i) => t >= l.start - 0.05 && t < (L[i + 1] ? Math.min(L[i + 1].start - 0.05, l.end + 0.6) : l.end + 0.8));
  if (!ln) return null;
  const wsAsr = W.filter((w) => w.line === ln.i);
  const toks = ln.text.split(" ");
  const ws = toks.map((w, i) => ({ w, start: toks.length === wsAsr.length ? wsAsr[i].start : ln.start + (i / toks.length) * (ln.end - ln.start) }));
  const k = p(t, ln.start - 0.05, ln.start + 0.2);
  return (
    <div style={{ position: "absolute", left: 160, right: 160, bottom: 70, textAlign: "center", fontFamily: SERIF, fontWeight: 700, fontSize: 56, opacity: k,
      textShadow: "0 3px 12px rgba(0,0,0,0.95), 0 0 2px #000" }}>
      {ws.map((w, i) => {
        const said = t >= w.start;
        return <span key={i} style={{ color: said ? C.paper : "rgba(236,226,201,0.45)", transition: "none" }}>{w.w}{i < ws.length - 1 ? " " : ""}</span>;
      })}
    </div>
  );
};

export const ChineseHell: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const music = (fr: number) => interpolate(fr, [0, 30, 690, 750], [0, 0.22, 0.22, 0], CL);
  return (
    <AbsoluteFill style={{ background: C.ink, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 60%, ${C.blood} 0%, #1a0507 45%, ${C.ink} 80%)`, opacity: 0.85 }} />

      {/* 1. you died: a dark room, a doorway opens, two figures in the light */}
      <Scene t={t} r={SC.door} push={0.1}>{() => {
        const open = p(t, at(1) - 0.2, at(1) + 1.2);
        return (
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <defs><radialGradient id="dl" cx="50%" cy="60%" r="60%"><stop offset="0%" stopColor="#d9d2c0" /><stop offset="100%" stopColor="#6d6458" /></radialGradient></defs>
            <rect x={760} y={220} width={400} height={640} fill="#0c0a0c" stroke="#2b1e1c" strokeWidth={14} />
            <rect x={760} y={220} width={400 * open} height={640} fill="url(#dl)" opacity={0.85} />
            <polygon points={`760,860 ${760 + 400 * open},860 ${960 + 700 * open},1080 ${560 - 300 * open},1080`} fill="#d9d2c0" opacity={0.12 * open} />
            <g opacity={p(t, at(1) + 0.6, at(1) + 1.6)}>
              <g transform="translate(0 0)"><Escort x={880} y={860} s={0.95} white t={t} /></g>
              <Escort x={1050} y={860} s={0.95} t={t} />
            </g>
            {/* candle */}
            <rect x={300} y={760} width={36} height={110} fill="#d8cdb4" />
            <ellipse cx={318} cy={742 + Math.sin(t * 9) * 2} rx={12} ry={26} fill={C.ember} opacity={0.9 - open * 0.4} />
            <circle cx={318} cy={742} r={120} fill={C.ember} opacity={0.08 * (1 - open)} />
          </svg>
        );
      }}</Scene>

      {/* 2. one in white, one in black, holding a chain */}
      <Scene t={t} r={SC.pair} push={0.07}>{() => (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <g opacity={p(t, at(2) - 0.1, at(2) + 0.5)}><Escort x={640} y={1080} s={1.55} white t={t} /></g>
            <g opacity={p(t, at(2) + 1.0, at(2) + 1.5)}><Escort x={1280} y={1080} s={1.55} t={t} /></g>
            <g opacity={p(t, at(2) + 1.8, at(2) + 2.3)}><Chain x1={760} y1={700} x2={1160} y2={700} t={t} /></g>
          </svg>
          <Brush text="白无常" t={t} from={at(2)} x={200} y={160} size={110} color={C.paper} />
          <Brush text="黑无常" t={t} from={at(2) + 1.0} x={1620} y={160} size={110} />
        </>
      )}</Scene>

      {/* 3. forget the lake of fire */}
      <Scene t={t} r={SC.fire} push={0.04}>{() => {
        const out = p(t, at(3) + 0.9, at(3) + 1.5);
        return (
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            {Array.from({ length: 26 }).map((_, i) => {
              const x = i * 78 - 20, h = 180 + random("fh" + i) * 260 + Math.sin(t * 7 + i) * 40;
              return <path key={i} d={`M${x} 1080 Q${x + 40} ${1080 - h * 0.6} ${x + 30 + Math.sin(t * 5 + i) * 18} ${1080 - h} Q${x + 70} ${1080 - h * 0.5} ${x + 80} 1080 Z`}
                fill={i % 2 ? C.ember : C.red} opacity={(0.75 - out * 0.7)} transform={`translate(0 ${out * 300})`} />;
            })}
            <line x1={560} y1={520} x2={1360} y2={520} stroke={C.paper} strokeWidth={10} strokeDasharray={800} strokeDashoffset={800 * (1 - p(t, at(3) + 0.3, at(3) + 0.8))} />
          </svg>
        );
      }}</Scene>
      <Title text="LAKE OF FIRE" t={t} from={SC.fire[0] + 0.1} to={SC.fire[1]} y={455} size={96} />

      {/* 4. a government office: ten courts, eighteen floors */}
      <Scene t={t} r={SC.office} push={0.05}>{() => {
        const dive = p(t, at(5), at(5) + 1.6, Easing.inOut(Easing.cubic));
        return (
          <>
            <svg width={1920} height={1080} style={{ position: "absolute" }}>
              {/* courtroom: desk, stacked files, stamp */}
              <g transform={`translate(0 ${-dive * 1100})`}>
                <rect x={560} y={600} width={800} height={190} fill="#2a1612" stroke={C.gold} strokeWidth={4} />
                {Array.from({ length: 9 }).map((_, i) => <rect key={i} x={620 + (i % 3) * 30} y={560 - Math.floor(i / 3) * 34 - (i % 3) * 4} width={170} height={30} fill={C.paper} opacity={0.85} stroke="#8a7a5a" />)}
                {Array.from({ length: 7 }).map((_, i) => <rect key={"r" + i} x={1110 - (i % 2) * 20} y={560 - i * 34} width={170} height={30} fill={C.paper} opacity={0.75} stroke="#8a7a5a" />)}
                {(() => { const s = p(t, at(4) + 0.6, at(4) + 0.85, Easing.in(Easing.quad)); return (
                  <g transform={`translate(960 ${380 + s * 170})`}><rect x={-50} y={-120} width={100} height={110} fill="#3a221a" stroke={C.gold} strokeWidth={4} /><rect x={-75} y={-10} width={150} height={30} fill={C.red} /></g>); })()}
                <g opacity={p(t, at(4) + 0.85, at(4) + 1.0)}><rect x={880} y={480} width={160} height={110} fill="none" stroke={C.red} strokeWidth={8} /><text x={960} y={560} textAnchor="middle" fontFamily={BRUSH} fontSize={70} fill={C.red}>地府</text></g>
              </g>
              {/* the floors, seen while descending */}
              <g transform={`translate(0 ${1100 - dive * 1100})`}>
                {Array.from({ length: 18 }).map((_, i) => {
                  const y = 80 + i * 52;
                  const glow = 0.25 + 0.6 * (i / 17);
                  return <g key={i} opacity={p(t, at(5) + 0.6 + i * 0.05, at(5) + 0.9 + i * 0.05)}>
                    <rect x={700 - i * 4} y={y} width={520 + i * 8} height={38} fill={`rgba(179,18,27,${glow * 0.5})`} stroke={C.gold} strokeWidth={2} opacity={0.9} />
                    <text x={680 - i * 4} y={y + 30} textAnchor="end" fontFamily={CINZEL} fontSize={26} fill={C.gold}>{i + 1}</text>
                  </g>;
                })}
              </g>
            </svg>
            <Title text="10 COURTS" t={t} from={at(5) - 0.05} to={SC.office[1] + 0.3} x={330} y={440} size={70} color={C.gold} />
            <Title text="18 FLOORS" t={t} from={at(5) + 0.8} to={SC.office[1] + 0.3} x={1600} y={440} size={70} color={C.gold} />
          </>
        );
      }}</Scene>

      {/* 5. the mirror that replays every lie */}
      <Scene t={t} r={SC.mirror} push={0.12}>{() => (
        <>
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <defs>
              <radialGradient id="mg" cx="45%" cy="40%" r="65%"><stop offset="0%" stopColor="#c9d8cf" /><stop offset="55%" stopColor="#4b6b62" /><stop offset="100%" stopColor="#14201d" /></radialGradient>
              <clipPath id="mc"><circle cx={960} cy={500} r={300} /></clipPath>
            </defs>
            <circle cx={960} cy={500} r={360} fill="none" stroke={C.gold} strokeWidth={40} opacity={0.9} />
            {Array.from({ length: 24 }).map((_, i) => { const a = (i / 24) * Math.PI * 2; return <circle key={i} cx={960 + Math.cos(a) * 360} cy={500 + Math.sin(a) * 360} r={10} fill="#8a6a2a" />; })}
            <circle cx={960} cy={500} r={320} fill="url(#mg)" />
            <g clipPath="url(#mc)">
              {/* flickering memories: silhouettes talking, a speech mark repeating */}
              {[0, 1, 2].map((k) => {
                const on = Math.floor(t * 2.2) % 3 === k;
                return <g key={k} opacity={on ? 0.85 : 0} transform={`translate(${880 + k * 50} ${560})`}>
                  <circle cx={-70} cy={-120} r={38} fill="#0d1412" /><rect x={-110} y={-80} width={80} height={180} rx={30} fill="#0d1412" />
                  <circle cx={90} cy={-120} r={38} fill="#0d1412" /><rect x={50} y={-80} width={80} height={180} rx={30} fill="#0d1412" />
                  <path d="M-20 -200 h90 a20 20 0 0 1 20 20 v40 a20 20 0 0 1 -20 20 h-50 l-20 22 v-22 h-20 a20 20 0 0 1 -20 -20 v-40 a20 20 0 0 1 20 -20z" fill={C.red} />
                  <text x={25} y={-148} textAnchor="middle" fontFamily={CINZEL} fontSize={34} fill={C.paper}>LIE</text>
                </g>;
              })}
              <rect x={600} y={180 + ((t * 260) % 700)} width={720} height={14} fill="rgba(255,255,255,0.18)" />
            </g>
          </svg>
          <Brush text="孽镜台" t={t} from={at(6) + 0.2} x={1500} y={220} size={100} color={C.gold} />
        </>
      )}</Scene>

      {/* 6. the last bridge over the red river */}
      <Scene t={t} r={SC.bridge} push={0.07}>{() => {
        const walk = p(t, at(7), SC.bridge[1] + 0.4, Easing.linear);
        return (
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <rect x={0} y={720} width={1920} height={360} fill="#3d0709" />
            {Array.from({ length: 12 }).map((_, i) => <path key={i} d={`M${-200 + ((i * 220 + t * 60) % 2300)} ${760 + (i % 4) * 70} q60 -14 120 0`} stroke={C.red} strokeWidth={4} fill="none" opacity={0.6} />)}
            <path d="M120 760 Q960 300 1800 760 L1800 800 Q960 360 120 800 Z" fill="#2a2326" stroke="#5b4f50" strokeWidth={4} />
            {Array.from({ length: 15 }).map((_, i) => { const x = 220 + i * 105; const y = 760 - Math.sin(((x - 120) / 1680) * Math.PI) * 230; return <rect key={i} x={x} y={y - 54} width={12} height={54} fill="#5b4f50" />; })}
            {[380, 1540].map((x, i) => <g key={i}><line x1={x} y1={420} x2={x} y2={760} stroke="#2a2326" strokeWidth={10} /><ellipse cx={x} cy={420} rx={34} ry={46} fill={C.red} /><ellipse cx={x} cy={420} rx={60} ry={70} fill={C.ember} opacity={0.15 + Math.sin(t * 4 + i) * 0.05} /></g>)}
            {(() => { const x = 140 + walk * 1640; const y = 760 - Math.sin(((x - 120) / 1680) * Math.PI) * 230; return <g transform={`translate(${x} ${y - 4})`}><circle cx={0} cy={-120} r={16} fill="#0a0809" /><path d="M-18 -104 L18 -104 L22 0 L-22 0 Z" fill="#0a0809" /></g>; })()}
            {/* red spider lilies along the bank */}
            {Array.from({ length: 22 }).map((_, i) => {
              const x = 30 + i * 90 + random("lx" + i) * 40, y = 1000 + random("ly" + i) * 60;
              return <g key={i} transform={`translate(${x} ${y}) rotate(${Math.sin(t + i) * 4})`}>
                <line x1={0} y1={0} x2={0} y2={90} stroke="#2f4a2a" strokeWidth={4} />
                {Array.from({ length: 7 }).map((_, j) => { const a = -Math.PI / 2 + (j - 3) * 0.42; return <path key={j} d={`M0 0 Q${Math.cos(a) * 30} ${Math.sin(a) * 30 - 10} ${Math.cos(a) * 50} ${Math.sin(a) * 50}`} stroke={C.red} strokeWidth={4} fill="none" />; })}
              </g>;
            })}
          </svg>
        );
      }}</Scene>

      {/* 7. an old woman, a bowl of soup, and forgetting */}
      <Scene t={t} r={SC.soup} push={0.1}>{() => {
        const forget = p(t, at(9) + 0.6, SC.soup[1] + 0.3);
        return (
          <>
            <svg width={1920} height={1080} style={{ position: "absolute" }}>
              <g transform="translate(700 1080)">
                <path d="M-150 0 Q-170 -300 -60 -430 Q0 -470 60 -430 Q140 -330 150 0 Z" fill="#141114" stroke="#3d3336" strokeWidth={4} />
                <circle cx={0} cy={-480} r={64} fill="#141114" stroke="#3d3336" strokeWidth={4} />
                <path d="M-70 -520 Q0 -600 70 -520" stroke="#9a9290" strokeWidth={14} fill="none" />
                <path d="M60 -330 Q200 -320 300 -300" stroke="#141114" strokeWidth={34} strokeLinecap="round" />
              </g>
              <g transform="translate(1110 760)">
                <ellipse cx={0} cy={0} rx={190} ry={40} fill="#b9a98a" />
                <path d="M-190 0 Q-170 170 0 170 Q170 170 190 0 Z" fill="#e8dfcc" stroke="#8a7a5a" strokeWidth={4} />
                <path d="M-150 60 Q0 80 150 60" stroke={C.red} strokeWidth={8} fill="none" />
                <ellipse cx={0} cy={0} rx={165} ry={30} fill="#6b5a3a" />
                {[0, 1, 2, 3].map((i) => <path key={i} d={`M${-90 + i * 60} -20 q${-30} -60 0 -120 q30 -60 0 -120`} stroke="rgba(236,226,201,0.45)" strokeWidth={10} fill="none" strokeLinecap="round"
                  transform={`translate(${Math.sin(t * 1.5 + i) * 10} ${-((t * 40 + i * 30) % 60)})`} opacity={0.6} />)}
              </g>
            </svg>
            <Brush text="孟婆汤" t={t} from={at(8) + 0.3} x={1560} y={180} size={110} color={C.paper} />
            <AbsoluteFill style={{ background: "#e8e2d6", opacity: forget * 0.95 }} />
          </>
        );
      }}</Scene>

      {/* 8. the question */}
      <Scene t={t} r={SC.end} push={0.05}>{() => (
        <>
          <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 55%, #2a0a0c 0%, ${C.ink} 70%)` }} />
          <svg width={1920} height={1080} style={{ position: "absolute" }}>
            <g transform="translate(960 640)">
              <ellipse cx={0} cy={0} rx={150} ry={32} fill="#b9a98a" />
              <path d="M-150 0 Q-135 135 0 135 Q135 135 150 0 Z" fill="#e8dfcc" />
              <ellipse cx={0} cy={0} rx={130} ry={24} fill="#6b5a3a" />
              {[0, 1, 2].map((i) => <path key={i} d={`M${-50 + i * 50} -20 q-25 -50 0 -100 q25 -50 0 -100`} stroke="rgba(236,226,201,0.4)" strokeWidth={9} fill="none" strokeLinecap="round" transform={`translate(${Math.sin(t * 1.4 + i) * 8} 0)`} />)}
            </g>
          </svg>
          <Title text="DO YOU DRINK?" t={t} from={at(10) + 0.5} to={HELL_SEC + 1} y={230} size={104} color={C.paper} />
        </>
      )}</Scene>

      <Fog t={t} />
      <Embers t={t} n={t > SC.soup[0] && t < SC.end[0] ? 15 : 40} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,0.85) 100%)" }} />
      <Grain f={f} />
      <AbsoluteFill style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 14%, transparent 26%)" }} />
      <Captions t={t} />
      <AbsoluteFill style={{ background: "#000", opacity: 1 - p(t, 0, 0.12) + p(t, 24.75, 25) }} />

      {/* sound */}
      <Audio src={staticFile("audio-lib/music/synth_music/synth-music-tension-drone.mp3")} volume={music} />
      <Audio src={staticFile("hell/vo.wav")} />
      <Sfx category="swell" at={Math.round((at(1) + 0.4) * FPS)} volume={0.35} />
      <Sfx id="synth-whoosh-06" at={Math.round((SC.pair[0] - 0.2) * FPS)} volume={0.3} />
      <Sfx category="impact" variant={2} at={Math.round((at(4) + 0.85) * FPS)} volume={0.5} />
      <Sfx category="riser" at={Math.round((at(5) - 0.2) * FPS)} volume={0.3} />
      <Sfx category="magic" at={Math.round((at(6)) * FPS)} volume={0.3} />
      <Sfx id="synth-whoosh-08" at={Math.round((SC.bridge[0] - 0.2) * FPS)} volume={0.3} />
      <Sfx category="swell" variant={1} at={Math.round((at(9) + 0.4) * FPS)} volume={0.35} />
      <Sfx category="impact" variant={4} at={Math.round((at(10) + 0.45) * FPS)} volume={0.4} />
    </AbsoluteFill>
  );
};
