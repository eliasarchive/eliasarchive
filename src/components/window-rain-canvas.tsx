import { useEffect, useRef } from "react";

type OutsideDrop = {
  x: number;
  y: number;
  speed: number;
  length: number;
  alpha: number;
  width: number;
  drift: number;
  depth: number;
};

type Point = { x: number; y: number };
type GlassDrop = {
  x: number;
  y: number;
  width: number;
  height: number;
  lean: number;
  speed: number;
  delay: number;
  phase: number;
  trail: Point[];
};

const SOURCE_WIDTH = 2692;
const SOURCE_HEIGHT = 1408;
const PANE = { x0: 1086, y0: 45, x1: 1606, y1: 957 };

type Layer = "rain" | "droplets";

export function WindowRainCanvas({ maskSrc, className = "", layer = "rain", zIndex }: { maskSrc: string; className?: string; layer?: Layer; zIndex?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let frame = 0;
    let previous = performance.now();
    let box = { left: 0, top: 0, w: 0, h: 0, scale: 1 };
    let frameRect = { left: 0, top: 0, w: 0, h: 0 };
    let rain: OutsideDrop[] = [];
    let beads: GlassDrop[] = [];
    let maskReady = false;

    const paneMask = new Image();
    paneMask.decoding = "async";
    paneMask.onload = () => { maskReady = true; };
    paneMask.src = maskSrc;

    const randomX = () => box.left + Math.random() * box.w;
    const makeRain = (initial: boolean): OutsideDrop => {
      const depth = Math.random();
      const scale = box.scale * 2;
      return {
        x: randomX() + box.h * 0.08,
        y: initial ? box.top + Math.random() * box.h : box.top - Math.random() * box.h * 0.25,
        speed: (220 + depth * 580) * scale,
        length: (2.5 + depth * 8 + Math.random() * 5) * scale,
        alpha: 0.035 + depth * 0.12,
        width: (0.45 + depth * 0.9) * scale,
        drift: -0.055 - Math.random() * 0.035,
        depth,
      };
    };

    const makeBead = (initial: boolean): GlassDrop => {
      const scale = box.scale * 2;
      const large = Math.random() < 0.2;
      const beadWidth = (large ? 2.4 + Math.random() * 3.5 : 0.55 + Math.random() * 1.7) * scale;
      return {
        x: randomX(),
        y: initial ? box.top + Math.random() * box.h : box.top - 12 * scale,
        width: beadWidth,
        height: beadWidth * (1.15 + Math.random() * 1.25),
        lean: (Math.random() - 0.5) * 0.42,
        speed: large && Math.random() < 0.42 ? (2.5 + Math.random() * 7) * scale : 0,
        delay: 1.5 + Math.random() * 14,
        phase: Math.random() * Math.PI * 2,
        trail: [],
      };
    };

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const scale = Math.max(width / SOURCE_WIDTH, height / SOURCE_HEIGHT);
      const renderedWidth = SOURCE_WIDTH * scale;
      const renderedHeight = SOURCE_HEIGHT * scale;
      frameRect = { left: (width - renderedWidth) / 2, top: (height - renderedHeight) / 2, w: renderedWidth, h: renderedHeight };
      box = {
        left: frameRect.left + PANE.x0 * scale,
        top: frameRect.top + PANE.y0 * scale,
        w: (PANE.x1 - PANE.x0) * scale,
        h: (PANE.y1 - PANE.y0) * scale,
        scale,
      };
      const area = box.w * box.h;
      if (layer === "rain") rain = Array.from({ length: Math.max(260, Math.round(area / 360)) }, () => makeRain(true));
      else beads = Array.from({ length: Math.max(65, Math.round(area / 2100)) }, () => makeBead(true));
    };

    const drawOutsideRain = (dt: number, time: number) => {
      const haze = context.createLinearGradient(box.left, box.top, box.left, box.top + box.h);
      haze.addColorStop(0, "rgba(139,157,166,0.055)");
      haze.addColorStop(0.55, "rgba(174,188,194,0.025)");
      haze.addColorStop(1, "rgba(116,133,141,0.07)");
      context.fillStyle = haze;
      context.fillRect(box.left, box.top, box.w, box.h);

      context.save();
      context.lineCap = "round";
      rain.forEach((drop, index) => {
        drop.y += drop.speed * dt;
        drop.x += drop.speed * drop.drift * dt;
        const sway = Math.sin(time * 0.00035 + index * 1.71) * box.scale * (1.2 - drop.depth);
        context.strokeStyle = `rgba(202,216,221,${drop.alpha})`;
        context.lineWidth = drop.width;
        context.beginPath();
        context.moveTo(drop.x - drop.drift * drop.length + sway, drop.y - drop.length);
        context.quadraticCurveTo(drop.x + sway * 0.35, drop.y - drop.length * 0.48, drop.x, drop.y);
        context.stroke();
        if (drop.y - drop.length > box.top + box.h || drop.x < box.left - 30) rain[index] = makeRain(false);
      });
      context.restore();
    };

    const organicDropPath = (drop: GlassDrop) => {
      const x = drop.x;
      const y = drop.y;
      const w = drop.width;
      const h = drop.height;
      context.beginPath();
      context.moveTo(x, y - h * 0.58);
      context.bezierCurveTo(x + w * (0.42 + drop.lean), y - h * 0.44, x + w * 0.65, y + h * 0.08, x + w * 0.28, y + h * 0.48);
      context.bezierCurveTo(x - w * 0.08, y + h * 0.68, x - w * (0.72 - drop.lean), y + h * 0.27, x - w * 0.48, y - h * 0.18);
      context.bezierCurveTo(x - w * 0.31, y - h * 0.46, x - w * 0.12, y - h * 0.55, x, y - h * 0.58);
      context.closePath();
    };

    const drawGlassDrop = (drop: GlassDrop) => {
      const gradient = context.createLinearGradient(drop.x - drop.width, drop.y - drop.height, drop.x + drop.width, drop.y + drop.height);
      gradient.addColorStop(0, "rgba(235,243,245,0.38)");
      gradient.addColorStop(0.2, "rgba(206,222,228,0.08)");
      gradient.addColorStop(0.7, "rgba(55,73,81,0.16)");
      gradient.addColorStop(1, "rgba(219,232,236,0.24)");
      organicDropPath(drop);
      context.fillStyle = gradient;
      context.fill();
      context.strokeStyle = "rgba(224,235,238,0.2)";
      context.lineWidth = Math.max(0.35, drop.width * 0.11);
      context.stroke();

      context.beginPath();
      context.moveTo(drop.x - drop.width * 0.28, drop.y - drop.height * 0.31);
      context.quadraticCurveTo(drop.x - drop.width * 0.1, drop.y - drop.height * 0.46, drop.x + drop.width * 0.08, drop.y - drop.height * 0.34);
      context.strokeStyle = "rgba(248,252,252,0.42)";
      context.lineWidth = Math.max(0.4, drop.width * 0.13);
      context.stroke();
    };

    const drawGlassWater = (dt: number, time: number) => {
      const scale = box.scale * 2;
      beads.forEach((drop, index) => {
        drop.delay -= dt;
        if (drop.delay <= 0 && drop.speed > 0) {
          drop.y += drop.speed * dt;
          drop.x += Math.sin(time * 0.001 + drop.phase) * 0.11 * scale;
          drop.speed = Math.min(drop.speed + 2.2 * scale * dt, 15 * scale);
          const last = drop.trail[drop.trail.length - 1];
          if (!last || Math.hypot(last.x - drop.x, last.y - drop.y) > 1.8 * scale) drop.trail.push({ x: drop.x, y: drop.y });
          if (drop.trail.length > 42) drop.trail.shift();
          if (Math.random() < dt * 0.35) drop.delay = 0.3 + Math.random() * 1.5;
        }

        if (drop.trail.length > 1) {
          context.beginPath();
          context.moveTo(drop.trail[0]?.x ?? drop.x, drop.trail[0]?.y ?? drop.y);
          for (let point = 1; point < drop.trail.length; point += 1) {
            const current = drop.trail[point];
            const next = drop.trail[point + 1] ?? current;
            if (current && next) context.quadraticCurveTo(current.x, current.y, (current.x + next.x) / 2, (current.y + next.y) / 2);
          }
          context.strokeStyle = "rgba(198,216,222,0.13)";
          context.lineWidth = Math.max(0.5, drop.width * 0.32);
          context.lineCap = "round";
          context.stroke();
        }

        drawGlassDrop(drop);
        if (drop.y > box.top + box.h + drop.height) beads[index] = makeBead(false);
      });

      if (Math.random() < dt * 1.8 && beads.length > 0) beads[Math.floor(Math.random() * beads.length)] = makeBead(false);
    };

    const draw = (time: number) => {
      const dt = Math.min(0.04, (time - previous) / 1000);
      previous = time;
      context.globalCompositeOperation = "source-over";
      context.clearRect(0, 0, width, height);
      if (maskReady) {
        if (layer === "rain") drawOutsideRain(dt, time);
        else drawGlassWater(dt, time);
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

  return <canvas ref={canvasRef} className={`window-rain-canvas window-rain-${layer} ${className}`} style={zIndex !== undefined ? { zIndex } : undefined} aria-hidden="true" />;
}