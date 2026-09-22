import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Move, Volume2, VolumeX, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appearanceFeatures, elias, relationshipTypes, type ArchiveSection } from "@/lib/elias-data";
import manorEntrance from "@/assets/manor-entrance-rain.jpg";
import manorEntranceRain from "@/assets/manor-entrance-rain.webm";
import manorCorridor from "@/assets/manor-corridor.jpg";
import manorTurn from "@/assets/manor-turn.jpg";
import eliasBedroom from "@/assets/elias-bedroom.jpg";
import eliasRose from "@/assets/elias-rose-cutout.png";
import eliasBowing from "@/assets/elias-bowing-cutout.png";

type ExperienceStage = "manor" | "desk" | "welcome" | "archive";

const manorScenes = [
  { image: manorEntrance, chapter: "I", title: "The entrance", note: "Approach" },
  { image: manorCorridor, chapter: "II", title: "Beyond the threshold", note: "First left" },
  { image: manorTurn, chapter: "III", title: "The private wing", note: "Second left" },
  { image: eliasBedroom, chapter: "IV", title: "The bedroom", note: "Enter" },
] as const;

function useSound(enabled: boolean) {
  const contextRef = useRef<AudioContext | null>(null);
  const droneRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const jazzGainRef = useRef<GainNode | null>(null);
  const jazzRef = useRef<{ oscillators: OscillatorNode[]; timer: number } | null>(null);
  const rainRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode } | null>(null);


  const ensure = useCallback(() => {
    if (!enabled) return null;
    const AudioCtx = window.AudioContext ?? window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!contextRef.current) contextRef.current = new AudioCtx();
    const ctx = contextRef.current;
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }, [enabled]);

  const tone = useCallback((frequency = 180, duration = 0.13, volume = 0.025) => {
    const ctx = ensure();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration + 0.02);
  }, [ensure]);

  const beginAmbience = useCallback(() => {
    const ctx = ensure();
    if (!ctx || droneRef.current) return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = 55;
    gain.gain.value = 0.008;
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start();
    droneRef.current = oscillator;
    gainRef.current = gain;
  }, [ensure]);

  const beginRain = useCallback(() => {
    const ctx = ensure();
    if (!ctx || rainRef.current) return;
    const length = Math.floor(ctx.sampleRate * 3);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let index = 0; index < length; index += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.035 * white) / 1.035;
      data[index] = last * 3.2 + white * 0.35;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 430;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 5200;
    const gain = ctx.createGain();
    gain.gain.value = 0.0001;
    gain.gain.setTargetAtTime(0.11, ctx.currentTime, 1.2);
    source.connect(highpass).connect(lowpass).connect(gain).connect(ctx.destination);
    source.start();
    rainRef.current = { source, gain };
  }, [ensure]);

  const stopRain = useCallback(() => {
    const ctx = contextRef.current;
    const rain = rainRef.current;
    if (!ctx || !rain) return;
    rain.gain.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.4);
    window.setTimeout(() => { try { rain.source.stop(); } catch { /* already stopped */ } }, 1600);
    rainRef.current = null;
  }, []);

  const beginJazz = useCallback(() => {
    const ctx = ensure();
    if (!ctx || jazzRef.current) return;
    const master = ctx.createGain();
    master.gain.value = 0.32;
    master.connect(ctx.destination);
    jazzGainRef.current = master;
    // ii - V - I - vi in F, voiced as seventh chords
    const chords = [[146.83, 174.61, 220, 261.63], [130.81, 164.81, 196, 233.08], [174.61, 220, 261.63, 329.63], [110, 130.81, 164.81, 196]];
    const melodyScale = [349.23, 392, 440, 523.25, 587.33, 698.46];
    let bar = 0;
    const voice = (frequency: number, start: number, duration: number, volume: number, type: OscillatorType) => {
      const oscillator = ctx.createOscillator();
      const envelope = ctx.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, start);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(volume, start + 0.06);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(envelope).connect(master);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.05);
    };
    const playBar = () => {
      const chord = chords[bar % chords.length] ?? chords[0]!;
      const start = ctx.currentTime + 0.05;
      chord.forEach((frequency, index) => voice(frequency * 2, start + index * 0.045, 2.1, 0.06 / (index * 0.5 + 1), "triangle"));
      [0, 0.6, 1.2, 1.8].forEach((beat, index) => voice((chord[index % chord.length] ?? 146.83) / 2, start + beat, 0.5, 0.09, "sine"));
      [0.3, 0.95, 1.5].forEach((beat) => voice(melodyScale[Math.floor(Math.random() * melodyScale.length)] ?? 440, start + beat, 0.45, 0.045, "sine"));
      bar += 1;
    };
    playBar();
    const timer = window.setInterval(playBar, 2400);
    jazzRef.current = { oscillators: [], timer };
  }, [ensure]);

  useEffect(() => {
    const ctx = contextRef.current;
    if (!ctx) return;
    if (gainRef.current) gainRef.current.gain.setTargetAtTime(enabled ? 0.008 : 0.0001, ctx.currentTime, 0.1);
    if (jazzGainRef.current) jazzGainRef.current.gain.setTargetAtTime(enabled ? 0.32 : 0.0001, ctx.currentTime, 0.12);
    if (rainRef.current) rainRef.current.gain.gain.setTargetAtTime(enabled ? 0.11 : 0.0001, ctx.currentTime, 0.2);
  }, [enabled]);

  return { tone, beginAmbience, beginJazz, beginRain, stopRain };
}

