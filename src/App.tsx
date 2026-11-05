import { useCallback, useEffect, useRef, useState } from "react";
import { SLIDE_IMAGES, TOTAL_SLIDES } from "./config";
import { VideoSlide } from "./components/VideoSlide";

const VIDEO_INDEX = TOTAL_SLIDES - 1;
const IDLE_MS = 2500;

function readHash(): number {
  const n = parseInt(window.location.hash.replace("#", ""), 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), TOTAL_SLIDES) - 1 : 0;
}

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} />
    </svg>
  );
}

export default function App() {
  const [current, setCurrent] = useState(readHash);
  const [idle, setIdle] = useState(false);
  const [immersive, setImmersive] = useState(false);
  const idleTimer = useRef(0);
  const touchX = useRef<number | null>(null);

  const go = useCallback(
    (to: number) => setCurrent((c) => {
      const n = Math.min(Math.max(to, 0), TOTAL_SLIDES - 1);
      return n === c ? c : n;
    }),
    [],
  );
  const next = useCallback(() => setCurrent((c) => Math.min(c + 1, TOTAL_SLIDES - 1)), []);
  const prev = useCallback(() => setCurrent((c) => Math.max(c - 1, 0)), []);

  // guarda o slide na URL (#3) para recarregar no mesmo lugar
  useEffect(() => {
    history.replaceState(null, "", `#${current + 1}`);
  }, [current]);

  // pré-carrega todos os slides para a troca nunca piscar
  useEffect(() => {
    SLIDE_IMAGES.forEach((src) => {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    });
  }, []);

  // controles somem quando o mouse para
  const wake = useCallback(() => {
    setIdle(false);
    window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_MS);
  }, []);
  useEffect(() => {
    wake();
    const events = ["pointermove", "pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, wake, { passive: true }));
    return () => {
      window.clearTimeout(idleTimer.current);
      events.forEach((e) => window.removeEventListener(e, wake));
    };
  }, [wake]);

  // teclado, como no PowerPoint
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (immersive || e.altKey || e.ctrlKey || e.metaKey) return;
      const onButton = (e.target as HTMLElement | null)?.closest("button");
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
        case "Backspace":
          e.preventDefault();
          prev();
          break;
        case " ":
        case "Enter":
          if (onButton) return; // deixa o botão focado agir
          e.preventDefault();
          next();
          break;
        case "Home":
          e.preventDefault();
          go(0);
          break;
        case "End":
          e.preventDefault();
          go(TOTAL_SLIDES - 1);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [immersive, next, prev, go]);

  const pos = (i: number) => (i < current ? "before" : i > current ? "after" : "current");

  return (
    <div
      className="viewport"
      data-idle={idle}
      data-immersive={immersive}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null || immersive) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
      }}
    >
      <main className="stage" aria-roledescription="apresentação" aria-label="Padrão Memento">
        <p className="sr-only" aria-live="polite">
          Slide {current + 1} de {TOTAL_SLIDES}
        </p>

        {SLIDE_IMAGES.map((src, i) => (
          <section
            key={src}
            className="slide"
            data-pos={pos(i)}
            inert={i !== current}
            aria-roledescription="slide"
            aria-label={`Slide ${i + 1} de ${TOTAL_SLIDES}`}
          >
            <img src={src} alt={`Slide ${i + 1}`} draggable={false} decoding="async" fetchPriority={i === 0 ? "high" : "auto"} />
          </section>
        ))}

        <section
          className="slide"
          data-pos={pos(VIDEO_INDEX)}
          inert={VIDEO_INDEX !== current}
          aria-roledescription="slide"
          aria-label={`Slide ${TOTAL_SLIDES} de ${TOTAL_SLIDES}: vídeo`}
        >
          <VideoSlide active={current === VIDEO_INDEX} onImmersiveChange={setImmersive} />
        </section>
      </main>

      <button type="button" className="nav-btn chrome" data-side="prev" onClick={prev} disabled={current === 0} aria-label="Slide anterior">
        <Arrow dir="left" />
      </button>
      <button type="button" className="nav-btn chrome" data-side="next" onClick={next} disabled={current === TOTAL_SLIDES - 1} aria-label="Próximo slide">
        <Arrow dir="right" />
      </button>

      <nav className="progress chrome" aria-label="Slides">
        {Array.from({ length: TOTAL_SLIDES }, (_, i) => (
          <button
            key={i}
            type="button"
            data-done={i < current}
            aria-current={i === current}
            aria-label={`Ir para o slide ${i + 1}`}
            onClick={() => go(i)}
          />
        ))}
      </nav>
    </div>
  );
}
