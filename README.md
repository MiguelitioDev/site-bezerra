# Padrão Memento

Apresentação em formato de site. Setas do teclado (← →), Espaço, PageUp/PageDown, Home/End, botões laterais ou deslize no celular navegam pelos slides. Use F11 para tela cheia.

## Vídeo do último slide

Coloque o arquivo em `public/video/apresentacao.mp4` e faça commit/push. O botão de play fica ativo sozinho quando o arquivo existe. Ao clicar, o vídeo abre em tela cheia, sem controles (clique ou Esc para pausar/sair). Para usar outro nome ou uma URL externa, edite `VIDEO_SRC` em `src/config.ts`.

Limite do GitHub: 100 MB por arquivo. Se o vídeo for maior, comprima (por exemplo com `ffmpeg -crf 26`) ou hospede em outro lugar e aponte a URL em `VIDEO_SRC`.

## Desenvolvimento

```
npm install
npm run dev
npm run build
```
