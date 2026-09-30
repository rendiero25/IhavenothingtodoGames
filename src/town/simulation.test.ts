import { describe, expect, it } from 'vitest';
import { createSimulation, eventStrength, eventPhase, lightningState, stepSimulation, type TownSettings } from './simulation';
const settings: TownSettings = { hour: 16, playing: false, weather: 'clear', disaster: 'none', season: 'summer', climate: 'temperate', speed: 1 };

describe('independent city activity', () => {
  it('traffic, residents, and event time advance while the clock is paused', () => {
    const state = createSimulation();
    for (let i = 0; i < 100; i++) stepSimulation(state, settings, .05);
    expect(state.elapsed).toBeCloseTo(5); expect(state.traffic).toBeCloseTo(5);
    expect(state.pedestrians).toBeCloseTo(5); expect(settings.hour).toBe(16);
  });
  it('a paused/playing clock yields identical simulation steps', () => {
    const a = createSimulation(), b = createSimulation();
    stepSimulation(a, settings, .05); stepSimulation(b, { ...settings, playing: true }, .05);
    expect(a).toEqual(b);
  });
  it('weather changes activity speeds without stopping the city', () => {
    const a = createSimulation(), b = createSimulation();
    stepSimulation(a, settings, .05); stepSimulation(b, { ...settings, weather: 'storm', hour: 1 }, .05);
    expect(b.traffic).toBeGreaterThan(0); expect(b.traffic).toBeLessThan(a.traffic);
    expect(b.pedestrians).toBeGreaterThan(0);
  });
  it('accumulates roof snow, then melts when conditions warm', () => {
    const state = createSimulation();
    for (let i = 0; i < 500; i++) stepSimulation(state, { ...settings, season: 'winter' }, .1);
    expect(state.snowCover).toBeCloseTo(1);
    for (let i = 0; i < 500; i++) stepSimulation(state, settings, .1);
    expect(state.snowCover).toBe(0);
  });
  it('simulation speed affects activity without changing the hour', () => {
    const state = createSimulation(); stepSimulation(state, { ...settings, speed: 3 }, .1);
    expect(state.elapsed).toBeCloseTo(.3); expect(settings.hour).toBe(16);
  });
});
describe('natural event envelopes', () => {
  it('disasters develop instead of appearing at full strength', () => {
    for (const disaster of ['flood', 'wildfire', 'tsunami', 'tornado', 'hailstorm', 'landslide', 'drought'] as const) {
      expect(eventStrength(disaster, 0)).toBe(0);
      expect(eventStrength(disaster, 3)).toBeLessThan(eventStrength(disaster, 14));
    }
  });
  it('quake shaking and tsunami waves subside after their peak', () => {
    expect(eventStrength('earthquake', 70)).toBeLessThan(.01);
    expect(eventStrength('tsunami', 150)).toBeLessThan(.01);
  });
  it('all hazards subside for the aftermath preview, unlike accumulated damage', () => {
    for (const disaster of ['flood', 'earthquake', 'wildfire', 'tsunami', 'tornado', 'hailstorm', 'landslide', 'drought'] as const)
      expect(eventStrength(disaster, 150)).toBeLessThan(.01);
  });
  it('reports onset, peak and aftermath for each event and calm for None', () => {
    for (const kind of ['flood', 'earthquake', 'wildfire', 'tsunami', 'tornado', 'hailstorm', 'landslide', 'drought'] as const) {
      expect(eventPhase(kind, 0)).toBe('onset');
      expect(eventPhase(kind, kind === 'earthquake' ? 4 : kind === 'landslide' ? 12 : 24)).toBe('peak');
      expect(eventPhase(kind, 90)).toBe('aftermath');
    }
    expect(eventPhase('none', 90)).toBe('calm');
  });
  it('lightning is brief, irregular, with reduced-motion flashes disabled', () => {
    let strikes = 0;
    for (let t = 0; t < 100; t += .025) {
      const strike = lightningState(t, true, false);
      if (strike.visible) strikes++;
      expect(lightningState(t, true, true).visible).toBe(false);
      expect(lightningState(t, false, false).visible).toBe(false);
    }
    expect(strikes).toBeGreaterThan(0);
    expect(strikes).toBeLessThan(150);
  });
});
