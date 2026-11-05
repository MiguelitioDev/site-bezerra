import { useCallback, useEffect, useRef, useState } from "react";
import { VIDEO_SRC } from "../config";

type Props = {
  /** true quando este é o slide visível. */
  active: boolean;
  /** avisa o deck se o vídeo está em tela cheia (para travar a navegação). */
  onImmersiveChange: (immersive: boolean) => void;
};

type IOSVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

export function VideoSlide({ active, onImmersiveChange }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false); // arquivo de vídeo encontrado
  const [launching, setLaunching] = useState(false);

  const stop = useCallback(() => {
    const v = video.current;
    if (!v) return;
    v.pause();
    setLaunching(false);
    onImmersiveChange(false);
  }, [onImmersiveChange]);

  // entra e sai da tela cheia (inclusive via Esc)
  useEffect(() => {
    const onFs = () => {
      const on = document.fullscreenElement === box.current;
      onImmersiveChange(on);
      if (!on) {
        video.current?.pause();
        setLaunching(false);
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [onImmersiveChange]);

  // saiu do slide: pausa
  useEffect(() => {
    if (!active) {
      if (document.fullscreenElement === box.current) void document.exitFullscreen();
      stop();
    }
  }, [active, stop]);

  // esconde o cursor quando o mouse para, só em tela cheia
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let t = 0;
    const show = () => {
      el.dataset.cursor = "visible";
      window.clearTimeout(t);
      t = window.setTimeout(() => (el.dataset.cursor = "hidden"), 1800);
    };
    el.addEventListener("pointermove", show);
    return () => {
      window.clearTimeout(t);
      el.removeEventListener("pointermove", show);
    };
  }, []);

  const start = async () => {
    const v = video.current as IOSVideo | null;
    const b = box.current;
    if (!v || !b || !ready) return;
    setLaunching(true);
    try {
      if (b.requestFullscreen) await b.requestFullscreen({ navigationUI: "hide" });
      else v.webkitEnterFullscreen?.(); // iPhone
    } catch {
      /* segue em tela normal se o navegador negar */
    }
    try {
      await v.play();
    } catch {
      stop();
    }
  };

  const toggle = () => {
    const v = video.current;
    if (!v || document.fullscreenElement !== box.current) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const onEnded = () => {
    const v = video.current;
    if (v) v.currentTime = 0;
    if (document.fullscreenElement === box.current) void document.exitFullscreen();
    stop();
  };

  return (
    <div ref={box} className="video-box" onClick={toggle}>
      <span className="corner" data-c="tl" />
      <span className="corner" data-c="tr" />
      <span className="corner" data-c="bl" />
      <span className="corner" data-c="br" />

      <video
        ref={video}
        src={VIDEO_SRC}
        preload="metadata"
        playsInline
        disablePictureInPicture
        controlsList="nodownload noremoteplayback nofullscreen"
        onLoadedMetadata={() => setReady(true)}
        onError={() => setReady(false)}
        onEnded={onEnded}
      />

      <div className="play-wrap" data-ready={ready}>
        <span className="play-ring" />
        <button
          type="button"
          className="play-btn"
          data-launching={launching}
          disabled={!ready}
          aria-label="Reproduzir vídeo em tela cheia"
          tabIndex={active ? 0 : -1}
          onClick={(e) => {
            e.stopPropagation();
            void start();
          }}
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 3.8v16.4a1 1 0 0 0 1.5.86l13.6-8.2a1 1 0 0 0 0-1.72L7.5 2.94A1 1 0 0 0 6 3.8Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
