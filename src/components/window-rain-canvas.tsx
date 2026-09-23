import { useEffect, useRef } from "react";

type WindowDrop = { x: number; y: number; speed: number; length: number; alpha: number };

const SOURCE_WIDTH = 2692;
const SOURCE_HEIGHT = 1408;

function makeDrop(width: number, height: number, initial = false): WindowDrop {
  return {
    x: Math.random() * width,
    y: initial ? Math.random() * height : -30 - Math.random() * 100,
    speed: 210 + Math.random() * 310,
    length: 8 + Math.random() * 18,
    alpha: 0.16 + Math.random() * 0.2,
  };
}

export function WindowRainCanvas({ maskSrc, className = "" }: { maskSrc: string; className?: string }) {
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
    let drops: WindowDrop[] = [];
    let maskReady = false;
    const paneMask = new Image();
    paneMask.decoding = "async";
    paneMask.onload = () => { maskReady = true; };
    paneMask.src = maskSrc;
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drops = Array.from({ length: Math.max(90, Math.round(width * height / 6800)) }, () => makeDrop(width, height, true));
    };
    const draw = (time: number) => {
      const delta = Math.min(0.04, (time - previous) / 1000);
      previous = time;
      context.clearRect(0, 0, width, height);
      context.lineCap = "round";
      drops.forEach((drop, index) => {
        drop.y += drop.speed * delta;
        const tailY = drop.y - drop.length;
        context.beginPath();
        context.moveTo(drop.x - 1.1, tailY);
        context.lineTo(drop.x, drop.y);
        context.strokeStyle = `rgba(205, 220, 228, ${drop.alpha})`;
        context.shadowColor = "rgba(192, 211, 220, 0.2)";
        context.shadowBlur = 1.5;
        context.lineWidth = 0.9;
        context.stroke();
        context.shadowBlur = 0;
        if (drop.y > height) drops[index] = makeDrop(width, height);
      });
      if (maskReady) {
        const scale = Math.max(width / SOURCE_WIDTH, height / SOURCE_HEIGHT);
        const renderedWidth = SOURCE_WIDTH * scale;
        const renderedHeight = SOURCE_HEIGHT * scale;
        const left = (width - renderedWidth) / 2;
        const top = (height - renderedHeight) / 2;
        context.globalCompositeOperation = "destination-in";
        context.drawImage(paneMask, left, top, renderedWidth, renderedHeight);
        context.globalCompositeOperation = "source-over";
      } else {
        context.clearRect(0, 0, width, height);
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
  }, [maskSrc]);
  return <canvas ref={canvasRef} className={`window-rain-canvas ${className}`} aria-hidden="true" />;
}