import { useEffect, useRef } from "react";

type Drop = {
  x: number;
  y: number;
  length: number;
  speed: number;
  drift: number;
  alpha: number;
  width: number;
};

type Impact = {
  x: number;
  y: number;
  age: number;
  life: number;
  size: number;
  kind: "ripple" | "splash";
};

const SOURCE_WIDTH = 1200;
const SOURCE_HEIGHT = 600;

function imageCoordinates(x: number, y: number, width: number, height: number) {
  const scale = Math.max(width / SOURCE_WIDTH, height / SOURCE_HEIGHT);
  const renderedWidth = SOURCE_WIDTH * scale;
  const renderedHeight = SOURCE_HEIGHT * scale;
  return {
    x: (x - (width - renderedWidth) / 2) / renderedWidth,
    y: (y - (height - renderedHeight) / 2) / renderedHeight,
  };
}

function isDriveway(x: number, y: number, width: number, height: number) {
  const point = imageCoordinates(x, y, width, height);
  if (point.y < 0.625 || point.y > 1.02) return false;
  const depth = Math.min(1, Math.max(0, (point.y - 0.625) / 0.375));
  const halfWidth = 0.075 + depth * 0.44;
  const center = 0.5 + depth * 0.006;
  return point.x > center - halfWidth && point.x < center + halfWidth;
}

function newDrop(width: number, height: number, randomY = true): Drop {
  const depth = 0.45 + Math.random() * 0.75;
  return {
    x: Math.random() * (width + 180) - 90,
    y: randomY ? Math.random() * height : -80 - Math.random() * 180,
    length: (13 + Math.random() * 28) * depth,
    speed: (650 + Math.random() * 720) * depth,
    drift: (-54 - Math.random() * 44) * depth,
    alpha: (0.12 + Math.random() * 0.27) * depth,
    width: 0.55 + depth * 0.65,
  };
}

export function ManorRainCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    let width = 0;
    let height = 0;
    let animationFrame = 0;
    let previousTime = performance.now();
    let drops: Drop[] = [];
    const impacts: Impact[] = [];

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      drops = Array.from({ length: Math.max(90, Math.round(width * height / 5200)) }, () => newDrop(width, height));
    };

    const spawnImpact = (drop: Drop) => {
      if (!isDriveway(drop.x, drop.y, width, height)) return;
      const sourcePoint = imageCoordinates(drop.x, drop.y, width, height);
      const depth = Math.max(0, Math.min(1, (sourcePoint.y - 0.625) / 0.375));
      if (Math.random() < 0.42) {
        impacts.push({ x: drop.x, y: drop.y, age: 0, life: 0.48 + Math.random() * 0.42, size: 4 + depth * 14 + Math.random() * 5, kind: "ripple" });
      } else if (Math.random() < 0.35) {
        impacts.push({ x: drop.x, y: drop.y, age: 0, life: 0.2 + Math.random() * 0.17, size: 3 + depth * 7, kind: "splash" });
      }
      if (impacts.length > 95) impacts.splice(0, impacts.length - 95);
    };

    const draw = (time: number) => {
      const delta = Math.min(0.035, (time - previousTime) / 1000);
      previousTime = time;
      context.clearRect(0, 0, width, height);

      context.lineCap = "round";
      for (let index = 0; index < drops.length; index += 1) {
        const drop = drops[index];
        if (!drop) continue;
        const previousY = drop.y;
        drop.x += drop.drift * delta;
        drop.y += drop.speed * delta;

        context.beginPath();
        context.moveTo(drop.x - drop.drift / drop.speed * drop.length, drop.y - drop.length);
        context.lineTo(drop.x, drop.y);
        context.strokeStyle = `rgba(210, 224, 230, ${drop.alpha})`;
        context.lineWidth = drop.width;
        context.stroke();

        if (drop.y > previousY && isDriveway(drop.x, drop.y, width, height)) {
          const sourcePoint = imageCoordinates(drop.x, drop.y, width, height);
          const depth = Math.max(0, Math.min(1, (sourcePoint.y - 0.625) / 0.375));
          const landingChance = delta * (0.8 + depth * 4.8);
          if (Math.random() < landingChance) {
            spawnImpact(drop);
            drops[index] = newDrop(width, height, false);
            continue;
          }
        }
        if (drop.y - drop.length > height || drop.x < -120) drops[index] = newDrop(width, height, false);
      }

      for (let index = impacts.length - 1; index >= 0; index -= 1) {
        const impact = impacts[index];
        if (!impact) continue;
        impact.age += delta;
        const progress = impact.age / impact.life;
        if (progress >= 1) {
          impacts.splice(index, 1);
          continue;
        }
        const opacity = Math.sin(progress * Math.PI) * 0.42;
        context.strokeStyle = `rgba(204, 220, 225, ${opacity})`;
        context.lineWidth = Math.max(0.45, 1.15 * (1 - progress));
        if (impact.kind === "ripple") {
          context.beginPath();
          context.ellipse(impact.x, impact.y, impact.size * progress, impact.size * 0.22 * progress, 0, 0, Math.PI * 2);
          context.stroke();
        } else {
          const rise = impact.size * Math.sin(progress * Math.PI);
          for (let spray = -1; spray <= 1; spray += 1) {
            context.beginPath();
            context.moveTo(impact.x, impact.y);
            context.lineTo(impact.x + spray * impact.size * 0.48 * progress, impact.y - rise * (1 - Math.abs(spray) * 0.18));
            context.stroke();
          }
        }
      }
      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    animationFrame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="manor-rain-canvas" aria-hidden="true" />;
}