export function EliasExperience() {
  const [stage, setStage] = useState<ExperienceStage>("manor");
  const [scene, setScene] = useState(0);
  const [muted, setMuted] = useState(false);
  const [section, setSection] = useState<ArchiveSection>("relationships");
  const [computerZoom, setComputerZoom] = useState(false);
  const { tone, beginAmbience, beginJazz, beginRain, stopRain } = useSound(!muted);

  useEffect(() => {
    if (stage !== "manor") return;
    const start = () => { beginRain(); beginAmbience(); };
    window.addEventListener("pointerdown", start, { once: true });
    window.addEventListener("keydown", start, { once: true });
    start();
    return () => { window.removeEventListener("pointerdown", start); window.removeEventListener("keydown", start); };
  }, [stage, beginRain, beginAmbience]);

  const advanceManor = () => {
    beginRain();
    beginAmbience();
    tone(scene === 0 ? 105 : 145, 0.22, 0.02);
    if (scene < manorScenes.length - 1) setScene((current) => current + 1);
    else { stopRain(); setStage("desk"); }
  };

  const enterComputer = () => {
    tone(240, 0.5, 0.04);
    stopRain();
    beginJazz();
    setComputerZoom(true);
    window.setTimeout(() => setStage("welcome"), 1250);
  };

  return (
    <main className="min-h-dvh bg-background text-foreground selection:bg-primary/30">
      <SoundControl muted={muted} onToggle={() => setMuted((value) => !value)} />
      <footer className="pointer-events-none fixed inset-x-0 bottom-2 z-[90] text-center text-[8px] uppercase tracking-[.2em] text-foreground/55 mix-blend-difference">Made by @safffffffr · All rights reserved</footer>
      {stage === "manor" && <ManorSequence scene={scene} onAdvance={advanceManor} onSkip={() => { stopRain(); setStage("desk"); }} />}
       {stage === "desk" && <DeskScene onEnter={enterComputer} entering={computerZoom} />}
      {stage === "welcome" && <WelcomeScreen onEnter={() => { tone(360, .45, .035); setStage("archive"); }} />}
      {stage === "archive" && (
        <Archive section={section} onSection={(next) => { tone(220, .12, .018); setSection(next); }} tone={tone} />
      )}
    </main>
  );
}

