import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crown, Diamond, Leaf, Maximize2, Move, Volume2, VolumeX, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appearanceFeatures, elias, relationshipTypes, type ArchiveSection } from "@/lib/elias-data";
import { DriftingNotes, LikeMeter, ViewBadge } from "@/components/archive-social";
import { fetchViews, registerView } from "@/lib/archive-social";
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
  const pianoGainRef = useRef<GainNode | null>(null);
  const pianoRef = useRef<number | null>(null);
  const rainRef = useRef<{ source: AudioBufferSourceNode; gain: GainNode } | null>(null);


  const resume = useCallback(() => {
    const ctx = contextRef.current;
    if (ctx && ctx.state !== "running") void ctx.resume();
  }, []);

  const isAudioRunning = useCallback(() => contextRef.current?.state === "running", []);

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

  const beginPiano = useCallback(() => {
    const ctx = ensure();
    if (!ctx || pianoRef.current !== null) return;
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.18, ctx.currentTime + 1.4);
    master.connect(ctx.destination);
    pianoGainRef.current = master;
    const progression = [[130.81, 164.81, 196], [110, 130.81, 164.81], [146.83, 174.61, 220], [98, 123.47, 146.83]];
    let phrase = 0;
    const note = (frequency: number, start: number, duration: number, volume: number) => {
      const oscillator = ctx.createOscillator();
      const harmonics = ctx.createOscillator();
      const envelope = ctx.createGain();
      oscillator.type = "triangle";
      harmonics.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      harmonics.frequency.setValueAtTime(frequency * 2, start);
      envelope.gain.setValueAtTime(0.0001, start);
      envelope.gain.exponentialRampToValueAtTime(volume, start + 0.025);
      envelope.gain.exponentialRampToValueAtTime(volume * 0.22, start + 0.35);
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(envelope);
      harmonics.connect(envelope);
      envelope.connect(master);
      oscillator.start(start); harmonics.start(start);
      oscillator.stop(start + duration); harmonics.stop(start + duration);
    };
    const playPhrase = () => {
      const chord = progression[phrase % progression.length] ?? progression[0]!;
      const start = ctx.currentTime + 0.05;
      chord.forEach((frequency, index) => note(frequency * 2, start + index * 0.12, 2.8, 0.08 / (index + 1)));
      note((chord[0] ?? 130.81) * 4, start + 1.25, 1.45, 0.025);
      phrase += 1;
    };
    playPhrase();
    pianoRef.current = window.setInterval(playPhrase, 3200);
  }, [ensure]);

  const stopPiano = useCallback(() => {
    if (pianoRef.current !== null) window.clearInterval(pianoRef.current);
    pianoRef.current = null;
    const ctx = contextRef.current;
    if (ctx && pianoGainRef.current) pianoGainRef.current.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.35);
    pianoGainRef.current = null;
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
    if (pianoGainRef.current) pianoGainRef.current.gain.setTargetAtTime(enabled ? 0.18 : 0.0001, ctx.currentTime, 0.12);
    if (rainRef.current) rainRef.current.gain.gain.setTargetAtTime(enabled ? 0.11 : 0.0001, ctx.currentTime, 0.2);
  }, [enabled]);

  return { tone, beginAmbience, beginJazz, beginPiano, stopPiano, beginRain, stopRain, resume, isAudioRunning };
}

