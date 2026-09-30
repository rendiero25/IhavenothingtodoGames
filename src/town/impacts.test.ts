import { describe, expect, it } from 'vitest';
import * as T from 'three';
import { createImpacts, damageAt, impactAt, recordDamage, type DamageHistory, type Disaster } from './impacts';
import type { SceneTools } from './scenery';

describe('disaster exposure and lasting aftermath', () => {
  it('records cumulative damage for every event, preserving it through None and time reversal', () => {
    for (const kind of ['flood', 'earthquake', 'wildfire', 'tsunami', 'tornado', 'hailstorm', 'landslide', 'drought'] as Disaster[]) {
      const history: DamageHistory = {};
      recordDamage(history, kind, 0); expect(history[kind]).toBe(0);
      recordDamage(history, kind, 20); expect(history[kind]).toBeGreaterThan(0);
      recordDamage(history, kind, 90); expect(history[kind]).toBe(1);
      recordDamage(history, 'none', 0); recordDamage(history, kind, 1); expect(history[kind]).toBe(1);
    }
  });
  it('tsunami damage starts when the wave arrives, not while it is still offshore', () => {
    const history: DamageHistory = {};
    recordDamage(history, 'tsunami', 10); expect(history.tsunami).toBe(0);
    recordDamage(history, 'tsunami', 24); expect(history.tsunami).toBeGreaterThan(0);
  });
  it('localizes flood, coastal and hillside damage to the source rather than the whole city', () => {
    expect(impactAt('flood', 0, 10)).toBeGreaterThan(impactAt('flood', -80, 10));
    expect(impactAt('wildfire', -47, 36.5)).toBe(1); expect(impactAt('wildfire', 75, -40)).toBe(0);
    expect(impactAt('tsunami', 76, 61)).toBeGreaterThan(.5); expect(impactAt('tsunami', -70, -40)).toBe(0);
    expect(impactAt('landslide', -96, -55)).toBe(1); expect(impactAt('landslide', 75, 61)).toBe(0);
    expect(damageAt({ flood: 1 }, -80, 10).strength).toBe(0);
  });
  it('keeps roof damage, broken glass and debris after the event; repair clears all layers', () => {
    const geometries: T.BufferGeometry[] = [], materials: T.Material[] = [];
    const scene = new T.Scene();
    const tools: SceneTools = { scene, box: new T.BoxGeometry(), sphere: new T.SphereGeometry(),
      material: p => { const m = new T.MeshStandardMaterial(p); materials.push(m); return m; },
      trackGeometry: g => { geometries.push(g); return g; }, trackMaterial: m => { materials.push(m); return m; } };
    const effects = createImpacts(tools, [{ x: -47, z: 9, w: 8, d: 12, y: 14 }], []);
    expect(effects.stats().debris).toBe(0);
    effects.update('earthquake', 4); expect(effects.stats().debris).toBeGreaterThan(0);
    expect(effects.stats().brokenWindows).toBeGreaterThan(0);
    effects.update('none', 0); expect(effects.stats().debris).toBeGreaterThan(0);
    expect(scene.getObjectByName('damaged-roofs')!.visible).toBe(true);
    const windows = effects.stats().brokenWindows;
    effects.update('hailstorm', 30); effects.update('drought', 90);
    expect(effects.stats().brokenWindows).toBeGreaterThanOrEqual(windows);
    effects.repair(); expect(effects.stats().damage).toEqual({}); expect(effects.stats().debris).toBe(0);
    expect(scene.getObjectByName('damaged-roofs')!.visible).toBe(false);
    effects.dispose(); geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); tools.box.dispose(); tools.sphere.dispose();
  });
});
