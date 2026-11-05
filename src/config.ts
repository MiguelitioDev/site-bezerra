/**
 * Caminho do vídeo do último slide.
 * Coloque o arquivo em public/video/apresentacao.mp4 (ou troque o caminho/URL aqui).
 */
export const VIDEO_SRC = "/video/apresentacao.mp4";

/** Slides do PowerPoint, exportados como imagens 16:9 (public/slides). */
export const SLIDE_IMAGES: string[] = Array.from(
  { length: 12 },
  (_, i) => `/slides/slide-${String(i + 1).padStart(2, "0")}.png`,
);

/** O último slide (13) é o do vídeo. */
export const TOTAL_SLIDES = SLIDE_IMAGES.length + 1;
