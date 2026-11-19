// 18 s horizontal stickman explainer: "3 steps to hit a baseball harder" (stance, eyes, hips).
// Navy ground + blurred licensed stadium photo, green field strip, blue stickman, white hand-written headings,
// orange icons, word-by-word captions, soft transitions, bat-crack SFX on contact.
import React from "react";
import { AbsoluteFill, Img, interpolate, Sequence, staticFile, useCurrentFrame, Easing } from "remotion";
import { Audio } from "@remotion/media";
import { loadFont as loadMarker } from "@remotion/google-fonts/PermanentMarker";
import { loadFont as loadNunito } from "@remotion/google-fonts/Nunito";
import { Sfx } from "../Sfx";
import words from "../../public/baseball/words.json";

const { fontFamily: MARKER } = loadMarker();
const { fontFamily: CAP } = loadNunito("normal", { weights: ["900"], subsets: ["latin"] });

export const BASEBALL_SEC = 18;
const FPS = 30;
const OFF = 0.5; // voice starts after 0.5 s
const C = { navy: "#0d1b3d", navy2: "#16295a", blue: "#3d8bff", orange: "#ff8a1f", grass: "#2f8f3a", grass2: "#37a043", white: "#ffffff", hi: "#ffd23f", bat: "#d9a066" };
const EASE = Easing.bezier(0.16, 1, 0.3, 1);
const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const p = (t: number, a: number, b: number, e = EASE) => interpolate(t, [a, b], [0, 1], { ...CL, easing: e });
const mix = (a: number, b: number, k: number) => a + (b - a) * k;

// scene boundaries (seconds) and the contact moment
const S = { stance: 3.45, eyes: 7.2, hips: 11.2, outro: 15.6, hit: 14.4 };
const GROUND = 905;

type W = { w: string; start: number; end: number };
const WORDS = (words as W[]).map((x) => ({ ...x, start: x.start + OFF, end: x.end + OFF }));
const CHUNKS: [number, number][] = [[0, 5], [6, 8], [9, 10], [11, 15], [16, 17], [18, 19], [20, 25], [26, 31], [32, 33], [34, 36], [37, 40]];

const Heading: React.FC<{ text: string; t: number; from: number; to: number }> = ({ text, t, from, to }) => {
  const write = p(t, from, from + 0.7, Easing.linear);
  const out = p(t, to - 0.35, to);
  if (t < from || t > to) return null;
  return (
    <div style={{ position: "absolute", left: 90, top: 60, fontFamily: MARKER, fontSize: 92, color: C.white, letterSpacing: 2,
      clipPath: `inset(-20px calc(${100 - write * 100}% - ${write * 60}px) -20px -20px)`, opacity: 1 - out, transform: `translateY(${-out * 20}px) rotate(-2deg)`,
      textShadow: "0 6px 0 rgba(0,0,0,0.25)" }}>
      {text}
      <svg width={text.length * 52} height={26} style={{ position: "absolute", left: 0, top: 112, overflow: "visible" }}>
        <path d={`M4 14 Q ${text.length * 26} ${2} ${text.length * 52 - 8} 12`} stroke={C.orange} strokeWidth={8} fill="none" strokeLinecap="round"
          strokeDasharray={text.length * 60} strokeDashoffset={text.length * 60 * (1 - p(t, from + 0.5, from + 1.0))} />
      </svg>
    </div>
  );
};

