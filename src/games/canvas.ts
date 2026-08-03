export const ARCADE = {
  bg: '#20201f',
  bgSoft: '#393938',
  pink: '#8a8986',
  green: '#f0f0ed',
  yellow: '#d7d7d3',
  blue: '#b7b6b2',
  white: '#f9f9f7',
  dim: '#777673',
} as const;

export function setupCanvas(canvas: HTMLCanvasElement, w: number, h: number): CanvasRenderingContext2D {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

export function pointerPos(
  canvas: HTMLCanvasElement,
  e: PointerEvent,
  w: number,
  h: number,
): { x: number; y: number } {
  const r = canvas.getBoundingClientRect();
  return { x: ((e.clientX - r.left) * w) / r.width, y: ((e.clientY - r.top) * h) / r.height };
}

export function minimumTouchRadius(
  displayWidth: number,
  displayHeight: number,
  logicalWidth = 480,
  logicalHeight = 720,
): number {
  const scale = Math.min(displayWidth / logicalWidth, displayHeight / logicalHeight);
  return scale > 0 && Number.isFinite(scale) ? 22 / scale : 22;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function inRect(px: number, py: number, r: Rect): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  r: Rect,
  radius: number,
  fill: string,
  stroke?: string,
): void {
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, radius);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
}

export function centerText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  font: string,
  fill: string,
): void {
  ctx.font = font;
  ctx.fillStyle = fill;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
}
