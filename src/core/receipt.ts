import { hashString, mulberry32 } from './rng';

export interface ReceiptEntry {
  name: string;
  score: number;
}

export interface ReceiptData {
  mode: 'free' | 'daily';
  modeLabel: string;
  dateKey: string;
  entries: ReceiptEntry[];
  total: number;
  totalLabel: string;
  titleText: string;
  timeWastedLabel: string;
  timeWastedText: string;
  thanksText: string;
}

const W = 32;
const DASH = '-'.repeat(W);

function padRow(left: string, right: string): string {
  const maxLeft = W - right.length - 1;
  const l = left.length > maxLeft ? left.slice(0, maxLeft - 1) + '…' : left;
  return l + ' '.repeat(W - l.length - right.length) + right;
}

function center(s: string): string {
  const t = s.length > W ? s.slice(0, W) : s;
  const pad = Math.floor((W - t.length) / 2);
  return ' '.repeat(pad) + t;
}

export function receiptLines(data: ReceiptData): string[] {
  const lines: string[] = [];
  lines.push(center('IHAVENOTHINGTODO'));
  lines.push(center('* boredom receipt *'));
  lines.push(DASH);
  lines.push(center(data.modeLabel));
  lines.push(center(data.dateKey));
  lines.push(DASH);
  for (const e of data.entries) lines.push(padRow(e.name, String(e.score)));
  lines.push(DASH);
  lines.push(padRow(data.totalLabel, String(data.total)));
  lines.push(padRow(data.timeWastedLabel, data.timeWastedText));
  lines.push(DASH);
  lines.push(center('>> ' + data.titleText + ' <<'));
  lines.push(DASH);
  lines.push(center(data.thanksText.slice(0, W)));
  return lines;
}

export function renderReceiptPng(lines: string[], seedText: string): string {
  const scale = 2;
  const lineH = 22;
  const padY = 28;
  const barcodeH = 34;
  const w = 340;
  const h = padY * 2 + lines.length * lineH + barcodeH + 16;
  const canvas = document.createElement('canvas');
  canvas.width = w * scale;
  canvas.height = h * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);
  ctx.fillStyle = '#FFF9F0';
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#26201A';
  ctx.font = '700 14px "Courier New", monospace';
  ctx.textBaseline = 'top';
  lines.forEach((line, i) => {
    ctx.fillText(line, 24, padY + i * lineH);
  });
  const rand = mulberry32(hashString(seedText));
  let x = 40;
  const yBar = padY + lines.length * lineH + 8;
  while (x < w - 40) {
    const bw = 1 + Math.floor(rand() * 4);
    if (rand() > 0.4) ctx.fillRect(x, yBar, bw, barcodeH);
    x += bw + 2;
  }
  return canvas.toDataURL('image/png');
}

export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export async function shareReceipt(dataUrl: string, filename: string, text: string): Promise<boolean> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return true;
    }
  } catch {
    /* dibatalkan user atau tidak didukung */
  }
  return false;
}
