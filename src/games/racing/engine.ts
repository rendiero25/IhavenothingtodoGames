import { BaseEngine } from '../base';
import { ARCADE, pointerPos } from '../canvas';
import { dictionaries } from '../../i18n/dict';
import { bend, clamp, contact, crossing, drafting, type RacingMode, type Rival } from './logic';

/** Shared pseudo-3D road renderer: bounded geometry, no textures or GPU dependency. */
export class RacingEngine extends BaseEngine {
  private x = 0;
  private target = 0;
  private distance = 0;
  private speed = 0;
  private charge = 0;
  private cooldown = 0;
  private spawn = 0;
  private rivals: Rival[] = [];
  private keys = new Set<string>();
  private controls?: HTMLDivElement;
  private brakeButton?: HTMLButtonElement;
  private braking = false;
  private reduced = false;
  private cleared = 0;
  private feedback = 0;
  constructor(private readonly mode: RacingMode) { super(); }
  private onPointer = (e: PointerEvent) => {
    if (!this.isRunning) return;
    this.target = clamp((pointerPos(this.canvas, e, this.w, this.h).x - 240) / 170, -1.2, 1.2);
  };
  private onKey = (e: KeyboardEvent) => {
    if (!this.isRunning || !['ArrowLeft', 'ArrowRight', 'a', 'd', ' '].includes(e.key) || e.altKey || e.ctrlKey || e.metaKey) return;
    if ((e.target as HTMLElement | null)?.tagName === 'BUTTON' && e.key === ' ') return;
    e.preventDefault(); this.keys.add(e.key);
  };
  private onUp = (e: KeyboardEvent) => { this.keys.delete(e.key); };
  private release = () => { this.keys.clear(); this.braking = false; };
  protected setup(): void {
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.canvas.addEventListener('pointerdown', this.onPointer);
    this.canvas.addEventListener('pointermove', this.onPointer);
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onUp);
    window.addEventListener('blur', this.release);
    const labels = dictionaries[this.opts.locale];
    this.controls = document.createElement('div');
    this.controls.className = 'absolute bottom-3 inset-x-3 flex justify-between items-center pointer-events-none font-mono text-xs';
    for (const direction of [-1, 1]) {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = direction < 0 ? '←' : '→';
      button.setAttribute('aria-label', `${labels['racing.steer']} ${button.textContent}`);
      button.className = 'pointer-events-auto min-w-12 min-h-12 rounded-lg bg-black text-white border border-white/40 focus-visible:outline-2 active:bg-white active:text-black';
      button.style.touchAction = 'none';
      button.onpointerdown = (e) => { if (this.isRunning) { button.setPointerCapture(e.pointerId); this.keys.add(direction < 0 ? 'ArrowLeft' : 'ArrowRight'); } };
      button.onpointerup = button.onpointercancel = button.onlostpointercapture = () => { this.keys.delete(direction < 0 ? 'ArrowLeft' : 'ArrowRight'); };
      button.onclick = () => { if (this.isRunning) this.target = clamp(this.target + direction * 0.3, -1.2, 1.2); };
      this.controls.append(button);
    }
    this.brakeButton = document.createElement('button');
    this.brakeButton.type = 'button'; this.brakeButton.textContent = labels['racing.brake'];
    this.brakeButton.className = 'pointer-events-auto min-h-12 px-5 rounded-lg bg-black text-white border border-white/40 focus-visible:outline-2 active:bg-white active:text-black';
    this.brakeButton.style.touchAction = 'none';
    this.brakeButton.onpointerdown = (e) => { if (this.isRunning) { this.brakeButton!.setPointerCapture(e.pointerId); this.braking = true; } };
    this.brakeButton.onpointerup = this.brakeButton.onpointercancel = this.brakeButton.onlostpointercapture = () => { this.braking = false; };
    this.brakeButton.onkeydown = (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); this.braking = this.isRunning; } };
    this.brakeButton.onkeyup = this.brakeButton.onblur = () => { this.braking = false; };
    this.controls.insertBefore(this.brakeButton, this.controls.lastChild);
    this.canvas.parentElement?.append(this.controls);
  }
  override pause(): void { super.pause(); this.release(); }
  protected teardown(): void {
    this.canvas.removeEventListener('pointerdown', this.onPointer);
    this.canvas.removeEventListener('pointermove', this.onPointer);
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onUp);
    window.removeEventListener('blur', this.release);
    this.controls?.remove();
  }
  protected update(dt: number): void {
    const seconds = dt / 1000;
    const dir = Number(this.keys.has('ArrowRight') || this.keys.has('d')) - Number(this.keys.has('ArrowLeft') || this.keys.has('a'));
    this.target = clamp(this.target + dir * seconds * 1.8, -1.2, 1.2);
    this.x += (this.target - this.x) * Math.min(1, dt / 80);
    const draft = this.mode === 'slipstream' && drafting(this.x, this.rivals);
    this.charge = clamp(this.charge + seconds * (draft ? 0.65 : -0.18), 0, 1);
    const desired = this.braking || this.keys.has(' ') ? 85 : Math.min(245, 145 + this.level * 6) + this.charge * 100;
    this.speed += (desired - this.speed) * Math.min(1, dt / 400);
    this.distance += this.speed * seconds;
    if (this.mode === 'rally') {
      this.target = clamp(this.target - bend(this.distance, this.mode) * seconds * this.speed / 190, -1.2, 1.2);
    }
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.feedback = Math.max(0, this.feedback - dt);
    if (Math.abs(this.x) > 1 && !this.cooldown) { this.fail(); this.cooldown = 1400; if (this.isFinished) return; }
    this.spawn -= this.speed * seconds;
    if (this.spawn <= 0) {
      this.spawn = this.mode === 'rally' ? 210 : 150;
      this.rivals.push({ x: (Math.floor(this.rand() * 3) - 1) * 0.58, z: 0.03, passed: false });
    }
    for (const rival of this.rivals) {
      const previous = rival.z;
      rival.z += this.speed * seconds / 540;
      if (!rival.passed && crossing(previous, rival.z)) {
        rival.passed = true;
        const hit = this.mode === 'rally' ? Math.abs(this.x - rival.x) > 0.34 : contact(this.x, rival.x);
        if (hit) { if (!this.cooldown) { this.fail(); this.cooldown = 1400; if (this.isFinished) return; } }
        else { this.cleared++; this.feedback = 900; this.success(this.mode === 'slipstream' ? 10 + Math.round(this.charge * 20) : 15); }
      }
    }
    this.rivals = this.rivals.filter((r) => r.z < 1.15);
  }
  private road(z: number): { x: number; y: number; half: number } {
    const horizon = this.mode === 'rally' ? 235 : this.mode === 'slipstream' ? 125 : 175;
    return { x: 240 + bend(this.distance + (1 - z) * 550, this.mode) * (1 - z) * 150,
      y: horizon + Math.pow(z, this.mode === 'rally' ? 1.45 : 2.3) * (700 - horizon), half: 8 + z * 235 };
  }
  private polygon(points: number[], fill: string): void {
    const c = this.ctx; c.fillStyle = fill; c.beginPath(); c.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) c.lineTo(points[i], points[i + 1]);
    c.closePath(); c.fill();
    // Cover subpixel seams between adjacent road segments.
    c.strokeStyle = fill; c.lineWidth = 1; c.stroke();
  }
  private car(x: number, y: number, scale: number, player = false): void {
    const c = this.ctx; c.save(); c.translate(x, y); c.scale(scale, scale);
    c.fillStyle = '#0b0b0b'; c.fillRect(-25, -38, 50, 45);
    this.polygon([-23, 0, -19, -48, -12, -61, 12, -61, 19, -48, 23, 0], player ? ARCADE.white : ARCADE.blue);
    this.polygon([-13, -42, -9, -54, 9, -54, 13, -42], ARCADE.bg);
    c.fillStyle = ARCADE.bgSoft; c.fillRect(-13, -30, 26, 15);
    c.fillStyle = player ? ARCADE.dim : ARCADE.white; c.fillRect(-19, -7, 10, 4); c.fillRect(9, -7, 10, 4);
    c.fillStyle = ARCADE.white; c.fillRect(-24, -14, 48, 3); c.restore();
  }
  private text(value: string, x: number, y: number, size = 16, align: CanvasTextAlign = 'left'): void {
    this.ctx.font = `${size}px "Geist Mono", monospace`; this.ctx.textAlign = align;
    this.ctx.fillStyle = ARCADE.white; this.ctx.fillText(value, x, y);
  }
  private hud(): void {
    const c = this.ctx, t = dictionaries[this.opts.locale];
    c.fillStyle = '#121213'; c.fillRect(0, 0, 480, 112);
    if (this.mode === 'highway') {
      this.text('NIGHT RUN', 22, 27, 13);
      this.text(`${Math.round(this.speed)}`, 22, 78, 45);
      this.text('km/h', 118, 78, 13);
      this.text(t['racing.overtakes'], 458, 27, 13, 'right');
      this.text(String(this.cleared).padStart(2, '0'), 458, 66, 30, 'right');
      const next = this.rivals.filter((r) => !r.passed).sort((a,b) => b.z-a.z)[0];
      this.text(next ? `${Math.max(0, Math.round((.9-next.z)*540))} m` : '—', 458, 91, 16, 'right');
      for (let i=0;i<20;i++) { c.fillStyle = i < this.speed/15 ? ARCADE.white : ARCADE.bgSoft; c.fillRect(22+i*9,94,6,4); }
    } else if (this.mode === 'rally') {
      const turn = bend(this.distance+180, this.mode);
      this.text(turn > .2 ? '↶' : turn < -.2 ? '↷' : '↑', 22, 75, 50);
      this.text(t[turn > .2 ? 'racing.left' : turn < -.2 ? 'racing.right' : 'racing.straight'], 88, 42, 18);
      this.text(`${Math.round(this.speed)} km/h`, 88, 72, 16);
      this.text(t['racing.gates'], 458, 27, 13, 'right');
      this.text(String(this.cleared).padStart(2,'0'), 458, 63, 28, 'right');
      const next = this.rivals.filter((r) => !r.passed).sort((a,b) => b.z-a.z)[0];
      c.fillStyle=ARCADE.bgSoft; c.fillRect(315,84,143,5); c.fillStyle=ARCADE.white;
      c.fillRect(315,84,143*clamp((next?.z ?? 0)/.9,0,1),5);
    } else {
      this.text(t['racing.draft'], 240, 26, 14, 'center');
      this.text(`${Math.round(this.charge*100)}%`, 240, 62, 30, 'center');
      for (let i=0;i<16;i++) { c.fillStyle=i<this.charge*16?ARCADE.white:ARCADE.bgSoft; c.fillRect(112+i*16,78,12,7); }
      this.text(`${Math.round(this.speed)}`,22,54,24); this.text('km/h',22,75,12);
      this.text(`${Math.floor(this.distance)}`,458,54,20,'right'); this.text('m',458,75,12,'right');
    }
    if (this.feedback || this.cooldown) {
      c.fillStyle='#121213'; c.fillRect(105,116,270,30);
      this.text(t[this.cooldown ? 'racing.impact' : this.mode === 'rally' ? 'racing.gateClear' : 'racing.cleanPass'],240,137,14,'center');
    }
  }
  protected draw(): void {
    const c = this.ctx; c.fillStyle = '#121213'; c.fillRect(0, 0, 480, 720);
    // Architectural skyline / alpine silhouettes, fixed geometry rather than external assets.
    const horizon = this.road(0).y;
    for (let i = 0; i < 18; i++) {
      const height = 20 + ((i * 47) % 83);
      if (this.mode === 'rally') {
        const peak = horizon-100-height/2;
        this.polygon([i*35-30,horizon,i*35+25,peak,i*35+80,horizon],i%2?'#555552':'#383837');
        this.polygon([i*35+10,peak+30,i*35+25,peak,i*35+40,peak+30,i*35+25,peak+23],ARCADE.white);
      } else if (this.mode === 'highway') { c.fillStyle = i % 2 ? '#29292a' : '#343435'; c.fillRect(i * 29, horizon - height, 23, height); c.fillStyle = '#6b6b68'; for (let j = 0; j < height - 10; j += 15) c.fillRect(i * 29 + 7, horizon+5 - height + j, 3, 4); }
    }
    c.fillStyle = this.mode === 'slipstream' ? '#151516' : this.mode === 'rally' ? '#646460' : '#292928'; c.fillRect(0, horizon, 480, 720-horizon);
    for (let i = 0; i < 60; i++) {
      const a = this.road(i / 60), b = this.road((i + 1) / 60);
      const stripe = Math.floor(i / 3 + (this.reduced ? 0 : this.distance / 25)) % 2 === 0;
      this.polygon([a.x-a.half-8,a.y,a.x+a.half+8,a.y,b.x+b.half+8,b.y,b.x-b.half-8,b.y], this.mode === 'slipstream' ? ARCADE.white : stripe ? ARCADE.white : '#595958');
      this.polygon([a.x-a.half,a.y,a.x+a.half,a.y,b.x+b.half,b.y,b.x-b.half,b.y], stripe ? '#383839' : '#353536');
      if (stripe && this.mode !== 'rally') for (const lane of [-1/3, 1/3]) this.polygon([a.x+a.half*lane-1,a.y,a.x+a.half*lane+1,a.y,b.x+b.half*lane+2,b.y,b.x+b.half*lane-2,b.y], '#aaa9a4');
    }
    for (let i=1;i<9;i++) {
      const z = ((i/9 + (this.reduced ? 0 : this.distance/1800)) % 1);
      const p = this.road(z);
      if (this.mode === 'slipstream') {
        c.strokeStyle='#666665'; c.lineWidth=1+z*3; c.beginPath();
        c.moveTo(p.x-p.half*1.15,p.y); c.lineTo(p.x-p.half*1.15,p.y-180*z);
        c.lineTo(p.x+p.half*1.15,p.y-180*z); c.lineTo(p.x+p.half*1.15,p.y); c.stroke();
      } else for (const side of [-1,1]) {
        const x=p.x+side*(p.half+25*z);
        if(this.mode==='rally') { this.polygon([x-18*z,p.y,x,p.y-70*z,x+18*z,p.y],'#252526'); }
        else { c.strokeStyle=ARCADE.blue;c.lineWidth=2*z;c.beginPath();c.moveTo(x,p.y);c.lineTo(x,p.y-140*z);c.lineTo(x-side*30*z,p.y-140*z);c.stroke(); }
      }
    }
    for (const rival of [...this.rivals].sort((a,b) => a.z-b.z)) {
      const p = this.road(rival.z), x = p.x + rival.x*p.half;
      if (this.mode === 'rally') {
        c.strokeStyle = ARCADE.white; c.lineWidth = Math.max(2, rival.z*5); c.beginPath();
        c.moveTo(x-p.half*.34,p.y); c.lineTo(x-p.half*.34,p.y-65*rival.z); c.lineTo(x+p.half*.34,p.y-65*rival.z); c.lineTo(x+p.half*.34,p.y); c.stroke();
      } else {
        if(this.mode==='slipstream' && rival.z < .9) {
          const back=this.road(Math.min(.9,rival.z+.24));
          c.globalAlpha = drafting(this.x, [rival]) ? .22 : .07;
          this.polygon([x-p.half*.22,p.y,x+p.half*.22,p.y,back.x+(rival.x+.22)*back.half,back.y,back.x+(rival.x-.22)*back.half,back.y],ARCADE.white);c.globalAlpha=1;
        }
        this.car(x,p.y,rival.z*1.2);
      }
    }
    const player = this.road(.9);
    c.globalAlpha = this.cooldown > 0 ? .55 : 1;
    this.car(player.x+this.x*player.half,player.y,this.mode==='slipstream'?1.55:this.mode==='rally'?.95:1.2,true); c.globalAlpha=1;
    this.hud();
  }
  protected stats(): Record<string, number> { return { distance: Math.floor(this.distance) }; }
}
