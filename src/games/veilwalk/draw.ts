import { END, GROUND, H, ledges, thorns, W, type State } from './logic';

const forestUrl = '/veilwalk/forest-night.jpg';

let forest: HTMLImageElement | null = null;
const motes = Array.from({ length: 22 }, (_, i) => ({ x: (i * 137 + 31) % W, y: 100 + (i * 89) % 270, r: .6 + i % 3 * .35 }));

export async function prepareForest(): Promise<void> {
  if (typeof Image === 'undefined' || forest) return;
  const image = new Image(); image.src = forestUrl;
  try { await image.decode(); forest = image; } catch { /* Keep the fallback sky. */ }
}

export function makeSky(): HTMLCanvasElement {
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#11151b'); sky.addColorStop(1, '#555b5c');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#c8cbc3'; ctx.beginPath(); ctx.arc(680, 120, 43, 0, 7); ctx.fill();
  return canvas;
}

function drawGround(ctx: CanvasRenderingContext2D, camera: number) {
  for (const [a, b] of ledges) {
    if (b < camera - 60 || a > camera + W + 60) continue;
    ctx.fillStyle = '#090b0a'; ctx.beginPath(); ctx.moveTo(a, H);
    ctx.lineTo(a, GROUND + 2);
    for (let x = a; x < b; x += 14) ctx.lineTo(x, GROUND + Math.sin(x * .18) * 1.6 + Math.sin(x * .047) * 2);
    ctx.lineTo(b, GROUND + 1); ctx.lineTo(b, H); ctx.fill();
    ctx.strokeStyle = '#8b918568'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(a, GROUND + 1);
    for (let x = a; x < b; x += 14) ctx.lineTo(x, GROUND + Math.sin(x * .18) * 1.6 + Math.sin(x * .047) * 2);
    ctx.lineTo(b, GROUND + 1); ctx.stroke();
    const left = Math.max(a + 12, Math.floor((camera - 40) / 23) * 23);
    for (let x = left; x < Math.min(b, camera + W + 40); x += 23) {
      const height = 4 + (Math.sin(x * .81) + 1) * 3;
      if (Math.sin(x * .37) > .5) {
        ctx.fillStyle = '#171c18'; ctx.beginPath();
        ctx.ellipse(x + 3, GROUND + 1, 9, 3 + height * .4, -.14, Math.PI, 0); ctx.fill();
      }
      ctx.strokeStyle = '#595f566b'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, GROUND + 1);
      ctx.quadraticCurveTo(x - 3, GROUND - height, x - 5, GROUND - height - 3);
      ctx.moveTo(x, GROUND + 1); ctx.quadraticCurveTo(x + 2, GROUND - height, x + 6, GROUND - height + 1); ctx.stroke();
      if (x % 4 < 1) {
        ctx.strokeStyle = '#4c504975'; ctx.beginPath(); ctx.moveTo(x + 5, GROUND + 7);
        ctx.bezierCurveTo(x - 5, GROUND + 19, x + 13, GROUND + 27, x + 2, GROUND + 40); ctx.stroke();
      }
    }
    ctx.strokeStyle = '#161b18'; ctx.lineWidth = 6; ctx.lineCap = 'round';
    for (const edge of [a, b]) {
      const side = edge === a ? 1 : -1;
      ctx.beginPath(); ctx.moveTo(edge, GROUND + 5);
      ctx.bezierCurveTo(edge + side * 8, GROUND + 22, edge - side * 12, GROUND + 34, edge + side * 5, GROUND + 58); ctx.stroke();
    }
  }
}

function drawBriars(ctx: CanvasRenderingContext2D, camera: number) {
  for (const [a, b] of thorns) {
    if (b < camera - 60 || a > camera + W + 60) continue;
    ctx.fillStyle = '#020403'; ctx.beginPath(); ctx.ellipse((a + b) / 2, GROUND + 2, (b - a) / 2 + 10, 9, 0, 0, 7); ctx.fill();
    for (let i = 0; i < 7; i++) {
      const x = a + i * (b - a) / 6;
      const tip = x + (i % 2 ? -13 : 12);
      const y = GROUND - 25 - (i * 11) % 14;
      ctx.strokeStyle = '#020403'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x, GROUND); ctx.quadraticCurveTo(x + (tip - x) * .2, GROUND - 19, tip, y); ctx.stroke();
      ctx.strokeStyle = '#949a885e'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(x - 1, GROUND - 2);
      ctx.quadraticCurveTo(x + (tip - x) * .2 - 2, GROUND - 19, tip - 1, y + 2); ctx.stroke();
      ctx.strokeStyle = '#030504'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + (tip - x) * .55, GROUND - 17);
      ctx.lineTo(x + (tip - x) * .55 + (i % 2 ? 8 : -8), GROUND - 27); ctx.stroke();
    }
  }
}

