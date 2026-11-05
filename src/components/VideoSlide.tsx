import { useCallback, useEffect, useRef, useState } from "react";
import { VIDEO_SRC } from "../config";

type Props = {
  /** true quando este é o slide visível. */
  active: boolean;
  /** avisa o deck quando o vídeo está em modo imersivo (trava a navegação). */
  onImmersiveChange: (immersive: boolean) => void;
};

type IOSVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

export function VideoSlide({ active, onImmersiveChange }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const realFullscreen = useRef(false);
  const [ready, setReady] = useState(false); // arquivo de vídeo encontrado
  const [playing, setPlaying] = useState(false); // modo imersivo (vídeo visível)

  useEffect(() => {
    onImmersiveChange(playing);
  }, [playing, onImmersiveChange]);

  const stop = useCallback(() => {
    video.current?.pause();
    if (document.fullscreenElement === box.current) void document.exitFullscreen();
    realFullscreen.current = false;
    setPlaying(false);
  }, []);

  // Esc (ou qualquer saída) da tela cheia real encerra o modo imersivo
  useEffect(() => {
    const onFs = () => {
      if (document.fullscreenElement === box.current) {
        realFullscreen.current = true;
      } else if (realFullscreen.current) {
        realFullscreen.current = false;
        video.current?.pause();
        setPlaying(false);
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Esc também funciona quando o navegador não deu tela cheia real
  useEffect(() => {
    if (!playing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") stop();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [playing, stop]);

  // saiu do slide: pausa
  useEffect(() => {
    if (!active) stop();
  }, [active, stop]);

  // esconde o cursor quando o mouse para, só durante o vídeo
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

    // 1) mostra o vídeo já, para nunca tocar com a tela vazia
    setPlaying(true);

    // 2) tenta a tela cheia real; se negada, o vídeo segue preenchendo o palco
    try {
      if (b.requestFullscreen) await b.requestFullscreen({ navigationUI: "hide" });
      else v.webkitEnterFullscreen?.(); // iPhone
    } catch (err) {
      console.warn("Tela cheia indisponível, usando o palco do site:", err);
    }

    try {
      await v.play();
    } catch (err) {
      console.warn("Não foi possível reproduzir o vídeo:", err);
      stop();
    }
  };

  const toggle = () => {
    const v = video.current;
    if (!v || !playing) return;
    if (v.paused) void v.play();
    else v.pause();
  };

  const onEnded = () => {
    const v = video.current;
    if (v) v.currentTime = 0;
    stop();
  };

  return (
    <div ref={box} className="video-box" data-playing={playing} onClick={toggle}>
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

      <div className="play-wrap" data-ready={ready} data-playing={playing}>
        <span className="play-ring" />
        <button
          type="button"
          className="play-btn"
          disabled={!ready || playing}
          aria-label="Reproduzir vídeo em tela cheia"
          tabIndex={active && !playing ? 0 : -1}
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
