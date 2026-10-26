export type ShareLayout = "horizontal" | "vertical" | "square";

export const SHARE_SIZES: Record<
  ShareLayout,
  { width: number; height: number }
> = {
  horizontal: { width: 1920, height: 1080 },
  vertical: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
};

/** Branding overlay, sized to match each layout exactly. */
export const overlayFor = (layout: ShareLayout) =>
  `/images/social/${layout}.png`;

const loadImage = (src: string): Promise<HTMLImageElement | null> =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });

export async function composeShareImage(
  snapshot: HTMLCanvasElement,
  layout: ShareLayout
): Promise<HTMLCanvasElement> {
  const { width, height } = SHARE_SIZES[layout];
  const output = document.createElement("canvas");
  output.width = width;
  output.height = height;

  const context = output.getContext("2d");
  if (!context) return output;

  context.fillStyle = "#000000";
  context.fillRect(0, 0, width, height);

  const scale = Math.max(width / snapshot.width, height / snapshot.height);
  const drawWidth = snapshot.width * scale;
  const drawHeight = snapshot.height * scale;

  context.drawImage(
    snapshot,
    (width - drawWidth) / 2,
    (height - drawHeight) / 2,
    drawWidth,
    drawHeight
  );

  const overlay = await loadImage(overlayFor(layout));
  if (overlay) context.drawImage(overlay, 0, 0, width, height);

  return output;
}

/** Filename for a downloaded capture, e.g. `orbitviewer-2026-09-11.png`. */
export const shareFilename = (date: Date = new Date()): string =>
  `orbitviewer-${date.toISOString().slice(0, 10)}.png`;
