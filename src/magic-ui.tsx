// MagicUI-style animated primitives for the Cupid wall.
// Reimplemented for plain React + framer-motion (no Next.js) in the spirit of
// https://magicui.design — aurora text, border beam, particles, ticker,
// spotlight card, blur fade, confetti.

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useInView,
  AnimatePresence,
} from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { cn } from "./cn.js";

/* ---------- global keyframes (injected once) ---------- */

export function MagicStyles() {
  return (
    <style>{`
      @keyframes aurora {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      @keyframes border-beam {
        to { --beam-angle: 360deg; }
      }
      @property --beam-angle { syntax: "<angle>"; initial-value: 0deg; inherits: false; }
      @keyframes grid-fade {
        0%, 100% { opacity: 0.35; }
        50% { opacity: 0.7; }
      }
      @keyframes float-heart {
        0%, 100% { transform: translateY(0) rotate(-6deg); }
        50% { transform: translateY(-10px) rotate(6deg); }
      }
      @keyframes shimmer {
        to { background-position: -200% center; }
      }
      @keyframes ping-ring {
        0% { transform: scale(1); opacity: 0.6; }
        80%, 100% { transform: scale(2.2); opacity: 0; }
      }
      @keyframes marquee-y {
        from { transform: translateY(0); }
        to { transform: translateY(-50%); }
      }
    `}</style>
  );
}

/* ---------- AuroraText ---------- */

export function AuroraText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("bg-clip-text text-transparent", className)}
      style={{
        backgroundImage:
          "linear-gradient(120deg, #ff6b9d, #c084fc, #818cf8, #38bdf8, #ff6b9d)",
        backgroundSize: "250% auto",
        animation: "aurora 8s linear infinite",
      }}
    >
      {children}
    </span>
  );
}

/* ---------- BorderBeam (animated gradient border) ---------- */