function drawHuman(ctx: CanvasRenderingContext2D, s: State, time: number) {
  const facing = s.vx < -8 ? -1 : 1;
  const pace = Math.min(1, Math.abs(s.vx) / 180);
  const swing = s.grounded ? Math.sin(time * 13) * 9 * pace : 3;
  const lightX = s.x + facing * 25, lightY = s.y - 39;
  const glow = ctx.createRadialGradient(lightX, lightY, 1, lightX, lightY, 95);
  glow.addColorStop(0, '#eadca190'); glow.addColorStop(.25, '#d5c99545'); glow.addColorStop(1, '#d5c99500');
  ctx.fillStyle = glow; ctx.fillRect(lightX - 95, lightY - 95, 190, 190);
  ctx.save(); ctx.translate(s.x, s.y); ctx.scale(facing, 1);
  ctx.fillStyle = '#00000066'; ctx.beginPath(); ctx.ellipse(0, 2, 19, 4, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = '#080a0a'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const side of [-1, 1]) {
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(side * 4, -31);
    ctx.lineTo(side * 5 + side * swing * .45, -15);
    ctx.lineTo(side * 5 + side * swing, -3); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(side * 5 + side * swing, -3);
    ctx.lineTo(side * 5 + side * swing + 5, -2); ctx.stroke();
  }
  // Coat, shoulders and head use curved human proportions rather than block primitives.
  ctx.fillStyle = '#080a0a'; ctx.beginPath(); ctx.moveTo(-10, -62);
  ctx.quadraticCurveTo(0, -68, 11, -62); ctx.quadraticCurveTo(14, -48, 10, -36);
  ctx.quadraticCurveTo(12, -32, 11, -27); ctx.quadraticCurveTo(0, -30, -11, -27);
  ctx.quadraticCurveTo(-10, -37, -12, -48); ctx.quadraticCurveTo(-14, -58, -10, -62); ctx.fill();
  ctx.fillStyle = '#0a0c0b'; ctx.beginPath(); ctx.ellipse(0, -75, 6.5, 8, -.08, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-6, -80); ctx.quadraticCurveTo(-2, -85, 4, -84);
  ctx.quadraticCurveTo(9, -82, 6, -78); ctx.quadraticCurveTo(2, -82, -6, -80); ctx.fill();
  ctx.strokeStyle = '#a4a99a70'; ctx.lineWidth = 1.3; ctx.beginPath();
  ctx.moveTo(6, -79); ctx.quadraticCurveTo(9, -76, 7, -73); ctx.stroke();
  ctx.strokeStyle = '#626c6555'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-9, -58); ctx.quadraticCurveTo(-7, -43, -11, -29);
  ctx.moveTo(9, -58); ctx.quadraticCurveTo(10, -40, 9, -29); ctx.stroke();
  ctx.fillStyle = '#545b5340'; ctx.beginPath(); ctx.moveTo(-8, -57);
  ctx.quadraticCurveTo(-2, -60, 1, -57); ctx.quadraticCurveTo(-2, -43, -7, -35);
  ctx.quadraticCurveTo(-6, -47, -8, -57); ctx.fill();
  ctx.strokeStyle = '#a6aca078'; ctx.beginPath();
  ctx.moveTo(6, -68); ctx.quadraticCurveTo(9, -65, 11, -60);
  ctx.moveTo(-6, -29); ctx.lineTo(-6 + swing * .5, -17); ctx.stroke();
  // Bent elbow and a hanging lantern, with a small back arm for depth.
  ctx.strokeStyle = '#050707'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-9, -55); ctx.lineTo(-17, -42 + swing * .2); ctx.lineTo(-15, -29 + swing * .2);
  ctx.moveTo(10, -55); ctx.lineTo(17, -44); ctx.lineTo(24, -40); ctx.stroke();
  ctx.fillStyle = '#9e9f8c'; ctx.beginPath(); ctx.ellipse(24, -40, 3, 3.5, .2, 0, 7); ctx.fill();
  ctx.strokeStyle = '#a3a99a99'; ctx.lineWidth = 1;
  ctx.strokeRect(19, -39, 11, 15);
  ctx.fillStyle = '#ecdca4'; ctx.fillRect(21, -37, 7, 11);
  ctx.fillStyle = '#383b32'; ctx.fillRect(18, -41, 13, 3); ctx.fillRect(19, -23, 11, 3);
  ctx.restore();
}

