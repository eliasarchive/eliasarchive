import { useEffect, useRef } from "react";

type WindowDrop = { x: number; y: number; speed: number; length: number; alpha: number };

const SOURCE_WIDTH = 2692;
const SOURCE_HEIGHT = 1408;

function sourcePoint(x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / SOURCE_WIDTH, height / SOURCE_HEIGHT);
  return {
    x: (x - (width - SOURCE_WIDTH * scale) / 2) / (SOURCE_WIDTH * scale),
    y: (y - (height - SOURCE_HEIGHT * scale) / 2) / (SOURCE_HEIGHT * scale),
  };
}

function isVisibleGlass(x: number, y: number, width: number, height: number) {
  const point = sourcePoint(x, y, width, height);
  const withinWindow = point.x >= 0.255 && point.x <= 0.748 && point.y >= 0.025 && point.y <= 0.68;
  const behindChair = point.x >= 0.39 && point.x <= 0.61 && point.y >= 0.49;
  const behindDesk = point.y >= 0.69;
  return withinWindow && !behindChair && !behindDesk;
}

function makeDrop(width: number, height: number, initial = false): WindowDrop {
  return {
    x: Math.random() * width,
    y: initial ? Math.random() * height : -30 - Math.random() * 100,
    speed: 230 + Math.random() * 310,
    length: 7 + Math.random() * 15,
    alpha: 0.07 + Math.random() * 0.12,
  };
}

export function WindowRainCanvas() {
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
    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drops = Array.from({ length: Math.max(45, Math.round(width * height / 12500)) }, () => makeDrop(width, height, true));
    };
    const draw = (time: number) => {
      const delta = Math.min(0.04, (time - previous) / 1000);
      previous = time;
      context.clearRect(0, 0, width, height);
      context.lineCap = "round";
      drops.forEach((drop, index) => {
        drop.y += drop.speed * delta;
        const tailY = drop.y - drop.length;
        if (isVisibleGlass(drop.x, drop.y, width, height) && isVisibleGlass(drop.x, tailY, width, height)) {
          context.beginPath();
          context.moveTo(drop.x - 1.8, tailY);
          context.lineTo(drop.x, drop.y);
          context.strokeStyle = `rgba(205, 220, 226, ${drop.alpha})`;
          context.lineWidth = 0.65;
          context.stroke();
        }
        if (drop.y > height) drops[index] = makeDrop(width, height);
      });
      frame = window.requestAnimationFrame(draw);
    };
    resize();
    window.addEventListener("resize", resize);
    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);
  return <canvas ref={canvasRef} className="window-rain-canvas" aria-hidden="true" />;
}