// orange icons, drawn as vectors
const IconStance: React.FC = () => (
  <g stroke={C.orange} strokeWidth={12} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx={-60} cy={10} rx={26} ry={44} fill={C.orange} stroke="none" />
    <ellipse cx={60} cy={10} rx={26} ry={44} fill={C.orange} stroke="none" />
    <path d="M-120 90 H120 M-120 90 l22 -18 M-120 90 l22 18 M120 90 l-22 -18 M120 90 l-22 18" />
  </g>
);
const IconEye: React.FC<{ t: number }> = ({ t }) => {
  const blink = Math.abs(Math.sin(t * 1.3)) > 0.97 ? 0.15 : 1;
  return (
    <g stroke={C.orange} strokeWidth={12} fill="none" strokeLinecap="round">
      <path d="M-120 0 Q0 -95 120 0 Q0 95 -120 0 Z" transform={`scale(1 ${blink})`} />
      <circle cx={0} cy={0} r={34} fill={C.orange} stroke="none" transform={`scale(1 ${blink})`} />
      <circle cx={12} cy={-10} r={10} fill={C.navy} stroke="none" transform={`scale(1 ${blink})`} />
    </g>
  );
};
const IconHips: React.FC<{ t: number }> = ({ t }) => {
  const r = (t * 120) % 360;
  return (
    <g stroke={C.orange} strokeWidth={12} fill="none" strokeLinecap="round">
      <g transform={`rotate(${r})`}>
        <path d="M0 -90 A90 90 0 1 1 -86 26" />
        <path d="M-86 26 l-6 -36 M-86 26 l34 -12" />
      </g>
      <circle cx={0} cy={0} r={22} fill={C.orange} stroke="none" />
    </g>
  );
};