export function draw(ctx: CanvasRenderingContext2D, sky: HTMLCanvasElement, s: State, camera: number, locale: 'id' | 'en', reducedMotion: boolean) {
  const time = reducedMotion ? 0 : s.time;
  if (forest) {
    const sourceW = forest.naturalHeight * W / H;
    const maxX = forest.naturalWidth - sourceW;
    const start = Math.min(180, maxX);
    const sourceX = start + (maxX - start) * Math.min(1, camera / (END - W + 120));
    ctx.drawImage(forest, sourceX, 0, sourceW, forest.naturalHeight, 0, 0, W, H);
  } else ctx.drawImage(sky, 0, 0);
  ctx.fillStyle = '#0b0f1028'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.translate(-camera, 0);
  drawGround(ctx, camera);
  if (s.bridge) {
    ctx.fillStyle = '#191c18'; ctx.beginPath(); ctx.moveTo(2220, GROUND + 2);
    ctx.bezierCurveTo(2280, GROUND - 7, 2370, GROUND - 7, 2440, GROUND + 2);
    ctx.lineTo(2440, GROUND + 16); ctx.quadraticCurveTo(2330, GROUND + 7, 2220, GROUND + 16); ctx.fill();
    ctx.strokeStyle = '#9b9b8870'; ctx.lineWidth = 1;
    for (let x = 2233; x < 2440; x += 19) { ctx.beginPath(); ctx.moveTo(x, GROUND + 1); ctx.quadraticCurveTo(x + 6, GROUND + 6, x + 13, GROUND + 4); ctx.stroke(); }
  }
  drawBriars(ctx, camera);
  // Weathered lever and a doorway grown from two roots.
  ctx.strokeStyle = '#242822'; ctx.lineWidth = 11; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(2080, GROUND); ctx.lineTo(2080, GROUND - 49); ctx.stroke();
  ctx.strokeStyle = '#a7aaa0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(2080, GROUND - 49);
  ctx.lineTo(s.bridge ? 2103 : 2062, GROUND - 67); ctx.stroke();
  ctx.fillStyle = '#c8c9b8'; ctx.beginPath(); ctx.arc(s.bridge ? 2103 : 2062, GROUND - 67, 4, 0, 7); ctx.fill();
  const portal = ctx.createLinearGradient(3718, 0, 3768, 0);
  portal.addColorStop(0, '#e1e0cb3b'); portal.addColorStop(.5, '#efecceba'); portal.addColorStop(1, '#e1e0cb3b');
  ctx.fillStyle = portal; ctx.beginPath(); ctx.moveTo(3724, GROUND);
  ctx.lineTo(3724, GROUND - 84); ctx.quadraticCurveTo(3742, GROUND - 116, 3760, GROUND - 84);
  ctx.lineTo(3760, GROUND); ctx.fill();
  ctx.strokeStyle = '#111713'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(3718, GROUND + 5);
  ctx.bezierCurveTo(3720, GROUND - 45, 3709, GROUND - 94, 3742, GROUND - 105);
  ctx.bezierCurveTo(3774, GROUND - 94, 3764, GROUND - 45, 3767, GROUND + 5); ctx.stroke();
  drawHuman(ctx, s, time);
  if (!s.bridge && Math.abs(s.x - 2080) < 85) {
    ctx.font = '14px monospace'; ctx.textAlign = 'center'; ctx.fillStyle = '#e7e6d9';
    ctx.fillText(locale === 'id' ? 'E / AKSI  ·  TARIK TUAS' : 'E / ACTION  ·  PULL LEVER', 2080, GROUND - 105);
  }
  ctx.restore();
  ctx.fillStyle = '#e9e8d92b';
  for (const p of motes) { ctx.beginPath(); ctx.arc((p.x - camera * .12 + W * 3) % W, p.y + Math.sin(time + p.x) * 3, p.r, 0, 7); ctx.fill(); }
  const haze = ctx.createLinearGradient(0, 290, 0, H);
  haze.addColorStop(0, '#a7aaa000'); haze.addColorStop(.65, '#a7aaa009'); haze.addColorStop(1, '#a7aaa01f');
  ctx.fillStyle = haze; ctx.fillRect(0, 290, W, H - 290);
  const vignette = ctx.createRadialGradient(W / 2, H / 2, 190, W / 2, H / 2, 630);
  vignette.addColorStop(0, '#00000000'); vignette.addColorStop(1, '#0000009c');
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#ecebdabb'; ctx.fillRect(26, 24, (W - 52) * Math.min(1, s.x / END), 2);
}