export function BorderBeam({
  size = 250,
  duration = 6,
  borderWidth = 1.5,
  colorFrom = "#ff6b9d",
  colorTo = "#818cf8",
  delay = 0,
}: {
  size?: number;
  duration?: number;
  borderWidth?: number;
  colorFrom?: string;
  colorTo?: string;
  delay?: number;
}) {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      style={{
        padding: borderWidth,
        background: `conic-gradient(from var(--beam-angle), transparent 0%, transparent 70%, ${colorFrom} 82%, ${colorTo} 92%, transparent 100%)`,
        WebkitMask:
          "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        // @ts-expect-error custom property
        "--beam-angle": "0deg",
        animation: `border-beam ${duration}s linear infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

/* ---------- Particles ---------- */

export function Particles({
  quantity = 60,
  className,
  colors = ["#ff6b9d", "#c084fc", "#818cf8", "#fbbf24"],
}: {
  quantity?: number;
  className?: string;
  colors?: string[];
}) {
  const particles = useMemo(
    () =>
      Array.from({ length: quantity }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 1,
        color: colors[i % colors.length],
        duration: Math.random() * 8 + 6,
        delay: Math.random() * 6,
        drift: Math.random() * 30 - 15,
      })),
    [quantity, colors]
  );
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className
      )}
    >
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            boxShadow: `0 0 ${p.size * 4}px ${p.color}`,
          }}
          animate={{
            y: [0, -p.drift, 0],
            x: [0, p.drift / 2, 0],
            opacity: [0, 0.9, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ---------- FlickeringGrid ---------- */

export function FlickeringGrid({
  className,
  squareSize = 44,
  gridGap = 6,
  flickerChance = 0.06,
  color = "rgba(255,107,157,0.14)",
  maxOpacity = 0.14,
}: {
  className?: string;
  squareSize?: number;
  gridGap?: number;
  flickerChance?: number;
  color?: string;
  maxOpacity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const id = useId();
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    let cols = 0, rows = 0;
    let squares: Float32Array = new Float32Array(0);
    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      canvas.style.width = `${parent.clientWidth}px`;
      canvas.style.height = `${parent.clientHeight}px`;
      ctx.scale(dpr, dpr);
      cols = Math.ceil(parent.clientWidth / (squareSize + gridGap));
      rows = Math.ceil(parent.clientHeight / (squareSize + gridGap));
      squares = new Float32Array(cols * rows);
      for (let i = 0; i < squares.length; i++)
        squares[i] = Math.random() * maxOpacity;
    };
    resize();
    window.addEventListener("resize", resize);
    let last = 0;
    const draw = (t: number) => {
      if (t - last > 90) {
        last = t;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < squares.length; i++) {
          if (Math.random() < flickerChance)
            squares[i] = Math.random() * maxOpacity;
          const x = (i % cols) * (squareSize + gridGap);
          const y = Math.floor(i / cols) * (squareSize + gridGap);
          ctx.fillStyle = color.replace(
            /[\d.]+\)$/,
            `${squares[i].toFixed(3)})`
          );
          ctx.fillRect(x, y, squareSize, squareSize);
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [squareSize, gridGap, flickerChance, color, maxOpacity]);
  return (
    <canvas
      key={id}
      ref={canvasRef}
      className={cn("pointer-events-none absolute inset-0", className)}
    />
  );
}

/* ---------- BlurFade ---------- */

export function BlurFade({
  children,
  delay = 0,
  duration = 0.5,
  yOffset = 12,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  yOffset?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: yOffset, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ delay, duration, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- NumberTicker ---------- */

export function NumberTicker({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 30, stiffness: 120 });
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString());
  const inView = useInView(ref, { once: false });
  useEffect(() => {
    if (inView) mv.set(value);
  }, [value, inView, mv]);
  return (
    <motion.span ref={ref} className={className}>
      {display}
    </motion.span>
  );
}

/* ---------- MagicCard (mouse spotlight) ---------- */

export function MagicCard({
  children,
  className,
  spotlightColor = "rgba(255,107,157,0.18)",
}: {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        x.set(e.clientX - r.left);
        y.set(e.clientY - r.top);
      }}
      onMouseLeave={() => {
        x.set(-400);
        y.set(-400);
      }}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm",
        className
      )}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px z-0"
        style={{
          background: useTransform(
            [x, y],
            ([mx, my]) =>
              `radial-gradient(280px circle at ${mx}px ${my}px, ${spotlightColor}, transparent 70%)`
          ),
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ---------- ConfettiBurst ---------- */

const CONFETTI_COLORS = ["#ff6b9d", "#c084fc", "#818cf8", "#38bdf8", "#fbbf24"];

export function ConfettiBurst({ burstKey }: { burstKey: number }) {
  const [pieces, setPieces] = useState<number>(0);
  useEffect(() => {
    if (burstKey > 0) {
      setPieces((n) => n + 1);
      const t = setTimeout(() => setPieces((n) => n - 1), 1600);
      return () => clearTimeout(t);
    }
  }, [burstKey]);
  return (
    <AnimatePresence>
      {pieces > 0 && (
        <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
          {Array.from({ length: 40 }).map((_, i) => {
            const angle = (i / 40) * Math.PI * 2;
            const dist = 140 + Math.random() * 240;
            return (
              <motion.span
                key={`${pieces}-${i}`}
                className="absolute left-1/2 top-1/3 rounded-sm"
                style={{
                  width: 8,
                  height: 12,
                  background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                }}
                initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                animate={{
                  x: Math.cos(angle) * dist,
                  y: Math.sin(angle) * dist + 160,
                  opacity: 0,
                  rotate: Math.random() * 720 - 360,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.4, ease: "easeOut" }}
              />
            );
          })}
        </div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Shimmer / gradient text ---------- */

export function ShimmerText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn("bg-clip-text text-transparent", className)}
      style={{
        backgroundImage:
          "linear-gradient(110deg, #e2e8f0 40%, #ff9ec2 50%, #e2e8f0 60%)",
        backgroundSize: "200% auto",
        animation: "shimmer 3.5s linear infinite",
      }}
    >
      {children}
    </span>
  );
}