export function EliasExperience() {
  const [stage, setStage] = useState<ExperienceStage>("manor");
  const [scene, setScene] = useState(0);
  const [muted, setMuted] = useState(false);
  const [section, setSection] = useState<ArchiveSection>("relationships");
  const [computerZoom, setComputerZoom] = useState(false);
  const [enteringRoom, setEnteringRoom] = useState(false);
  const [views, setViews] = useState<number | null>(null);
  const { tone, beginAmbience, beginJazz, beginPiano, stopPiano, beginRain, stopRain, resume, isAudioRunning } = useSound(!muted);

  useEffect(() => {
    if (stage !== "manor" || scene !== 0) return;
    const start = () => {
      resume();
      beginRain();
      beginAmbience();
      if (isAudioRunning()) setSoundStarted(true);
    };
    start();
    const delayed = window.setTimeout(start, 400);
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    window.addEventListener("touchstart", start);
    return () => {
      window.clearTimeout(delayed);
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("touchstart", start);
    };
  }, [stage, scene, beginRain, beginAmbience, resume, isAudioRunning]);

  const advanceManor = () => {
    beginAmbience();
    tone(scene === 0 ? 165 : 205, 0.16, 0.025);
    window.setTimeout(() => tone(scene === 0 ? 220 : 275, 0.22, 0.018), 85);
    if (scene === 0) { stopRain(); beginPiano(); }
    if (scene < manorScenes.length - 1) setScene((current) => current + 1);
    else {
      setEnteringRoom(true);
      window.setTimeout(() => setStage("desk"), 900);
    }
  };

  const enterComputer = () => {
    tone(240, 0.5, 0.04);
    stopRain();
    stopPiano();
    beginJazz();
    setComputerZoom(true);
    void registerView().then(setViews).catch(() => { void fetchViews().then(setViews).catch(() => undefined); });
    window.setTimeout(() => setStage("welcome"), 1250);
  };

  return (
    <main className="min-h-dvh bg-background text-foreground selection:bg-primary/30">
      <SoundControl muted={muted} stage={stage} onToggle={() => setMuted((value) => !value)} />
      {stage === "archive" && <ViewBadge views={views} />}
      <footer className="pointer-events-none fixed inset-x-0 bottom-2 z-[90] text-center text-[8px] uppercase tracking-[.2em] text-foreground/55 mix-blend-difference">Made by @safffffffr · All rights reserved</footer>
       {stage === "manor" && <ManorSequence scene={scene} enteringRoom={enteringRoom} onAdvance={advanceManor} onSkip={() => { stopRain(); beginPiano(); setStage("desk"); }} />}
       {stage === "desk" && <DeskScene onEnter={enterComputer} entering={computerZoom} />}
      {stage === "welcome" && <WelcomeScreen onEnter={() => { tone(360, .45, .035); setStage("archive"); }} />}
      {stage === "archive" && (
        <Archive section={section} onSection={(next) => { tone(220, .12, .018); setSection(next); }} tone={tone} />
      )}
    </main>
  );
}

function SoundControl({ muted, stage, onToggle }: { muted: boolean; stage: ExperienceStage; onToggle: () => void }) {
  const position = stage === "manor" ? "right-4 top-4" : stage === "desk" ? "left-4 top-4" : "bottom-8 right-4";
  return (
    <Button aria-label={muted ? "Unmute sound" : "Mute sound"} title={muted ? "Unmute sound" : "Mute sound"} onClick={onToggle} variant="ghost" size="icon" className={`fixed z-[70] h-8 w-8 border border-border bg-background/70 text-primary backdrop-blur-md hover:bg-card [&_svg]:h-3.5 [&_svg]:w-3.5 ${position}`}>
      {muted ? <VolumeX /> : <Volume2 />}
    </Button>
  );
}