function SoundControl({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <Button aria-label={muted ? "Unmute sound" : "Mute sound"} title={muted ? "Unmute sound" : "Mute sound"} onClick={onToggle} variant="ghost" size="icon" className="fixed bottom-8 right-4 z-40 h-8 w-8 border border-border bg-background/60 text-primary backdrop-blur-md hover:bg-card [&_svg]:h-3.5 [&_svg]:w-3.5">
      {muted ? <VolumeX /> : <Volume2 />}
    </Button>
  );
}


function ManorSequence({ scene, onAdvance, onSkip }: { scene: number; onAdvance: () => void; onSkip: () => void }) {
  const current = manorScenes[scene];
  if (!current) return null;
  return (
    <section className="grain relative h-dvh overflow-hidden bg-ink" aria-label="Journey through the manor">
      <div key={current.image} className="cinematic-frame absolute inset-0">
        {scene === 0 ? (
          <video src={manorEntranceRain} poster={manorEntrance} autoPlay loop muted playsInline aria-label="A dark manor entrance under animated rainfall" className="h-full w-full object-cover" />
        ) : (
          <img src={current.image} alt="A dark, elegant manor interior" width={1536} height={864} className="cinematic-image h-full w-full object-cover" />
        )}
      </div>
      <div className="vignette absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/25" />
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-8 px-6 pb-8 md:px-12 md:pb-12">
        <div className="max-w-md border-l border-primary/60 pl-5">
          <p className="mb-2 text-[10px] uppercase tracking-[.35em] text-primary">Passage {current.chapter}</p>
          <h1 className="font-display text-4xl font-medium md:text-6xl">{current.title}</h1>
          <p className="mt-3 text-xs uppercase tracking-[.28em] text-muted-foreground">{current.note}</p>
        </div>
        <Button onClick={onAdvance} className="h-12 border border-primary/60 bg-background/55 px-6 uppercase tracking-[.22em] text-foreground backdrop-blur-md hover:bg-primary hover:text-primary-foreground">
          {scene === manorScenes.length - 1 ? "Enter the room" : "Continue"}
        </Button>
      </div>
      <Button onClick={onSkip} variant="ghost" className="absolute left-4 top-4 z-20 text-[10px] uppercase tracking-[.24em] text-muted-foreground hover:bg-background/50 hover:text-foreground">Skip passage</Button>
      <div className="absolute bottom-0 left-0 z-20 h-px bg-primary transition-all duration-1000" style={{ width: `${((scene + 1) / manorScenes.length) * 100}%` }} />
    </section>
  );
}

function DeskScene({ onEnter, entering }: { onEnter: () => void; entering: boolean }) {
  return (
    <section className="grain relative h-dvh overflow-hidden bg-ink">
      <img src={eliasBedroom} alt="A refined bedroom with a garden-facing desk" width={1536} height={864} className={`bedroom-terminal-view h-full w-full object-cover object-right ${entering ? "terminal-zoom" : ""}`} />
      <div className="vignette absolute inset-0 bg-background/10" />
      <Button disabled={entering} aria-label="Enter Elias Archer's computer" onClick={onEnter} variant="ghost" className="terminal-hotspot group absolute left-[64%] top-[40%] h-[12.5%] w-[17%] min-w-0 rounded-none border border-primary/55 bg-background/5 p-0 transition-all duration-700 hover:bg-primary/10 focus-visible:border-primary disabled:pointer-events-none md:left-[81%] md:top-[36%] md:h-[14%] md:w-[11%]">
        <span className="absolute inset-1 border border-primary/30 transition-all duration-500 group-hover:inset-0" />
        <span className="absolute left-1/2 top-[calc(100%+0.75rem)] -translate-x-1/2 whitespace-nowrap border border-primary/40 bg-background/80 px-4 py-2 text-[9px] uppercase tracking-[.28em] text-primary backdrop-blur-md">Access terminal</span>
      </Button>
      <div className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 text-center">
        <p className="font-display text-2xl text-foreground/80">The room settles into silence.</p>
        <p className="mt-2 text-[9px] uppercase tracking-[.28em] text-muted-foreground">The computer is waiting</p>
      </div>
    </section>
  );
}

