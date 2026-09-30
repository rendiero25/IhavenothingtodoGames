import * as T from 'three';
import { afterEach, describe, expect, it } from 'vitest';
import { createEffects } from './effects';
import type { SceneTools } from './scenery';
import { createSimulation, type TownSettings } from './simulation';
import { riverX } from './world';

const settings: TownSettings = { weather: 'clear', disaster: 'none', season: 'summer', climate: 'temperate', hour: 14, playing: false, speed: 1 };
const cleanups: Array<() => void> = [];
afterEach(() => { cleanups.splice(0).forEach(dispose => dispose()); });
function setup() {
  const scene = new T.Scene(), shapes: T.BufferGeometry[] = [], materials: T.Material[] = [];
  const tools: SceneTools = { scene, box: new T.BoxGeometry(), sphere: new T.SphereGeometry(1, 8, 6),
    trackGeometry: shape => { shapes.push(shape); return shape; },
    trackMaterial: mat => { materials.push(mat); return mat; },
    material: options => { const mat = new T.MeshStandardMaterial(options); materials.push(mat); return mat; },
  };
  const effects = createEffects(tools, [{ x: 0, z: 0, y: 10, w: 8, d: 6 }], [{ x: 0, z: 0, size: 1 }]);
  cleanups.push(() => { effects.dispose(); tools.box.dispose(); tools.sphere.dispose(); shapes.forEach(s => s.dispose()); materials.forEach(m => m.dispose()); });
  return { scene, effects };
}

describe('city environmental effects', () => {
  it('uses solid shaded cloud volumes instead of transparent spheres', () => {
    const { scene, effects } = setup(); effects.update(settings, createSimulation(), false);
    const clouds = scene.getObjectByName('opaque-cumulus') as T.InstancedMesh<T.BufferGeometry, T.MeshStandardMaterial>;
    expect(clouds.material.transparent).toBe(false); expect(clouds.material.opacity).toBe(1);
    expect(clouds.material.depthWrite).toBe(true);
  });
  it('flood water grows along the actual river bends, rather than covering the entire town', () => {
    const { scene, effects } = setup(); const state = createSimulation();
    effects.update({ ...settings, disaster: 'flood' }, state, false);
    const flood = scene.getObjectByName('river-flood') as T.Mesh;
    const p = flood.geometry.attributes.position;
    const initialWidth = p.getX(1) - p.getX(0);
    state.eventAge = 20; effects.update({ ...settings, disaster: 'flood' }, state, false);
    expect(p.getX(1) - p.getX(0)).toBeGreaterThan(initialWidth);
    for (let i = 0; i < p.count; i += 2) expect((p.getX(i) + p.getX(i + 1)) / 2).toBeCloseTo(riverX(p.getZ(i)), 4);
  });
  it('a curved tsunami travels from the south-east shore and loses strength over time', () => {
    const { scene, effects } = setup(); const state = { ...createSimulation(), eventAge: 20 };
    effects.update({ ...settings, disaster: 'tsunami' }, state, false);
    const wave = scene.getObjectByName('coastal-tsunami') as T.Mesh;
    expect(wave.position.x).toBeGreaterThan(65); expect(wave.position.z).toBeGreaterThan(54);
    const p = wave.geometry.attributes.position;
    const peak = Math.max(...Array.from({ length: p.count }, (_, i) => p.getY(i)));
    state.eventAge = 150; effects.update({ ...settings, disaster: 'tsunami' }, state, false);
    expect(Math.max(...Array.from({ length: p.count }, (_, i) => p.getY(i)))).toBeLessThan(peak);
  });
  it('lightning has branching volume and does not flash under reduced motion', () => {
    const { scene, effects } = setup(); const state = { ...createSimulation(), elapsed: 1.15 };
    effects.update({ ...settings, weather: 'lightning' }, state, false);
    const bolts = scene.getObjectByName('branched-lightning') as T.InstancedMesh;
    expect(bolts.visible).toBe(true); expect(bolts.count).toBeGreaterThan(25);
    const result = effects.update({ ...settings, weather: 'lightning' }, state, true);
    expect(bolts.visible).toBe(false); expect(result.flash).toBe(0);
  });
  it('every weather, disaster and season combination keeps finite render data', () => {
    const { scene, effects } = setup();
    for (const weather of ['clear', 'cloudy', 'rain', 'storm', 'lightning', 'snow', 'fog', 'heat', 'blizzard'] as const) {
      for (const disaster of ['none', 'flood', 'earthquake', 'wildfire', 'tsunami', 'tornado', 'hailstorm', 'landslide', 'drought'] as const) {
        for (const season of ['spring', 'summer', 'autumn', 'winter'] as const) {
          effects.update({ ...settings, weather, disaster, season }, { ...createSimulation(), elapsed: 20, eventAge: 20, snowCover: .8 }, false);
          scene.traverse(object => {
            if (object instanceof T.InstancedMesh && object.visible) {
              expect(Array.from(object.instanceMatrix.array).every(Number.isFinite), `${weather}/${disaster}/${season}`).toBe(true);
            }
            if (object instanceof T.Mesh && object.visible) {
              expect(Array.from(object.geometry.attributes.position.array).every(Number.isFinite)).toBe(true);
            }
          });
        }
      }
    }
  });
});
