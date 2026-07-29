export type SfxName = 'tap' | 'good' | 'bad' | 'life' | 'over' | 'record' | 'coin' | 'tick';

const STORAGE_KEY = 'ihnttd.muted';

class Sfx {
  private ctx: AudioContext | null = null;
  private mutedFlag: boolean;

  constructor() {
    let saved = false;
    try {
      saved = localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      /* abaikan */
    }
    this.mutedFlag = saved;
  }

  get muted(): boolean {
    return this.mutedFlag;
  }

  unlock(): void {
    if (!this.ctx) {
      try {
        this.ctx = new AudioContext();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
  }

  toggleMute(): boolean {
    this.mutedFlag = !this.mutedFlag;
    try {
      localStorage.setItem(STORAGE_KEY, this.mutedFlag ? '1' : '0');
    } catch {
      /* abaikan */
    }
    return this.mutedFlag;
  }

  play(name: SfxName): void {
    if (this.mutedFlag || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'tap':
        this.blip(880, 0.04, 'square', t);
        break;
      case 'tick':
        this.blip(660, 0.03, 'square', t, 0.04);
        break;
      case 'good':
        this.blip(660, 0.06, 'square', t);
        this.blip(990, 0.08, 'square', t + 0.06);
        break;
      case 'coin':
        this.blip(990, 0.05, 'square', t);
        this.blip(1320, 0.12, 'square', t + 0.05);
        break;
      case 'bad':
        this.blip(180, 0.15, 'sawtooth', t, 0.09);
        break;
      case 'life':
        this.blip(240, 0.1, 'sawtooth', t, 0.09);
        this.blip(120, 0.2, 'sawtooth', t + 0.1, 0.09);
        break;
      case 'over':
        this.blip(392, 0.14, 'square', t);
        this.blip(311, 0.14, 'square', t + 0.15);
        this.blip(233, 0.3, 'square', t + 0.3);
        break;
      case 'record':
        this.blip(523, 0.09, 'square', t);
        this.blip(659, 0.09, 'square', t + 0.09);
        this.blip(784, 0.09, 'square', t + 0.18);
        this.blip(1047, 0.2, 'square', t + 0.27);
        break;
    }
  }

  private blip(freq: number, dur: number, type: OscillatorType, when: number, gain = 0.06): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, when);
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(g).connect(this.ctx.destination);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }
}

export const sfx = new Sfx();
