import { clamp } from './world';

export type TownSettings = {
  weather: 'clear' | 'cloudy' | 'rain' | 'storm' | 'lightning' | 'snow' | 'fog' | 'heat' | 'blizzard';
  disaster: 'none' | 'flood' | 'earthquake' | 'wildfire' | 'tsunami' | 'tornado' | 'hailstorm' | 'landslide' | 'drought';
  season: 'spring' | 'summer' | 'autumn' | 'winter';
  climate: 'temperate' | 'tropical' | 'arid';
  hour: number;
  /** Advances only the sun/clock. City activity has its own time base. */
  playing: boolean;
  speed: number;
};
export type Simulation = { elapsed: number; traffic: number; pedestrians: number; eventAge: number; snowCover: number };
export type EventPhase = 'calm' | 'onset' | 'peak' | 'aftermath';
export const createSimulation = (): Simulation => ({ elapsed: 0, traffic: 0, pedestrians: 0, eventAge: 0, snowCover: 0 });
export function eventStrength(disaster: TownSettings['disaster'], age: number) {
  if (disaster === 'none') return 0;
  if (disaster === 'earthquake') return clamp(age / 1.5, 0, 1) * Math.exp(-Math.max(0, age - 5) * .1);
  if (disaster === 'tsunami') return clamp(age / 10, 0, 1) * Math.exp(-Math.max(0, age - 35) * .06);
  if (disaster === 'landslide') return clamp(age / 8, 0, 1) * Math.exp(-Math.max(0, age - 12) * .08);
  return clamp(age / (disaster === 'drought' ? 28 : 12), 0, 1) * Math.exp(-Math.max(0, age - 35) * .11);
}
export function eventPhase(disaster: TownSettings['disaster'], age: number): EventPhase {
  if (disaster === 'none') return 'calm';
  if (age < (disaster === 'earthquake' ? 1.5 : 12)) return 'onset';
  return eventStrength(disaster, age) <= .04 ? 'aftermath' : 'peak';
}
export function stepSimulation(state: Simulation, settings: TownSettings, delta: number) {
  const dt = clamp(delta, 0, .1) * settings.speed;
  state.elapsed += dt;
  state.eventAge += dt;
  const severe = ['storm', 'blizzard'].includes(settings.weather);
  const night = settings.hour < 6 || settings.hour >= 21;
  const emergency = eventStrength(settings.disaster, state.eventAge) > .05;
  state.traffic += dt * (severe ? .55 : 1) * (emergency ? .48 : 1);
  state.pedestrians += dt * (emergency ? 1.4 : severe ? .55 : night ? .65 : 1);
  const snowing = settings.weather === 'snow' || settings.weather === 'blizzard'
    || settings.season === 'winter' && settings.climate !== 'tropical';
  state.snowCover = clamp(state.snowCover + dt * (snowing ? .025 : -.045), 0, 1);
}
/** Stable irregular strikes, including a short return stroke. No strobe in reduced motion. */
export function lightningState(elapsed: number, enabled: boolean, reduced: boolean) {
  const cycle = Math.floor(elapsed / 7.3);
  const phase = elapsed % 7.3;
  const delay = 1.1 + Math.sin(cycle * 7.91) * .65;
  return { cycle, visible: enabled && !reduced && (phase > delay && phase < delay + .09
    || phase > delay + .19 && phase < delay + .25) };
}
