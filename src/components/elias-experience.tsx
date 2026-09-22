import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Maximize2, Volume2, VolumeX, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { appearanceFeatures, elias, relationshipTypes, type ArchiveSection } from "@/lib/elias-data";
import manorEntrance from "@/assets/manor-entrance.jpg";
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

  useEffect(() => {
    if (!enabled && gainRef.current && contextRef.current) {
      gainRef.current.gain.setTargetAtTime(0.0001, contextRef.current.currentTime, 0.08);
    } else if (enabled && gainRef.current && contextRef.current) {
      gainRef.current.gain.setTargetAtTime(0.008, contextRef.current.currentTime, 0.1);
    }
  }, [enabled]);

  return { tone, beginAmbience };
}

export function EliasExperience() {
  const [stage, setStage] = useState<ExperienceStage>("manor");
  const [scene, setScene] = useState(0);
  const [muted, setMuted] = useState(false);
  const [section, setSection] = useState<ArchiveSection>("relationships");
  const { tone, beginAmbience } = useSound(!muted);

  const advanceManor = () => {
    beginAmbience();
    tone(scene === 0 ? 105 : 145, 0.22, 0.02);
    if (scene < manorScenes.length - 1) setScene((current) => current + 1);
    else setStage("desk");
  };

  const enterComputer = () => {
    tone(240, 0.5, 0.04);
    setStage("welcome");
  };

  return (
    <main className="min-h-dvh bg-background text-foreground selection:bg-primary/30">
      <SoundControl muted={muted} onToggle={() => setMuted((value) => !value)} />
      {stage === "manor" && <ManorSequence scene={scene} onAdvance={advanceManor} onSkip={() => setStage("desk")} />}
      {stage === "desk" && <DeskScene onEnter={enterComputer} />}
      {stage === "welcome" && <WelcomeScreen onEnter={() => { tone(360, .45, .035); setStage("archive"); }} />}
      {stage === "archive" && (
        <Archive section={section} onSection={(next) => { tone(220, .12, .018); setSection(next); }} tone={tone} />
      )}
    </main>
  );
}