function WelcomeScreen({ onEnter }: { onEnter: () => void }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  return (
    <button onClick={onEnter} onPointerMove={(event) => setPosition({ x: event.clientX / window.innerWidth - .5, y: event.clientY / window.innerHeight - .5 })} className="grain relative flex h-dvh w-full cursor-pointer items-center justify-center overflow-hidden bg-ink text-center animate-in fade-in duration-700">
      <div className="archive-grid absolute inset-0 opacity-30" style={{ transform: `translate(${position.x * -10}px, ${position.y * -10}px)` }} />
      <div className="absolute inset-[4%] border border-primary/40" />
      <div className="absolute inset-x-[8%] top-[10%] flex justify-between border-b border-primary/20 pb-3 text-[8px] uppercase tracking-[.3em] text-primary"><span>Archer private terminal</span><span>System ready</span></div>
      <div className="absolute bottom-[9%] left-[8%] h-2 w-2 bg-primary shadow-[0_0_16px_var(--primary)]" />
      <div className="relative" style={{ transform: `translate(${position.x * 16}px, ${position.y * 12}px)` }}>
        <p className="mb-5 text-[10px] uppercase tracking-[.5em] text-primary">Private archive</p>
        <h1 className="font-display text-6xl font-medium md:text-8xl">Welcome Back</h1>
        <p className="mt-3 font-display text-2xl italic text-brass-soft md:text-4xl">Elias Archer</p>
        <p className="mt-16 text-[9px] uppercase tracking-[.35em] text-muted-foreground">Click anywhere to continue</p>
      </div>
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-primary/10 to-transparent animate-[scan_5s_linear_infinite]" />
    </button>
  );
}

