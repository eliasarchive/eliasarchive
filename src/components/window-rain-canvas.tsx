import { useEffect, useRef } from "react";

type RainDrop = { x: number; y: number; speed: number; length: number; alpha: number; width: number; slant: number };
type GlassDrop = { x: number; y: number; r: number; vy: number; hold: number; trail: { x: number; y: number }[] };

const SOURCE_WIDTH = 2692;
const SOURCE_HEIGHT = 1408;
// Bounding box of the central window glass in source pixels (from the pane mask).
const PANE = { x0: 1086, y0: 45, x1: 1606, y1: 957 };

type Layer = "rain" | "droplets";

export function WindowRainCanvas({ maskSrc, className = "", layer = "rain", zIndex }: { maskSrc: string; className?: string; layer?: Layer; zIndex?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    let width = 0, height = 0, frame = 0, previous = performance.now();
    let box = { left: 0, top: 0, w: 0, h: 0, scale: 1 };
    let frameRect = { left: 0, top: 0, w: 0, h: 0 };
    let rain: RainDrop[] = [];
    let beads: GlassDrop[] = [];
    let maskReady = false;
    const paneMask = new Image();
    paneMask.decoding = "async";
    paneMask.onload = () => { maskReady = true; };
    paneMask.src = maskSrc;

    const rx = () => box.left + Math.random() * box.w;
    const makeRain = (initial: boolean): RainDrop => {
      const depth = Math.random(); // 0 far, 1 near
      const s = box.scale * 2;
      return {
        x: rx() + box.h * 0.12,
        y: initial ? box.top + Math.random() * box.h : box.top - Math.random() * box.h * 0.3,
        speed: (700 + depth * 1300) * s,
        length: (8 + depth * 26 + Math.random() * 10) * s,
        alpha: 0.14 + depth * 0.42,
        width: (0.5 + depth * 1.1) * s,
        slant: -0.16 - Math.random() * 0.06,
      };
    };
    const makeBead = (initial: boolean): GlassDrop => {
      const s = box.scale * 2;
      const big = Math.random() < 0.18;
      return {
        x: rx(),
        y: initial ? box.top + Math.random() * box.h : box.top + Math.random() * box.h * 0.5,
        r: (big ? 2.6 + Math.random() * 2.4 : 0.7 + Math.random() * 1.6) * s,
        vy: 0,
        hold: big ? Math.random() * 4 : 999,
        trail: [],
      };
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width; height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const scale = Math.max(width / SOURCE_WIDTH, height / SOURCE_HEIGHT);
      const rw = SOURCE_WIDTH * scale, rh = SOURCE_HEIGHT * scale;
      frameRect = { left: (width - rw) / 2, top: (height - rh) / 2, w: rw, h: rh };
      box = {
        left: frameRect.left + PANE.x0 * scale,
        top: frameRect.top + PANE.y0 * scale,
        w: (PANE.x1 - PANE.x0) * scale,
        h: (PANE.y1 - PANE.y0) * scale,
        scale,
      };
      const area = box.w * box.h;
      if (layer === "rain") rain = Array.from({ length: Math.max(180, Math.round(area / 520)) }, () => makeRain(true));
      else beads = Array.from({ length: Math.max(90, Math.round(area / 1400)) }, () => makeBead(true));
    };

    const drawRain = (dt: number) => {
      // faint distant haze so the outside reads as a rain curtain
      context.fillStyle = "rgba(170, 190, 200, 0.05)";
      context.fillRect(box.left, box.top, box.w, box.h);
      context.lineCap = "round";
      rain.forEach((d, i) => {
        d.y += d.speed * dt;
        d.x += d.speed * d.slant * dt;
        const grad = context.createLinearGradient(d.x, d.y - d.length, d.x, d.y);
        grad.addColorStop(0, "rgba(215,228,235,0)");
        grad.addColorStop(1, `rgba(225,236,242,${d.alpha})`);
        context.strokeStyle = grad;
        context.lineWidth = d.width;
        context.beginPath();
        context.moveTo(d.x - d.slant * d.length, d.y - d.length);
        context.lineTo(d.x, d.y);
        context.stroke();
        if (d.y - d.length > box.top + box.h || d.x < box.left - 40) rain[i] = makeRain(false);
      });
    };

    const drawBead = (x: number, y: number, r: number) => {
      const g = context.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r);
      g.addColorStop(0, "rgba(255,255,255,0.55)");
      g.addColorStop(0.35, "rgba(200,215,222,0.12)");
      g.addColorStop(0.85, "rgba(30,40,45,0.22)");
      g.addColorStop(1, "rgba(220,232,238,0.3)");
      context.fillStyle = g;
      context.beginPath();
      context.ellipse(x, y, r, r * 1.12, 0, 0, Math.PI * 2);
      context.fill();
    };

    const drawDroplets = (dt: number) => {
      const s = box.scale * 2;
      for (let i = 0; i < beads.length; i += 1) {
        const b = beads[i]!;
        b.hold -= dt;
        if (b.hold <= 0) {
          b.vy = Math.min(b.vy + 40 * s * dt, (18 + b.r * 9) * s * (0.6 + Math.random() * 0.8));
          b.y += b.vy * dt;
          b.x += (Math.random() - 0.5) * 6 * s * dt;
          const last = b.trail[b.trail.length - 1];
          if (!last || Math.hypot(last.x - b.x, last.y - b.y) > 2 * s) b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > 60) b.trail.shift();
          // merge with beads in its path
          for (let j = 0; j < beads.length; j += 1) {
            const o = beads[j]!;
            if (j === i || o.hold <= 0) continue;
            if (Math.abs(o.x - b.x) < b.r + o.r && Math.abs(o.y - b.y) < b.r + o.r) {
              b.r = Math.min(6 * s, Math.sqrt(b.r * b.r + o.r * o.r));
              beads[j] = makeBead(false);
            }
          }
          if (Math.random() < dt * 0.6) b.hold = 0.3 + Math.random() * 1.2; // stick briefly
          if (b.y > box.top + box.h + 10) { beads[i] = makeBead(false); continue; }
        } else if (b.r > 2.4 * s && b.hold > 900) {
          b.hold = Math.random() * 6;
        }
        if (b.trail.length > 1) {
          context.strokeStyle = "rgba(210,225,232,0.18)";
          context.lineWidth = b.r * 0.7;
          context.lineCap = "round";
          context.beginPath();
          context.moveTo(b.trail[0]!.x, b.trail[0]!.y);
          b.trail.forEach((p) => context.lineTo(p.x, p.y));
          context.stroke();
        }
        drawBead(b.x, b.y, b.r);
      }
      if (Math.random() < dt * 8) beads[Math.floor(Math.random() * beads.length)] = makeBead(false);
    };

    const draw = (time: number) => {
      const dt = Math.min(0.04, (time - previous) / 1000);
      previous = time;
      context.globalCompositeOperation = "source-over";
      context.clearRect(0, 0, width, height);
      if (maskReady) {
        if (layer === "rain") drawRain(dt); else drawDroplets(dt);
        context.globalCompositeOperation = "destination-in";
        context.drawImage(paneMask, frameRect.left, frameRect.top, frameRect.w, frameRect.h);
        context.globalCompositeOperation = "source-over";
      }
      frame = window.requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize);
    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [maskSrc, layer]);
  return <canvas ref={canvasRef} className={`window-rain-canvas ${className}`} style={zIndex !== undefined ? { zIndex } : undefined} aria-hidden="true" />;
}