const Ball: React.FC<{ x: number; y: number; r?: number; spin?: number }> = ({ x, y, r = 16, spin = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${spin})`}>
    <circle r={r} fill="#fff" stroke="#c9ced8" strokeWidth={2} />
    <path d={`M${-r * 0.55} ${-r * 0.8} Q${-r * 0.1} 0 ${-r * 0.55} ${r * 0.8} M${r * 0.55} ${-r * 0.8} Q${r * 0.1} 0 ${r * 0.55} ${r * 0.8}`} stroke="#e5383b" strokeWidth={2.5} fill="none" />
  </g>
);

// swing progress: 0 loaded, 1 contact, 1.6 follow-through
const swingAt = (t: number) => {
  if (t < S.hit - 0.42) return 0;
  if (t < S.hit) return interpolate(t, [S.hit - 0.42, S.hit], [0, 1], { ...CL, easing: Easing.bezier(0.5, 0, 0.9, 0.6) });
  return 1 + 0.6 * p(t, S.hit, S.hit + 0.5);
};

const Batter: React.FC<{ t: number }> = ({ t }) => {
  const cx = 760;
  const width = mix(0.5, 1.35, p(t, S.stance + 0.35, S.stance + 1.1));
  const crouch = p(t, S.stance + 0.9, S.stance + 1.6);
  const load = p(t, S.hips + 0.5, S.hips + 1.4) * (1 - p(t, S.hit - 0.42, S.hit)); // hips coil back
  const s = swingAt(t);
  const breathe = Math.sin(t * 2.4) * 3;
  const hipY = GROUND - 200 + crouch * 34 + breathe * 0.3;
  const hip = { x: cx - load * 14 + Math.min(s, 1) * 18, y: hipY };
  const lean = 18 - load * 10 + Math.min(s, 1) * 6;
  const sh = { x: hip.x + lean, y: hip.y - 170 + breathe };
  const head = { x: sh.x + 10, y: sh.y - 62 };
  const fL = { x: cx - 78 * width, y: GROUND }, fR = { x: cx + 78 * width, y: GROUND };
  const knee = (f: { x: number; y: number }, dir: number) => ({ x: (hip.x + f.x) / 2 + 22 * crouch + dir * 6, y: (hip.y + f.y) / 2 - 6 });
  const kL = knee(fL, -1), kR = knee(fR, 1);
  // hands orbit the shoulder, bat angle follows the swing
  const a = (s <= 1 ? mix(205 - load * 12, 375, s) : mix(375, 400, (s - 1) / 0.6)) * (Math.PI / 180);
  const hand = { x: sh.x + Math.cos(a) * 62, y: sh.y + 40 + Math.sin(a) * 50 };
  const bAng = (s <= 1 ? mix(-112 - load * 18, 0, s) : mix(0, -150, (s - 1) / 0.6)) * (Math.PI / 180);
  const tip = { x: hand.x + Math.cos(bAng) * 190, y: hand.y + Math.sin(bAng) * 190 };
  const elbow = (sx: number, off: number) => ({ x: (sx + hand.x) / 2 + off, y: (sh.y + 6 + hand.y) / 2 + 18 });
  const e1 = elbow(sh.x - 6, -14), e2 = elbow(sh.x + 6, 14);
  const ln = (pts: { x: number; y: number }[]) => "M" + pts.map((q) => `${q.x} ${q.y}`).join(" L");
  const eyesOn = t >= S.eyes;
  return (
    <g>
      <ellipse cx={cx} cy={GROUND + 8} rx={150} ry={14} fill="rgba(0,0,0,0.25)" />
      <g stroke={C.blue} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d={ln([hip, kL, fL])} />
        <path d={ln([hip, kR, fR])} />
        <path d={ln([hip, sh])} strokeWidth={20} />
        <path d={ln([sh, e1, hand])} />
      </g>
      {/* bat */}
      <path d={`M${hand.x} ${hand.y} L${tip.x} ${tip.y}`} stroke={C.bat} strokeWidth={14} strokeLinecap="round" />
      <path d={`M${mix(hand.x, tip.x, 0.45)} ${mix(hand.y, tip.y, 0.45)} L${tip.x} ${tip.y}`} stroke={C.bat} strokeWidth={22} strokeLinecap="round" />
      <path d={ln([sh, e2, hand])} stroke={C.blue} strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={head.x} cy={head.y} r={42} fill={C.navy} stroke={C.blue} strokeWidth={14} />
      {/* helmet brim + eye looking at the pitcher */}
      <path d={`M${head.x - 44} ${head.y - 8} A44 44 0 0 1 ${head.x + 44} ${head.y - 8} L${head.x + 66} ${head.y - 6}`} stroke={C.blue} strokeWidth={14} fill={C.blue} strokeLinejoin="round" />
      <circle cx={head.x + 22} cy={head.y + 6} r={eyesOn ? 8 : 6} fill={eyesOn ? C.orange : C.white} />
    </g>
  );
};

const Captions: React.FC<{ t: number }> = ({ t }) => {
  const idx = CHUNKS.findIndex(([a, b], i) => {
    const next = CHUNKS[i + 1];
    const end = next ? WORDS[next[0]].start - 0.05 : WORDS[b].end + 0.6;
    return t >= WORDS[a].start - 0.1 && t < end;
  });
  if (idx < 0) return null;
  const [a, b] = CHUNKS[idx];
  const inK = p(t, WORDS[a].start - 0.1, WORDS[a].start + 0.12);
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 952, display: "flex", justifyContent: "center", gap: 18,
      fontFamily: CAP, fontWeight: 900, fontSize: 60, textTransform: "uppercase", opacity: inK, transform: `translateY(${(1 - inK) * 14}px)` }}>
      {WORDS.slice(a, b + 1).map((w, i) => {
        const nxt = WORDS[a + i + 1];
        const on = t >= w.start && t < (nxt && a + i + 1 <= b ? nxt.start : w.end + 0.3);
        const past = t >= w.start && !on;
        const k = p(t, w.start, w.start + 0.12);
        return (
          <span key={i} style={{ color: on ? C.hi : past ? C.white : "rgba(255,255,255,0.55)", transform: `scale(${1 + (on ? 0.12 * k : 0)})`,
            display: "inline-block", margin: on ? "0 8px" : "0", WebkitTextStroke: "3px rgba(8,16,40,0.9)", paintOrder: "stroke fill", textShadow: "0 5px 0 rgba(0,0,0,0.35)" }}>{w.w}</span>
        );
      })}
    </div>
  );
};

// camera: each scene pushes toward its own subject (feet, gaze line, hips) with a slow drift
const SHOTS: { t: number; x: number; y: number; z: number }[] = [
  { t: 0, x: 960, y: 560, z: 1.0 }, { t: 3.2, x: 960, y: 560, z: 1.06 },
  { t: 3.7, x: 820, y: 760, z: 1.16 }, { t: 6.95, x: 800, y: 740, z: 1.22 },
  { t: 7.45, x: 1150, y: 560, z: 1.1 }, { t: 10.95, x: 1120, y: 580, z: 1.15 },
  { t: 11.45, x: 860, y: 700, z: 1.2 }, { t: 14.1, x: 880, y: 680, z: 1.28 },
  { t: 14.6, x: 1000, y: 540, z: 1.08 }, { t: 15.5, x: 1000, y: 540, z: 1.1 },
  { t: 16.1, x: 960, y: 540, z: 1.0 }, { t: 18, x: 960, y: 540, z: 1.02 },
];
const cam = (t: number) => {
  const i = Math.max(0, SHOTS.findIndex((k, j) => t >= k.t && (j === SHOTS.length - 1 || t < SHOTS[j + 1].t)));
  const A = SHOTS[i], B = SHOTS[Math.min(i + 1, SHOTS.length - 1)];
  const k = B === A ? 0 : EASE_IO((t - A.t) / (B.t - A.t));
  const x = mix(A.x, B.x, k), y = mix(A.y, B.y, k), z = mix(A.z, B.z, k);
  return `translate(${960 - x * z}px, ${560 - y * z}px) scale(${z})`;
};
const EASE_IO = (u: number) => Easing.inOut(Easing.cubic)(Math.min(1, Math.max(0, u)));

export const BaseballSteps: React.FC = () => {
  const f = useCurrentFrame();
  const t = f / FPS;
  const s = swingAt(t);
  // scene icon (crossfaded)
  const icons: { from: number; to: number; el: React.ReactNode }[] = [
    { from: S.stance + 0.2, to: S.eyes, el: <IconStance /> },
    { from: S.eyes + 0.2, to: S.hips, el: <IconEye t={t} /> },
    { from: S.hips + 0.2, to: S.outro, el: <IconHips t={t} /> },
  ];
  // the pitch: ball floats toward the batter during EYES, the real pitch arrives at contact
  const eyesBall = t >= S.eyes && t < S.hips ? { x: mix(1720, 1180, p(t, S.eyes + 0.3, S.hips - 0.3, Easing.inOut(Easing.sin))), y: 640 + Math.sin(t * 3) * 6 } : null;
  const pitchK = p(t, S.hit - 0.75, S.hit, Easing.linear);
  const flyK = p(t, S.hit, S.hit + 0.9, Easing.out(Easing.quad));
  const contact = { x: 985, y: 598 };
  const pitchBall = t >= S.hit - 0.75 && t < S.hit ? { x: mix(1820, contact.x, pitchK), y: mix(620, contact.y, pitchK) - Math.sin(pitchK * Math.PI) * 40 } : null;
  const flyBall = t >= S.hit && t < S.hit + 0.95 ? { x: mix(contact.x, 2050, flyK), y: mix(contact.y, -80, flyK) } : null;
  const flash = t >= S.hit ? Math.max(0, 1 - (t - S.hit) / 0.18) : 0;
  const shake = flash > 0 ? Math.sin(f * 7) * 10 * flash : 0;
  const bgPan = interpolate(t, [0, BASEBALL_SEC], [0, -60]);
  const outroK = p(t, S.outro, S.outro + 0.6);
  const introPop = p(t, 0.1, 0.7, Easing.bezier(0.34, 1.56, 0.64, 1));
  const items = ["STANCE", "EYES", "HIPS"];
  const music = (fr: number) => interpolate(fr, [0, 15, 480, 540], [0, 0.14, 0.14, 0], CL);
  return (
    <AbsoluteFill style={{ background: C.navy, overflow: "hidden" }}>
      {/* licensed stadium photo, blurred and tinted so it reads as atmosphere */}
      <Img src={staticFile("baseball/stadium_bg.jpg")} style={{ position: "absolute", width: 2040, height: 1148, left: -60 + bgPan, top: -40, opacity: 0.32, filter: "saturate(0.6)" }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, rgba(22,41,90,0.15), ${C.navy} 85%)` }} />
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.4}px) ${cam(t)}`, transformOrigin: "0 0" }}>
        <svg width={1920} height={1080} style={{ position: "absolute", overflow: "visible" }}>
          {/* field strip (inside the camera so the feet stay on it) */}
          <defs><pattern id="mow" width={240} height={10} patternUnits="userSpaceOnUse"><rect width={120} height={10} fill={C.grass} /><rect x={120} width={120} height={10} fill={C.grass2} /></pattern></defs>
          <rect x={-1200} y={GROUND} width={4400} height={1400} fill="url(#mow)" />
          <rect x={-1200} y={GROUND - 4} width={4400} height={8} fill="rgba(255,255,255,0.85)" />
          <g opacity={1 - outroK * 0.35} transform={`translate(${760 * (1 - introPop)} ${GROUND * (1 - introPop)}) scale(${introPop})`}>
            <Batter t={t} />
          </g>
          {/* home plate */}
          <path d={`M${930} ${GROUND + 2} h70 l-12 18 h-46 z`} fill="#fff" opacity={0.9} />
          {eyesBall && (
            <g opacity={p(t, S.eyes + 0.2, S.eyes + 0.6) * (1 - p(t, S.hips - 0.35, S.hips))}>
              <line x1={810} y1={593} x2={eyesBall.x} y2={eyesBall.y} stroke={C.orange} strokeWidth={6} strokeDasharray="18 16" strokeDashoffset={-t * 120} strokeLinecap="round" />
              <Ball x={eyesBall.x} y={eyesBall.y} r={20} spin={t * 200} />
            </g>
          )}
          {pitchBall && <Ball x={pitchBall.x} y={pitchBall.y} spin={t * 900} />}
          {flyBall && (
            <g>
              <path d={`M${contact.x} ${contact.y} L${flyBall.x} ${flyBall.y}`} stroke="rgba(255,255,255,0.35)" strokeWidth={10} strokeLinecap="round" />
              <Ball x={flyBall.x} y={flyBall.y} r={18} spin={t * 1400} />
            </g>
          )}
          {flash > 0 && (
            <g transform={`translate(${contact.x} ${contact.y})`} opacity={flash}>
              {Array.from({ length: 10 }).map((_, i) => {
                const ang = (i / 10) * Math.PI * 2, r1 = 30 + (1 - flash) * 40, r2 = 90 + (1 - flash) * 90;
                return <line key={i} x1={Math.cos(ang) * r1} y1={Math.sin(ang) * r1} x2={Math.cos(ang) * r2} y2={Math.sin(ang) * r2} stroke={C.hi} strokeWidth={10} strokeLinecap="round" />;
              })}
            </g>
          )}
          {/* hip rotation arrow on the batter during HIPS */}
          {t >= S.hips && t < S.outro && s < 1.4 && (
            <g transform={`translate(770 ${GROUND - 190})`} opacity={p(t, S.hips + 0.3, S.hips + 0.8) * (1 - p(t, S.hit + 0.2, S.hit + 0.5))}>
              <ellipse rx={95} ry={28} fill="none" stroke={C.orange} strokeWidth={8} strokeDasharray={`${300 * p(t, S.hips + 0.3, S.hips + 1.2)} 400`} />
              <path d="M88 12 l14 -22 M88 12 l-24 -6" stroke={C.orange} strokeWidth={8} strokeLinecap="round" opacity={p(t, S.hips + 1.0, S.hips + 1.2)} />
            </g>
          )}
          {/* feet-width arrow during STANCE */}
          {t >= S.stance && t < S.eyes && (
            <g opacity={p(t, S.stance + 0.6, S.stance + 1.0) * (1 - p(t, S.eyes - 0.3, S.eyes))} stroke={C.orange} strokeWidth={8} strokeLinecap="round">
              <path d={`M${760 - 105} ${GROUND + 34} H${760 + 105} M${760 - 105} ${GROUND + 34} l16 -12 M${760 - 105} ${GROUND + 34} l16 12 M${760 + 105} ${GROUND + 34} l-16 -12 M${760 + 105} ${GROUND + 34} l-16 12`} />
            </g>
          )}
        </svg>
      </AbsoluteFill>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
          {icons.map((ic, i) => {
            const k = p(t, ic.from, ic.from + 0.45, Easing.bezier(0.34, 1.56, 0.64, 1)) * (1 - p(t, ic.to - 0.3, ic.to));
            if (k <= 0) return null;
            return (
              <g key={i} transform={`translate(1480 330) scale(${0.6 + 0.4 * k})`} opacity={k}>
                <circle r={170} fill="rgba(255,138,31,0.10)" stroke="rgba(255,138,31,0.35)" strokeWidth={4} />
                {ic.el}
              </g>
            );
          })}
      </svg>

      <Heading text="3 STEPS TO HIT HARDER" t={t} from={0.35} to={S.stance} />
      <Heading text="1. STANCE" t={t} from={S.stance + 0.05} to={S.eyes} />
      <Heading text="2. EYES" t={t} from={S.eyes + 0.05} to={S.hips} />
      <Heading text="3. HIPS" t={t} from={S.hips + 0.05} to={S.outro} />

      <Captions t={t} />

      {/* outro checklist */}
      {t >= S.outro && (
        <div style={{ position: "absolute", left: 1020, top: 250, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 26 }}>
          {items.map((it, i) => {
            const k = p(t, S.outro + 0.15 + i * 0.3, S.outro + 0.55 + i * 0.3, Easing.bezier(0.34, 1.56, 0.64, 1));
            return (
              <div key={it} style={{ fontFamily: MARKER, fontSize: 96, color: C.white, opacity: k, transform: `translateX(${(1 - k) * -60}px)`, display: "flex", alignItems: "center", gap: 30 }}>
                <span style={{ color: C.orange }}>✓</span> {i + 1}. {it}
              </div>
            );
          })}
        </div>
      )}

      {/* sound */}
      <Audio src={staticFile("audio-lib/music/synth_music/synth-music-stomp-clap-sports.mp3")} volume={music} />
      <Sequence from={Math.round(OFF * FPS)}><Audio src={staticFile("baseball/vo.wav")} /></Sequence>
      <Sfx id="synth-pen-01" at={Math.round(0.35 * FPS)} volume={0.35} />
      {[S.stance, S.eyes, S.hips].map((x, i) => <Sfx key={i} id="synth-whoosh-05" at={Math.round((x - 0.1) * FPS)} volume={0.4} />)}
      {[S.stance, S.eyes, S.hips].map((x, i) => <Sfx key={"p" + i} id="synth-pop-02" at={Math.round((x + 0.25) * FPS)} volume={0.45} />)}
      <Sfx id="synth-whoosh-07" at={Math.round((S.hit - 0.4) * FPS)} volume={0.45} />
      <Sequence from={Math.round(S.hit * FPS) - 1}><Audio src={staticFile("baseball/crack.wav")} volume={0.9} /></Sequence>
      <Sfx id="synth-impact-03" at={Math.round(S.hit * FPS)} volume={0.35} />
      <Sfx id="synth-crowd-roar-03" at={Math.round((S.hit + 0.1) * FPS)} volume={0.3} />
      {items.map((_, i) => <Sfx key={"c" + i} id="synth-blip-03" at={Math.round((S.outro + 0.2 + i * 0.3) * FPS)} volume={0.4} />)}
    </AbsoluteFill>
  );
};