function Archive({ section, onSection, tone }: { section: ArchiveSection; onSection: (section: ArchiveSection) => void; tone: (frequency?: number, duration?: number, volume?: number) => void }) {
  const labels: Array<{ id: ArchiveSection; label: string; numeral: string }> = [
    { id: "relationships", label: "Relationship Chart", numeral: "01" },
    { id: "appearance", label: "Appearance", numeral: "02" },
    { id: "backstory", label: "Backstory", numeral: "03" },
  ];
  return (
    <section className="archive-grid grain relative min-h-dvh overflow-hidden bg-background text-foreground animate-in fade-in duration-700">
      <header className="relative z-30 flex flex-col border-b border-border bg-background/85 px-5 pt-4 backdrop-blur-xl md:min-h-20 md:flex-row md:items-center md:justify-between md:px-10 md:pt-0">
        <div className="pb-3 md:pb-0">
          <p className="font-display text-2xl">Elias Archer</p>
          <p className="text-[8px] uppercase tracking-[.35em] text-muted-foreground">Private record · Kitagawa High</p>
        </div>
        <nav className="grid w-full grid-cols-3 gap-1 md:flex md:w-auto" aria-label="Archive sections">
          {labels.map((item) => (
            <Button key={item.id} variant="ghost" onClick={() => onSection(item.id)} className={`h-auto min-w-0 whitespace-normal rounded-none border-b px-1 py-3 text-center text-[8px] uppercase tracking-[.12em] md:px-5 md:text-[9px] md:tracking-[.16em] ${section === item.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
              <span className="hidden md:inline">{item.numeral} · </span>{item.label}
            </Button>
          ))}
        </nav>
      </header>
      <div key={section} className="archive-enter relative z-30">
        {section === "relationships" && <RelationshipChart tone={tone} />}
        {section === "appearance" && <AppearanceDossier tone={tone} />}
        {section === "backstory" && <Backstory />}
      </div>
    </section>
  );
}

function RelationshipChart({ tone }: { tone: (frequency?: number, duration?: number, volume?: number) => void }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef({ offset, zoom });
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  useEffect(() => { viewRef.current = { offset, zoom }; }, [offset, zoom]);
  const changeZoom = useCallback((nextZoom: number, clientX?: number, clientY?: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const rect = viewport.getBoundingClientRect();
    const current = viewRef.current;
    const next = Math.min(2.5, Math.max(.55, nextZoom));
    const px = (clientX ?? rect.left + rect.width / 2) - rect.left - rect.width / 2;
    const py = (clientY ?? rect.top + rect.height / 2) - rect.top - rect.height / 2;
    const ratio = next / current.zoom;
    setOffset({ x: px - (px - current.offset.x) * ratio, y: py - (py - current.offset.y) * ratio });
    setZoom(next);
  }, []);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
      changeZoom(viewRef.current.zoom * Math.exp(-delta * .0015), event.clientX, event.clientY);
    };
    viewport.addEventListener("wheel", onWheel, { passive: false });
    return () => viewport.removeEventListener("wheel", onWheel);
  }, [changeZoom]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && (viewerOpen ? setViewerOpen(false) : setProfileOpen(false));
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [viewerOpen]);

  return (
    <div className="min-h-[calc(100dvh-5rem)] px-5 py-8 md:px-10">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-8">
        <div><p className="text-[9px] uppercase tracking-[.35em] text-primary">Network index</p><h2 className="mt-2 font-display text-4xl md:text-6xl">Relationship Chart</h2></div>
      </div>
      <div ref={viewportRef} className="relative mx-auto h-[44vh] min-h-80 max-w-5xl touch-none cursor-grab overflow-hidden border-y border-border active:cursor-grabbing" onPointerDown={(event) => { if ((event.target as HTMLElement).closest("button, [role='dialog']")) return; drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y }; event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (drag.current) setOffset({ x: drag.current.ox + event.clientX - drag.current.x, y: drag.current.oy + event.clientY - drag.current.y }); }} onPointerUp={() => { drag.current = null; }}>
        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2 text-[8px] uppercase tracking-[.22em] text-muted-foreground"><Move className="h-3 w-3" /> Drag · scroll to zoom</div>
        <div className="absolute right-4 top-4 z-40 flex gap-1" onPointerDown={(event) => event.stopPropagation()}>
          <Button variant="outline" size="icon" aria-label="Zoom out relationship chart" onClick={() => { tone(185, .08, .012); changeZoom(viewRef.current.zoom / 1.2); }}><ZoomOut className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" aria-label="Zoom in relationship chart" onClick={() => { tone(245, .08, .012); changeZoom(viewRef.current.zoom * 1.2); }}><ZoomIn className="h-4 w-4" /></Button>
        </div>
        <div className="absolute left-1/2 top-1/2 flex items-center justify-center transition-transform duration-100" style={{ transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})` }}>
        <div className="absolute h-72 w-72 rounded-full border border-border/40 md:h-96 md:w-96" />
        <div className="absolute h-52 w-52 rounded-full border border-dashed border-primary/25 md:h-72 md:w-72" />
        <button onPointerDown={(event) => event.stopPropagation()} onClick={() => { tone(330, .18, .025); setProfileOpen((open) => !open); }} className="group relative z-10 grid h-36 w-36 place-items-center rounded-full border border-primary/70 bg-card shadow-[0_0_60px_color-mix(in_oklab,var(--primary)_15%,transparent)] transition duration-500 hover:scale-105 md:h-44 md:w-44">
          <span className="absolute inset-2 rounded-full border border-primary/20 animate-[pulse-ring_3s_ease-in-out_infinite]" />
          <span><span className="block text-[8px] uppercase tracking-[.3em] text-primary">Central file</span><span className="mt-2 block font-display text-2xl">Elias Archer</span></span>
        </button>
        {profileOpen && <ProfilePanel onClose={() => setProfileOpen(false)} onExpand={() => { tone(420, .16, .02); setViewerOpen(true); }} />}
        </div>
      </div>
      <RelationshipLegend />
      {viewerOpen && <ImageViewer onClose={() => setViewerOpen(false)} />}
    </div>
  );
}

function RelationshipLegend() {
  return (
    <section className="mx-auto max-w-7xl border-t border-border pt-5" aria-label="Relationship legend">
      <div className="mb-4 flex items-end justify-between"><h3 className="font-display text-xl">Relationship legend</h3><p className="text-[8px] uppercase tracking-[.25em] text-muted-foreground">Future connection system</p></div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4 lg:grid-cols-6">
        {relationshipTypes.map((type, index) => (
          <div key={type} className="legend-item flex items-center gap-3 text-[9px] text-foreground/75">
             <span className="legend-swatch w-8 shrink-0" style={{ opacity: .72 + (index % 3) * .12 }} />
            <span>{type}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfilePanel({ onClose, onExpand }: { onClose: () => void; onExpand: () => void }) {
  return (
    <div className="absolute left-1/2 top-[calc(50%+6rem)] z-30 w-64 -translate-x-1/2 animate-in slide-in-from-left-3 fade-in duration-300 md:left-[calc(50%+5rem)] md:top-1/2 md:-translate-x-0 md:-translate-y-1/2" role="dialog" aria-label="Elias Archer profile">
      <div className="border border-border bg-card p-4 shadow-xl">
        <div className="flex items-center justify-between"><p className="text-[9px] uppercase tracking-[.35em] text-primary">Central profile</p><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close profile"><X /></Button></div>
        <p className="mt-3 text-[10px] leading-5 text-muted-foreground">Elias Archer</p>
        <button onClick={onExpand} className="group relative mt-3 flex h-48 w-full items-end justify-center overflow-hidden border border-border bg-background/50">
          <img src={eliasRose} alt="Elias Archer holding a rose" className="h-full w-full object-contain transition duration-700 group-hover:scale-[1.025]" />
          <span className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center border border-border bg-background/70 text-primary backdrop-blur-md"><Maximize2 className="h-4 w-4" /></span>
        </button>
        <blockquote className="mt-4 border-l border-primary pl-3 font-display text-sm leading-snug">“This is me, what the fuck do you want me to add onto that”</blockquote>
      </div>
    </div>
  );
}

function ImageViewer({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-background/90 p-4 backdrop-blur-xl" role="dialog" aria-modal="true" aria-label="Enlarged image of Elias Archer" onClick={onClose}>
      <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close image" className="absolute right-5 top-5 z-10"><X /></Button>
      <img onClick={(event) => event.stopPropagation()} src={eliasRose} alt="Elias Archer holding a rose, enlarged" className="animate-in zoom-in-95 max-h-[92dvh] max-w-[92vw] object-contain duration-500" />
    </div>
  );
}

function AppearanceDossier({ tone }: { tone: (frequency?: number, duration?: number, volume?: number) => void }) {
  const [active, setActive] = useState<string | null>(null);
  const selected = useMemo(() => appearanceFeatures.find((feature) => feature.id === active), [active]);
  return (
    <div className="min-h-[calc(100dvh-5rem)] px-5 py-8 md:px-10">
      <div className="mx-auto max-w-7xl"><p className="text-[9px] uppercase tracking-[.35em] text-primary">Visual record</p><h2 className="mt-2 font-display text-4xl md:text-6xl">Appearance</h2></div>
      <div className="mx-auto mt-4 grid max-w-7xl gap-6 lg:grid-cols-[minmax(180px,1fr)_minmax(380px,1.4fr)_minmax(220px,1fr)]">
        <aside className="order-2 border-t border-border pt-5 lg:order-1 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-8">
          <p className="text-[8px] uppercase tracking-[.3em] text-muted-foreground">Basic record</p>
          {[['Name', elias.name], ['Pronouns', elias.pronouns], ['Height', elias.height], ['Language', elias.language], ['School', elias.school], ['Background', elias.background], ['Programme', elias.programme]].map(([label, value]) => <div key={label} className="mt-5"><dt className="text-[8px] uppercase tracking-[.22em] text-primary">{label}</dt><dd className="mt-1 text-xs leading-5 text-foreground/80">{value}</dd></div>)}
        </aside>
        <div className="appearance-enter relative order-1 mx-auto h-[65vh] min-h-[520px] w-full max-w-xl overflow-hidden lg:order-2">
          <div className="absolute inset-x-[12%] bottom-0 top-[5%] bg-gradient-to-t from-forest/40 via-transparent to-transparent" />
          <img src={eliasBowing} alt="Elias Archer bowing in his black school uniform and prefect armband" className="h-full w-full object-contain drop-shadow-[0_28px_45px_color-mix(in_oklab,var(--ink)_80%,transparent)] transition-[transform,filter] duration-700 ease-[cubic-bezier(.2,.8,.2,1)]" style={{ transformOrigin: selected ? `${selected.x}% ${selected.y}%` : "50% 50%", transform: selected ? "scale(1.38)" : "scale(1)", filter: selected ? "contrast(1.04) brightness(1.03)" : undefined }} />
          {appearanceFeatures.map((feature) => (
            <button key={feature.id} aria-label={`View ${feature.label} details`} onClick={() => { tone(520, .08, .02); setActive(feature.id); }} className={`group absolute z-20 h-8 w-8 -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${active && active !== feature.id ? "scale-75 opacity-20" : "opacity-100"}`} style={{ left: `${feature.x}%`, top: `${feature.y}%` }}>
              <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-primary bg-background transition group-hover:scale-150" />
              <span className={`hotspot-line absolute top-1/2 h-px w-12 bg-primary/60 ${feature.side === "left" ? "right-1/2 origin-right" : "left-1/2"}`} />
            </button>
          ))}
        </div>
        <aside className="order-3 min-h-40 border-t border-border pt-6 lg:border-r lg:border-t-0 lg:pr-5 lg:pt-8">
          <p className="text-[8px] uppercase tracking-[.3em] text-muted-foreground">Selected detail</p>
          {selected ? <div key={selected.id} className="detail-reveal mt-8"><p className="font-display text-3xl text-brass-soft">{selected.label}</p><p className="mt-4 max-w-xs text-sm leading-7 text-foreground/75">{selected.detail}</p></div> : <p className="mt-8 max-w-xs text-xs leading-6 text-muted-foreground">Select one of the fine markers around the visual record.</p>}
          <div className="mt-10 grid grid-cols-2 gap-2 lg:grid-cols-1">{appearanceFeatures.map((feature) => <Button key={feature.id} variant="ghost" onClick={() => { tone(520, .08, .02); setActive(feature.id); }} className={`h-auto justify-start rounded-none border-l px-3 py-2 text-left text-[9px] uppercase tracking-[.16em] transition-all duration-300 ${active === feature.id ? "translate-x-2 border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{feature.label}</Button>)}</div>
        </aside>
      </div>
    </div>
  );
}

function Backstory() {
  return (
    <div className="relative flex min-h-[calc(100dvh-5rem)] items-center justify-center overflow-hidden px-6 text-center">
      <div className="absolute inset-x-0 top-[22%] h-px bg-primary/25" /><div className="absolute inset-x-0 bottom-[22%] h-px bg-primary/25" />
      <div className="absolute left-[12%] top-0 h-full w-px bg-border/50" /><div className="absolute right-[12%] top-0 h-full w-px bg-border/50" />
      <div className="absolute left-0 top-12 h-5 w-full bg-[repeating-linear-gradient(135deg,var(--primary)_0_1px,transparent_1px_12px)] opacity-15" />
      <div className="relative"><p className="text-[9px] uppercase tracking-[.5em] text-primary">Archive incomplete</p><h2 className="mt-5 font-display text-8xl md:text-[10rem]">WIP</h2><p className="mt-2 font-display text-2xl italic text-muted-foreground">Work in Progress for now</p></div>
    </div>
  );
}

declare global { interface Window { webkitAudioContext?: typeof AudioContext } }