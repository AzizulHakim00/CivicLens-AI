"use client";

import type { CSSProperties } from "react";
import { useEffect } from "react";

const particles = [
  { x: 7, y: 18, size: 3, delay: 0, duration: 18 },
  { x: 14, y: 72, size: 2, delay: 3, duration: 22 },
  { x: 22, y: 42, size: 4, delay: 7, duration: 26 },
  { x: 31, y: 84, size: 2, delay: 1, duration: 20 },
  { x: 39, y: 12, size: 3, delay: 9, duration: 24 },
  { x: 48, y: 62, size: 2, delay: 5, duration: 19 },
  { x: 57, y: 32, size: 4, delay: 2, duration: 28 },
  { x: 65, y: 88, size: 3, delay: 11, duration: 23 },
  { x: 73, y: 16, size: 2, delay: 6, duration: 21 },
  { x: 81, y: 54, size: 3, delay: 4, duration: 25 },
  { x: 89, y: 78, size: 2, delay: 10, duration: 18 },
  { x: 95, y: 28, size: 4, delay: 8, duration: 27 },
];

export default function VisualAtmosphere() {
  useEffect(() => {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let pointerFrame = 0;
    let scrollFrame = 0;

    const effectsEnabled = () =>
      !reducedMotion.matches &&
      root.dataset.performance !== "lite" &&
      root.dataset.authState === "authenticated" &&
      root.dataset.runtimePaused !== "true";

    const updatePointer = (event: PointerEvent) => {
      if (!effectsEnabled() || pointerFrame) return;
      pointerFrame = window.requestAnimationFrame(() => {
        pointerFrame = 0;
        root.style.setProperty("--pointer-x", `${event.clientX}px`);
        root.style.setProperty("--pointer-y", `${event.clientY}px`);
        root.style.setProperty("--pointer-rx", `${((event.clientY / window.innerHeight) - 0.5) * -3}deg`);
        root.style.setProperty("--pointer-ry", `${((event.clientX / window.innerWidth) - 0.5) * 3}deg`);
      });
    };

    const updateScroll = () => {
      if (scrollFrame) return;
      scrollFrame = window.requestAnimationFrame(() => {
        scrollFrame = 0;
        const available = document.documentElement.scrollHeight - window.innerHeight;
        const progress = available > 0 ? Math.min(1, window.scrollY / available) : 0;
        root.style.setProperty("--scroll-progress", `${progress * 100}%`);
      });
    };

    window.addEventListener("pointermove", updatePointer, { passive: true });
    window.addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();

    return () => {
      window.cancelAnimationFrame(pointerFrame);
      window.cancelAnimationFrame(scrollFrame);
      window.removeEventListener("pointermove", updatePointer);
      window.removeEventListener("scroll", updateScroll);
    };
  }, []);

  return (
    <div className="visual-atmosphere" aria-hidden="true">
      <div className="visual-scroll-progress" />
      <div className="visual-pointer-glow" />
      <div className="visual-grid-layer" />
      <div className="visual-aurora visual-aurora-one" />
      <div className="visual-aurora visual-aurora-two" />
      <div className="visual-aurora visual-aurora-three" />
      <div className="visual-orbit visual-orbit-one" />
      <div className="visual-orbit visual-orbit-two" />
      <div className="visual-particles">
        {particles.map((particle, index) => (
          <span
            key={`${particle.x}-${particle.y}`}
            style={
              {
                "--particle-x": `${particle.x}%`,
                "--particle-y": `${particle.y}%`,
                "--particle-size": `${particle.size}px`,
                "--particle-delay": `${particle.delay}s`,
                "--particle-duration": `${particle.duration}s`,
                "--particle-index": index,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <div className="visual-scan-beam" />
      <div className="visual-noise" />
      <div className="visual-vignette" />
    </div>
  );
}