function ManorSequence({ scene, enteringRoom, onAdvance, onSkip }: { scene: number; enteringRoom: boolean; onAdvance: () => void; onSkip: () => void }) {
  const current = manorScenes[scene];
  if (!current) return null;
  return (
    <section className={`grain relative h-dvh overflow-hidden bg-ink ${enteringRoom ? "room-transition-out" : ""}`} aria-label="Journey through the manor">
      <div key={current.image} className="cinematic-frame absolute inset-0">
        {scene === 0 ? (
          <video src={manorEntranceRain} poster={manorEntrance} autoPlay loop muted playsInline preload="auto" aria-label="A dark manor entrance under animated rainfall" className="manor-rain-video h-full w-full object-cover" />
        ) : (
          <img src={current.image} alt="A dark, elegant manor interior" width={1536} height={864} className={`${scene === manorScenes.length - 1 ? "cinematic-bedroom" : "cinematic-image"} h-full w-full object-cover`} />
        )}
      </div>
      <div className="vignette absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/25" />
      <div className="absolute inset-x-0 bottom-0 z-10 flex items-end justify-between gap-8 px-6 pb-8 md:px-12 md:pb-12">
        <div className="max-w-md border-l border-primary/60 pl-5">
          <p className="mb-2 text-[10px] uppercase tracking-[.35em] text-primary">Passage {current.chapter}</p>
          <h1 className="font-display text-4xl font-medium md:text-6xl">{current.title}</h1>
          <p className="mt-3 text-xs uppercase tracking-[.28em] text-muted-foreground">{current.note}</p>
        </div>
        <Button disabled={enteringRoom} onClick={onAdvance} className="h-12 border border-primary/60 bg-background/55 px-6 uppercase tracking-[.22em] text-foreground backdrop-blur-md transition-[transform,background-color,color] duration-300 hover:-translate-y-0.5 hover:bg-primary hover:text-primary-foreground disabled:pointer-events-none">
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
    <section className="desk-scene-enter grain relative h-dvh overflow-hidden bg-ink">
      <img src={eliasBedroom} alt="A refined bedroom with a garden-facing desk" width={1536} height={864} className={`bedroom-terminal-view h-full w-full object-cover object-right ${entering ? "terminal-zoom" : ""}`} />
      <div className="vignette absolute inset-0 bg-background/10" />
      <Button disabled={entering} aria-label="Enter Elias Archer's computer" onClick={onEnter} variant="ghost" className={`terminal-hotspot terminal-target-open group absolute left-[64%] top-[40%] h-[12.5%] w-[17%] min-w-0 rounded-none border border-primary/40 bg-primary/5 p-0 shadow-[0_0_26px_color-mix(in_oklab,var(--primary)_18%,transparent)] transition-colors duration-700 hover:border-primary hover:bg-primary/10 hover:shadow-[0_0_38px_color-mix(in_oklab,var(--primary)_32%,transparent)] focus-visible:outline-primary disabled:pointer-events-none md:left-auto md:right-[2.5%] md:top-[41%] md:h-[15%] md:w-[11%] ${entering ? "terminal-hotspot-entering" : ""}`}>
        <span className="terminal-corner terminal-corner-tl" /><span className="terminal-corner terminal-corner-tr" /><span className="terminal-corner terminal-corner-bl" /><span className="terminal-corner terminal-corner-br" />
        <span className="absolute inset-1 border border-primary/20 transition-all duration-500 group-hover:inset-0 group-hover:border-primary/60" />
        <span className="absolute left-1/2 top-[calc(100%+0.55rem)] -translate-x-1/2 whitespace-nowrap border border-primary/60 bg-background/90 px-3 py-1.5 text-[7px] uppercase tracking-[.2em] text-primary shadow-lg backdrop-blur-md md:px-4 md:py-2 md:text-[9px] md:tracking-[.28em]">Access terminal</span>
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
  const [leaving, setLeaving] = useState(false);
  const continueToArchive = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onEnter, 650);
  };
  return (
    <button onClick={continueToArchive} onPointerMove={(event) => setPosition({ x: event.clientX / window.innerWidth - .5, y: event.clientY / window.innerHeight - .5 })} className={`grain relative flex h-dvh w-full cursor-pointer items-center justify-center overflow-hidden bg-ink text-center animate-in fade-in duration-700 ${leaving ? "welcome-transition-out" : ""}`}>
      <div className="computer-desktop absolute inset-0" style={{ transform: `translate(${position.x * -5}px, ${position.y * -5}px) scale(1.02)` }} />
      <div className="absolute inset-3 border border-primary/20 md:inset-8" />
      <div className="absolute inset-x-3 top-3 flex h-9 items-center justify-between border-b border-primary/20 bg-background/60 px-4 text-[7px] uppercase tracking-[.25em] text-muted-foreground backdrop-blur-md md:inset-x-8 md:top-8"><span>Archer OS</span><span>Private computer · Secure session</span></div>
      <div className="relative flex min-h-[28rem] w-[min(90vw,38rem)] flex-col items-center justify-center border border-primary/25 bg-background/65 px-5 py-10 shadow-2xl backdrop-blur-xl" style={{ transform: `translate(${position.x * 10}px, ${position.y * 8}px)` }}>
        <div className="welcome-crest relative mb-8 grid h-28 w-28 place-items-center rounded-full border border-primary/50" aria-hidden="true">
          <div className="crest-rotate absolute inset-[-9px] rounded-full border border-dashed border-primary/35" />
          <Leaf className="absolute -left-4 top-9 h-8 w-8 -rotate-45 text-primary/70" /><Leaf className="absolute -right-4 top-9 h-8 w-8 rotate-45 scale-x-[-1] text-primary/70" />
          <Crown className="h-9 w-9 text-brass-soft" strokeWidth={1.15} />
        </div>
        <p className="mb-4 text-[9px] uppercase tracking-[.45em] text-primary">Private archive</p>
        <h1 className="font-display text-5xl font-medium md:text-7xl">Welcome Back</h1>
        <p className="mt-3 font-display text-2xl italic text-brass-soft md:text-4xl">Elias Archer</p>
        <div className="mt-12 h-px w-40 bg-primary/30" />
        <p className="mt-6 text-[8px] uppercase tracking-[.32em] text-muted-foreground">Click anywhere to continue</p>
      </div>
      <div className="absolute bottom-5 left-5 flex items-center gap-2 text-[7px] uppercase tracking-[.2em] text-muted-foreground md:bottom-12 md:left-12"><span className="h-1.5 w-1.5 bg-primary shadow-[0_0_12px_var(--primary)]" />System ready</div>
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
      <DriftingNotes />
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
        <div className="chart-orbit absolute left-1/2 top-1/2 flex items-center justify-center transition-transform duration-100" style={{ transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})` }}>
        <div className="crest-rotate absolute h-72 w-72 rounded-full border border-dashed border-primary/30 md:h-96 md:w-96" />
        <div className="crest-rotate-reverse absolute h-60 w-60 rounded-full border border-primary/15 md:h-80 md:w-80">
          {[0, 90, 180, 270].map((angle) => (
            <span key={angle} className="absolute left-1/2 top-1/2 h-1.5 w-1.5 rotate-45 border border-primary/70 bg-background" style={{ transform: `rotate(${angle}deg) translateY(-50%) translate(0, -7.5rem)` }} />
          ))}
        </div>
        <div className="absolute h-52 w-52 rounded-full border border-primary/25 md:h-72 md:w-72" />
        <Crown className="crest-float absolute -top-36 h-8 w-8 text-primary/70 md:-top-48" />
        <Leaf className="crest-float absolute -left-36 h-9 w-9 -rotate-45 text-primary/55 md:-left-48" />
        <Leaf className="crest-float absolute -right-36 h-9 w-9 rotate-45 scale-x-[-1] text-primary/55 md:-right-48" />
        <Diamond className="crest-float absolute -bottom-36 h-5 w-5 rotate-45 text-primary/60 md:-bottom-48" />
        <button onPointerDown={(event) => event.stopPropagation()} onClick={() => { tone(330, .18, .025); setProfileOpen((open) => !open); }} className="group relative z-10 grid h-36 w-36 place-items-center rounded-full border border-primary/70 bg-card shadow-[0_0_70px_color-mix(in_oklab,var(--primary)_22%,transparent)] transition duration-500 hover:scale-105 md:h-44 md:w-44">
          <span className="absolute inset-2 rounded-full border border-primary/25 animate-[pulse-ring_3s_ease-in-out_infinite]" />
          <span className="absolute inset-[-0.6rem] rounded-full border border-primary/15" />
          <span className="absolute left-1/2 top-2 h-3 w-px -translate-x-1/2 bg-primary/60" />
          <span className="absolute bottom-2 left-1/2 h-3 w-px -translate-x-1/2 bg-primary/60" />
          <span className="absolute left-2 top-1/2 h-px w-3 -translate-y-1/2 bg-primary/60" />
          <span className="absolute right-2 top-1/2 h-px w-3 -translate-y-1/2 bg-primary/60" />
          <span className="px-4 text-center">
            <span className="block text-[7px] uppercase tracking-[.42em] text-primary">Central file</span>
            <span className="mx-auto my-2 block h-px w-10 bg-primary/50" />
            <span className="elias-signature block font-display text-2xl italic leading-tight text-brass-soft md:text-3xl"><span className="text-4xl not-italic md:text-5xl">E</span>lias<br /><span className="text-4xl not-italic md:text-5xl">A</span>rcher</span>
            <span className="mx-auto mt-2 block h-px w-6 bg-primary/40" />
          </span>
        </button>
        </div>
        {profileOpen && <ProfilePanel onClose={() => setProfileOpen(false)} onExpand={() => { tone(420, .16, .02); setViewerOpen(true); }} />}
      </div>
      <RelationshipLegend />
      <LikeMeter tone={tone} />
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
             <span className="legend-swatch w-8 shrink-0" />
            <span>{type}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfilePanel({ onClose, onExpand }: { onClose: () => void; onExpand: () => void }) {
  const [leaving, setLeaving] = useState(false);
  const closeAnimated = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onClose, 240);
  };
  return (
    <div onPointerDown={(event) => event.stopPropagation()} className={`profile-popover absolute z-[60] ${leaving ? "profile-popover-out" : "profile-popover-in"}`} role="dialog" aria-label="Elias Archer profile">
      <div className="max-h-[calc(42vh-1rem)] overflow-y-auto border border-border bg-card/95 p-3 shadow-xl backdrop-blur-xl md:max-h-[25rem]">
        <div className="flex items-center justify-between"><p className="text-[8px] uppercase tracking-[.3em] text-primary">Central profile</p><Button variant="ghost" size="icon" onClick={(event) => { event.stopPropagation(); closeAnimated(); }} aria-label="Close profile" className="h-8 w-8"><X /></Button></div>
        <p className="mt-2 text-[10px] leading-5 text-muted-foreground">Elias Archer</p>
        <button onClick={(event) => { event.stopPropagation(); onExpand(); }} className="group relative mt-2 flex h-28 w-full items-end justify-center overflow-hidden border border-border bg-background/50 md:h-32">
          <img src={eliasRose} alt="Elias Archer holding a rose" className="h-full w-full object-contain transition duration-700 group-hover:scale-[1.025]" />
          <span className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center border border-border bg-background/70 text-primary backdrop-blur-md"><Maximize2 className="h-4 w-4" /></span>
        </button>
        <blockquote className="mt-3 border-l border-primary pl-3 font-display text-xs leading-snug md:text-sm">“This is me, what the fuck do you want me to add onto that”</blockquote>
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
          <div className="absolute inset-0 transition-[transform,filter] duration-700 ease-[cubic-bezier(.16,1,.3,1)]" style={{ transform: selected ? `translate(${(50 - selected.x) * .38}%, ${(50 - selected.y) * .38}%) scale(1.38)` : "translate(0, 0) scale(1)", filter: selected ? "contrast(1.04) brightness(1.03)" : undefined }}>
            <img src={eliasBowing} alt="Elias Archer bowing in his black school uniform and prefect armband" className="h-full w-full object-contain drop-shadow-[0_28px_45px_color-mix(in_oklab,var(--ink)_80%,transparent)]" />
            {appearanceFeatures.map((feature) => (
              <button key={feature.id} aria-label={`View ${feature.label} details`} onClick={() => { tone(520, .08, .02); setActive(feature.id); }} className={`group absolute z-20 h-8 w-8 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 ${active && active !== feature.id ? "opacity-20" : "opacity-100"}`} style={{ left: `${feature.x}%`, top: `${feature.y}%` }}>
                <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-primary bg-background transition group-hover:scale-150" />
                <span className={`hotspot-line absolute top-1/2 h-px w-12 bg-primary/60 ${feature.side === "left" ? "right-1/2 origin-right" : "left-1/2"}`} />
              </button>
            ))}
          </div>
        </div>
        <aside className="order-3 min-h-40 border-t border-border pt-6 lg:border-r lg:border-t-0 lg:pr-5 lg:pt-8">
          <p className="text-[8px] uppercase tracking-[.3em] text-muted-foreground">Selected detail</p>
          {selected ? <div key={selected.id} className="feature-swift mt-8"><p className="font-display text-3xl text-brass-soft">{selected.label}</p><p className="mt-4 max-w-xs text-sm leading-7 text-foreground/75">{selected.detail}</p></div> : <p className="mt-8 max-w-xs text-xs leading-6 text-muted-foreground">Select one of the fine markers around the visual record.</p>}
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