function SoundControl({ muted, onToggle }: { muted: boolean; onToggle: () => void }) {
  return (
    <Button aria-label={muted ? "Unmute sound" : "Mute sound"} title={muted ? "Unmute sound" : "Mute sound"} onClick={onToggle} variant="ghost" size="icon" className="fixed bottom-4 right-4 z-40 border border-border bg-background/60 text-primary backdrop-blur-md hover:bg-card md:bottom-auto md:top-4">
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
        <img src={current.image} alt="A dark, elegant manor interior" width={1536} height={864} className="cinematic-image h-full w-full object-cover" />
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

function DeskScene({ onEnter }: { onEnter: () => void }) {
  return (
    <section className="grain relative h-dvh overflow-hidden bg-ink">
      <img src={eliasBedroom} alt="A refined bedroom with a garden-facing desk" width={1536} height={864} className="h-full w-full object-cover animate-[slow-drift_10s_ease-in-out_both]" />
      <div className="vignette absolute inset-0 bg-background/10" />
      <div className="absolute left-[8%] top-[13%] hidden max-w-52 border-l border-primary/40 pl-4 md:block">
        <p className="font-display text-xl text-primary-foreground/80">Private room</p>
        <p className="mt-1 text-[9px] uppercase tracking-[.25em] text-muted-foreground">Garden wing</p>
      </div>
      <button aria-label="Enter Elias Archer's computer" onClick={onEnter} className="group absolute right-[4%] top-[33%] h-[25%] w-[16%] cursor-pointer border border-primary/0 transition-all duration-700 hover:border-primary/40 focus-visible:border-primary md:right-[3%] md:top-[35%]">
        <span className="absolute inset-[-10%] border border-primary/30 opacity-40 transition-all duration-700 group-hover:inset-[-16%] group-hover:opacity-100" />
        <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] uppercase tracking-[.3em] text-primary opacity-70 group-hover:opacity-100">Access terminal</span>
      </button>
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
    <button onClick={onEnter} onPointerMove={(event) => setPosition({ x: event.clientX / window.innerWidth - .5, y: event.clientY / window.innerHeight - .5 })} className="grain relative flex h-dvh w-full cursor-pointer items-center justify-center overflow-hidden bg-ink text-center">
      <div className="archive-grid absolute inset-0 opacity-30" style={{ transform: `translate(${position.x * -10}px, ${position.y * -10}px)` }} />
      <div className="absolute inset-[6%] border border-border/60" />
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
    <section className="archive-grid grain relative min-h-dvh overflow-hidden bg-background">
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
      <div className="relative z-30">
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
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && (viewerOpen ? setViewerOpen(false) : setProfileOpen(false));
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [viewerOpen]);

  return (
    <div className="min-h-[calc(100dvh-5rem)] px-5 py-8 md:px-10">
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-8">
        <div><p className="text-[9px] uppercase tracking-[.35em] text-primary">Network index</p><h2 className="mt-2 font-display text-4xl md:text-6xl">Relationship Chart</h2></div>
        <p className="hidden max-w-xs text-right text-xs leading-6 text-muted-foreground md:block">Archive structure ready. No relationships are recorded.</p>
      </div>
      <div className="relative mx-auto flex h-[40vh] min-h-80 max-w-5xl items-center justify-center">
        <div className="absolute h-72 w-72 rounded-full border border-border/40 md:h-96 md:w-96" />
        <div className="absolute h-52 w-52 rounded-full border border-dashed border-primary/25 md:h-72 md:w-72" />
        <button onMouseEnter={() => tone(275, .08, .012)} onClick={() => { tone(330, .18, .025); setProfileOpen(true); }} className="group relative z-10 grid h-36 w-36 place-items-center rounded-full border border-primary/70 bg-card shadow-[0_0_60px_color-mix(in_oklab,var(--primary)_15%,transparent)] transition duration-500 hover:scale-105 hover:shadow-[0_0_90px_color-mix(in_oklab,var(--primary)_28%,transparent)] md:h-44 md:w-44">
          <span className="absolute inset-2 rounded-full border border-primary/20 animate-[pulse-ring_3s_ease-in-out_infinite]" />
          <span><span className="block text-[8px] uppercase tracking-[.3em] text-primary">Central file</span><span className="mt-2 block font-display text-2xl">Elias Archer</span></span>
        </button>
      </div>
      <RelationshipLegend />
      {profileOpen && <ProfilePanel onClose={() => setProfileOpen(false)} onExpand={() => { tone(420, .16, .02); setViewerOpen(true); }} />}
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
          <div key={type} className="flex items-center gap-3 text-[9px] text-muted-foreground">
            <span className={`relationship-line w-8 shrink-0 ${index % 3 === 0 ? "text-primary" : index % 3 === 1 ? "text-accent-foreground" : "text-muted-foreground"}`} style={{ opacity: .45 + (index % 4) * .14 }} />
            <span>{type}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProfilePanel({ onClose, onExpand }: { onClose: () => void; onExpand: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-background/55 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Elias Archer profile">
      <div className="animate-in slide-in-from-right h-full w-full max-w-xl border-l border-border bg-card p-6 shadow-2xl duration-500 md:p-10">
        <div className="flex items-center justify-between"><p className="text-[9px] uppercase tracking-[.35em] text-primary">Central profile</p><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close profile"><X /></Button></div>
        <button onClick={onExpand} className="group relative mt-8 flex h-[58vh] w-full items-end justify-center overflow-hidden border border-border bg-background/50">
          <img src={eliasRose} alt="Elias Archer holding a rose" className="h-full w-full object-contain transition duration-700 group-hover:scale-[1.025]" />
          <span className="absolute bottom-4 right-4 grid h-10 w-10 place-items-center border border-border bg-background/70 text-primary backdrop-blur-md"><Maximize2 className="h-4 w-4" /></span>
        </button>
        <blockquote className="mt-7 border-l border-primary pl-5 font-display text-2xl leading-tight">“This is me, what the fuck do you want me to add onto that”</blockquote>
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
        <div className="appearance-enter relative order-1 mx-auto h-[65vh] min-h-[520px] w-full max-w-xl lg:order-2">
          <div className="absolute inset-x-[12%] bottom-0 top-[5%] bg-gradient-to-t from-forest/40 via-transparent to-transparent" />
          <img src={eliasBowing} alt="Elias Archer bowing in his black school uniform and prefect armband" className="h-full w-full object-contain drop-shadow-[0_28px_45px_color-mix(in_oklab,var(--ink)_80%,transparent)]" />
          {appearanceFeatures.map((feature) => (
            <button key={feature.id} aria-label={`View ${feature.label} details`} onFocus={() => setActive(feature.id)} onMouseEnter={() => { tone(300, .06, .008); setActive(feature.id); }} onMouseLeave={() => setActive((value) => value === feature.id ? null : value)} onClick={() => setActive(feature.id)} className="group absolute z-20 h-6 w-6 -translate-x-1/2 -translate-y-1/2" style={{ left: `${feature.x}%`, top: `${feature.y}%` }}>
              <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border border-primary bg-background transition group-hover:scale-150" />
              <span className={`hotspot-line absolute top-1/2 h-px w-12 bg-primary/60 ${feature.side === "left" ? "right-1/2 origin-right" : "left-1/2"}`} />
            </button>
          ))}
        </div>
        <aside className="order-3 min-h-40 border-t border-border pt-6 lg:border-r lg:border-t-0 lg:pr-5 lg:pt-8">
          <p className="text-[8px] uppercase tracking-[.3em] text-muted-foreground">Selected detail</p>
          {selected ? <div className="animate-in fade-in mt-8 duration-300"><p className="font-display text-3xl text-brass-soft">{selected.label}</p><p className="mt-4 max-w-xs text-sm leading-7 text-foreground/75">{selected.detail}</p></div> : <p className="mt-8 max-w-xs text-xs leading-6 text-muted-foreground">Select one of the fine markers around the visual record.</p>}
          <div className="mt-10 grid grid-cols-2 gap-2 lg:grid-cols-1">{appearanceFeatures.map((feature) => <Button key={feature.id} variant="ghost" onClick={() => setActive(feature.id)} className={`h-auto justify-start rounded-none border-l px-3 py-2 text-left text-[9px] uppercase tracking-[.16em] ${active === feature.id ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>{feature.label}</Button>)}</div>
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