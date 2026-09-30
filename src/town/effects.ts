import * as T from 'three';
import { type SceneTools, type Roof, type Tree, ribbonGeometry } from './scenery';
import { type Simulation, type TownSettings, eventStrength, lightningState } from './simulation';
import { RIVER_WIDTH, clamp, coastX, isRiver, riverX } from './world';
import type { DamageHistory } from './impacts';

export function createEffects(tools: SceneTools, roofs: Roof[], trees: Tree[]) {
  const { scene, sphere, box, material, trackGeometry, trackMaterial } = tools;
  const instances: T.InstancedMesh[] = [];
  const dummy = new T.Object3D();
  const instanced = (shape: T.BufferGeometry, mat: T.Material, count: number) => {
    const mesh = new T.InstancedMesh(shape, mat, count);
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage); mesh.frustumCulled = false;
    instances.push(mesh); scene.add(mesh); return mesh;
  };
  const pose = (mesh: T.InstancedMesh, i: number, x: number, y: number, z: number, w: number, h: number, d: number, rotation = 0) => {
    dummy.position.set(x, y, z); dummy.scale.set(w, h, d); dummy.rotation.set(0, rotation, 0); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
  };
  const cloudMat = material({ color: 0xf4f4ef, roughness: 1, flatShading: false });
  const clouds = instanced(trackGeometry(new T.SphereGeometry(1, 16, 10)), cloudMat, 126);
  clouds.name = 'opaque-cumulus'; clouds.receiveShadow = false;
  const rainArray = new Float32Array(900 * 6);
  const rainShape = trackGeometry(new T.BufferGeometry());
  rainShape.setAttribute('position', new T.BufferAttribute(rainArray, 3));
  const rainMat = trackMaterial(new T.LineBasicMaterial({ color: 0xc6d4df, transparent: true, opacity: .6, depthWrite: false }));
  const rain = new T.LineSegments(rainShape, rainMat); rain.frustumCulled = false; scene.add(rain);
  const snowArray = new Float32Array(800 * 3);
  const snowShape = trackGeometry(new T.BufferGeometry());
  snowShape.setAttribute('position', new T.BufferAttribute(snowArray, 3));
  const snow = new T.Points(snowShape, trackMaterial(new T.PointsMaterial({ color: 0xffffff, size: .22, transparent: true, opacity: .85, depthWrite: false })));
  snow.frustumCulled = false; scene.add(snow);
  const snowCaps = instanced(box, material({ color: 0xe9edf0, roughness: 1 }), roofs.length);
  snowCaps.name = 'accumulated-roof-snow';
  const leafArray = new Float32Array(240 * 3);
  const leafShape = trackGeometry(new T.BufferGeometry()); leafShape.setAttribute('position', new T.BufferAttribute(leafArray, 3));
  const leafMat = trackMaterial(new T.PointsMaterial({ color: 0xc99c45, size: .18 }));
  const leaves = new T.Points(leafShape, leafMat); leaves.frustumCulled = false; scene.add(leaves);
  const blossom = instanced(sphere, material({ color: 0xe7b7ae, roughness: 1 }), trees.length);

  // Thick, branching discharge channels with an irregular double return stroke.
  const boltMat = trackMaterial(new T.MeshBasicMaterial({ color: 0xf1f2ff, toneMapped: false }));
  const bolts = instanced(trackGeometry(new T.CylinderGeometry(.06, .035, 1, 5)), boltMat, 64);
  bolts.name = 'branched-lightning';
  const lightningLight = new T.PointLight(0xb9c8ff, 0, 230, 1.7); scene.add(lightningLight);
  const up = new T.Vector3(0, 1, 0), direction = new T.Vector3();
  let lastStrike = -1;
  const buildStrike = (cycle: number) => {
    let index = 0;
    const x = Math.sin(cycle * 2.7) * 74, z = 9 + Math.cos(cycle * 4.3) * 48;
    let prior = new T.Vector3(x + 4, 43, z - 2);
    for (let i = 1; i <= 15; i++) {
      const next = new T.Vector3(x + Math.sin(i * 6.7 + cycle) * 2.3, 43 * (1 - i / 15) + .4, z + Math.cos(i * 3.1 + cycle) * 1.7);
      const addSegment = (a: T.Vector3, b: T.Vector3, thickness: number) => {
        direction.subVectors(b, a); dummy.position.copy(a).add(b).multiplyScalar(.5);
        dummy.quaternion.setFromUnitVectors(up, direction.clone().normalize());
        dummy.scale.set(thickness, direction.length(), thickness); dummy.updateMatrix(); bolts.setMatrixAt(index++, dummy.matrix);
      };
      addSegment(prior, next, 1);
      if (i % 3 === 0 && i < 13) {
        let branch = next.clone();
        for (let j = 1; j <= 4; j++) {
          const end = branch.clone().add(new T.Vector3((i % 2 ? -1 : 1) * (1.2 + j * .2), -1.1, Math.sin(j + i)));
          addSegment(branch, end, .52); branch = end;
        }
      }
      prior = next;
    }
    bolts.count = index; bolts.instanceMatrix.needsUpdate = true;
    lightningLight.position.set(x, 24, z);
  };

  const floodMat = material({ color: 0x788c77, roughness: .2, metalness: .1, transparent: true, opacity: .8, side: T.DoubleSide });
  const flood = new T.Mesh(trackGeometry(ribbonGeometry(RIVER_WIDTH)), floodMat); flood.name = 'river-flood'; scene.add(flood);
  const floodPositions = flood.geometry.attributes.position as T.BufferAttribute;
  const crackShape = trackGeometry(new T.BufferGeometry());
  const crackVertices: number[] = [];
  for (let i = 0; i < 45; i++) {
    const x = -83 + i * 3.6, z = 8 + Math.sin(i * 2.8) * 2;
    if (!isRiver(x, z, 2) && !isRiver(x + 3.7, z, 2)) {
      crackVertices.push(x, .34, z, x + 3.7, .34, 8 + Math.sin((i + 1) * 2.8) * 2);
      if (i % 3 === 0) crackVertices.push(x, .34, z, x - 1.6, .34, z + 2.8);
    }
  }
  crackShape.setAttribute('position', new T.Float32BufferAttribute(crackVertices, 3));
  const cracks = new T.LineSegments(crackShape, trackMaterial(new T.LineBasicMaterial({ color: 0x433c30 })));
  scene.add(cracks);
  const rubble = instanced(box, material({ color: 0x9d9789, roughness: 1 }), 100);
  const fire = instanced(trackGeometry(new T.ConeGeometry(1, 1, 7)), material({ color: 0xffa943, emissive: 0xf04d13, emissiveIntensity: 2, roughness: 1 }), 44);
  const fireLight = new T.PointLight(0xff8236, 0, 35, 2); fireLight.position.set(-47, 4, 36.5); scene.add(fireLight);
  const smoke = instanced(sphere, material({ color: 0x535452, roughness: 1, transparent: true, opacity: .43, depthWrite: false }), 46);
  const burn = new T.Mesh(trackGeometry(new T.CircleGeometry(1, 40)), material({ color: 0x574d39, roughness: 1 }));
  burn.rotation.x = -Math.PI / 2; burn.position.set(-47, .39, 36.5); scene.add(burn);
  const waveGeometry = trackGeometry(new T.PlaneGeometry(28, 9, 36, 18));
  const waveMat = material({ color: 0x619bac, roughness: .22, metalness: .07, side: T.DoubleSide });
  const wave = new T.Mesh(waveGeometry, waveMat); wave.name = 'coastal-tsunami'; scene.add(wave);
  const waveFoam = instanced(sphere, material({ color: 0xe5f2e8, roughness: .85 }), 44);
  const wavePositions = waveGeometry.attributes.position as T.BufferAttribute;
  const waveBase = Float32Array.from(wavePositions.array);
  const inundation = new T.Mesh(trackGeometry(new T.PlaneGeometry(32, 29)), floodMat);
  inundation.rotation.x = -Math.PI / 2; inundation.position.set(76, .44, 64); scene.add(inundation);
  const tornado = instanced(sphere, material({ color: 0x6c726e, roughness: 1, transparent: true, opacity: .54, depthWrite: false }), 100);
  const spinningDebris = instanced(box, material({ color: 0x8d826e, roughness: 1 }), 48);
  const hail = instanced(sphere, material({ color: 0xe0ebeb, roughness: .2 }), 200);
  const hailStones = instanced(sphere, material({ color: 0xd7e4e1, roughness: .45 }), 200);
  const slopeDebris = instanced(trackGeometry(new T.IcosahedronGeometry(1, 0)), material({ color: 0x8a7253, roughness: 1 }), 90);
  const mud = new T.Mesh(trackGeometry(new T.PlaneGeometry(18, 12)), material({ color: 0x8c7254, roughness: 1 }));
  mud.rotation.x = -Math.PI / 2; mud.position.set(-95, .34, -55); scene.add(mud);
  const droughtCracks = cracks.clone(); droughtCracks.position.set(15, -.005, 29); scene.add(droughtCracks);
  const seaRipples = instanced(box, trackMaterial(new T.MeshBasicMaterial({ color: 0xc7e1d6 })), 35);
  const riverRipples = instanced(box, trackMaterial(new T.MeshBasicMaterial({ color: 0xa3d0c6 })), 36);

  function update(settings: TownSettings, state: Simulation, reduced: boolean, history: DamageHistory = {}) {
    const t = state.elapsed, age = state.eventAge, strength = eventStrength(settings.disaster, age);
    const active = strength > .04;
    const stormy = settings.weather === 'storm' || settings.weather === 'lightning'
      || active && (settings.disaster === 'tornado' || settings.disaster === 'hailstorm');
    const wet = ['rain', 'storm'].includes(settings.weather);
    const blizzard = settings.weather === 'blizzard';
    clouds.count = (settings.weather === 'clear' || settings.weather === 'heat' ? 4 : stormy ? 18 : 14) * 7;
    cloudMat.color.set(stormy ? 0x656e79 : wet || blizzard ? 0xa5b0b5 : 0xeceee7);
    for (let i = 0; i < clouds.count; i++) {
      const cluster = Math.floor(i / 7), puff = i % 7;
      const x = -103 + ((cluster * 37.1 + t * (stormy ? .5 : .16)) % 213);
      const z = -58 + cluster * 41.7 % 125;
      const angle = puff * 2.4;
      pose(clouds, i, x + Math.sin(angle) * 4.5, 36 + cluster % 3 * 3 + (puff % 3) * 1.4,
        z + Math.cos(angle) * 2.8, 4.2 + puff % 3, 2 + puff % 3 * .9, 3.2 + puff % 2);
    }
    rain.visible = wet || settings.disaster === 'flood' && active;
    snow.visible = settings.weather === 'snow' || blizzard;
    for (let i = 0; i < 900 && rain.visible; i++) {
      const j = i * 6, x = -106 + i * 17.13 % 212, z = -65 + i * 11.71 % 144;
      const y = ((i * 3.71 - t * 21) % 34 + 34) % 34;
      rainArray[j] = x; rainArray[j + 1] = y + 1.6; rainArray[j + 2] = z;
      rainArray[j + 3] = x + (stormy ? 1.1 : .18); rainArray[j + 4] = y; rainArray[j + 5] = z + .12;
    }
    rainShape.attributes.position.needsUpdate = rain.visible;
    for (let i = 0; i < 800 && snow.visible; i++) {
      const j = i * 3;
      snowArray[j] = -106 + (i * 13.27 + t * (blizzard ? 8 : .6)) % 212;
      snowArray[j + 1] = ((i * 4.13 - t * (blizzard ? 5 : 2)) % 32 + 32) % 32;
      snowArray[j + 2] = -65 + i * 19.43 % 144 + Math.sin(t + i) * .5;
    }
    snowShape.attributes.position.needsUpdate = snow.visible;
    snowCaps.visible = state.snowCover > .01;
    roofs.forEach((roof, i) => pose(snowCaps, i, roof.x, roof.y + .03 + state.snowCover * .12, roof.z, roof.w, .04 + state.snowCover * .25, roof.d));
    leaves.visible = (settings.season === 'autumn' || settings.season === 'spring') && settings.climate !== 'arid';
    leafMat.color.set(settings.season === 'spring' ? 0xe1b8b1 : 0xc39746);
    for (let i = 0; i < 240 && leaves.visible; i++) {
      const tree = trees[i % trees.length], j = i * 3;
      leafArray[j] = tree.x + Math.sin(i + t * .6) * 1.4;
      leafArray[j + 1] = .25 + ((i * 1.37 - t * .32) % 3.1 + 3.1) % 3.1;
      leafArray[j + 2] = tree.z + Math.cos(i * 3 + t * .4) * 1.4;
    }
    leafShape.attributes.position.needsUpdate = leaves.visible;
    blossom.visible = settings.season === 'spring' && settings.climate !== 'arid';
    trees.forEach((tree, i) => pose(blossom, i, tree.x + .3, 2.4 * tree.size, tree.z + .6, .4, .33, .35));
    const strike = lightningState(t, stormy, reduced);
    if (strike.cycle !== lastStrike) { buildStrike(strike.cycle); lastStrike = strike.cycle; }
    bolts.visible = strike.visible; lightningLight.intensity = strike.visible ? 2200 : 0;
    flood.visible = settings.disaster === 'flood' && active;
    if (flood.visible) {
      for (let i = 0; i < floodPositions.count; i++) {
        const z = floodPositions.getZ(i);
        floodPositions.setX(i, riverX(z) + (i % 2 ? 1 : -1) * (RIVER_WIDTH / 2 + strength * (9 + Math.sin(z * .07) * 3)));
        floodPositions.setY(i, .15 + strength * 1.15 + Math.sin(z * .6 + t * 1.4) * .045);
      }
      floodPositions.needsUpdate = true; flood.geometry.computeVertexNormals();
    }
    cracks.visible = (history.earthquake ?? 0) > .2 || settings.disaster === 'earthquake' && active;
    rubble.visible = settings.disaster === 'earthquake' && active;
    for (let i = 0; i < 100 && rubble.visible; i++) {
      const roof = roofs[i % roofs.length];
      pose(rubble, i, roof.x + (i % 2 ? 1 : -1) * (roof.w / 2 + .7), .4, roof.z + Math.sin(i * 4.1) * roof.d / 2,
        .2 + (i % 3) * .2, .1 + (i % 5) * .09, .4, i);
    }
    fire.visible = smoke.visible = settings.disaster === 'wildfire' && active;
    burn.visible = (history.wildfire ?? 0) > .05 || fire.visible;
    fireLight.intensity = fire.visible ? strength * (42 + Math.sin(t * 7) * 7) : 0;
    burn.scale.setScalar(1 + Math.max(strength, history.wildfire ?? 0) * 8);
    for (let i = 0; i < 44 && fire.visible; i++) {
      const a = i * 2.4, radius = (1 + i % 7) * strength;
      pose(fire, i, -47 + Math.sin(a) * radius, .5 + strength * .7, 36.5 + Math.cos(a) * radius * .7,
        .35 + strength * .45, .5 + strength * (1.4 + Math.sin(t * 8 + i) * .5), .35 + strength * .45);
    }
    for (let i = 0; i < 46 && smoke.visible; i++) {
      const height = .7 + (i * .73 + t * 1.5) % 24;
      pose(smoke, i, -47 + Math.sin(i * 6.1) * 4 * strength + height * .25, height, 36.5 + Math.cos(i * 3) * 3,
        (1 + height * .13) * strength, 1 + height * .08, (1 + height * .1) * strength);
    }
    wave.visible = waveFoam.visible = inundation.visible = settings.disaster === 'tsunami' && active;
    if (settings.disaster === 'tsunami') {
      const approach = clamp(age / 23, 0, 1), height = 1 + 6 * strength;
      wave.position.set(87, .15, 78 - approach * 18);
      for (let i = 0; i < wavePositions.count; i++) {
        const fraction = (waveBase[i * 3 + 1] + 4.5) / 9;
        wavePositions.setXYZ(i, waveBase[i * 3], Math.sin(fraction * Math.PI / 2) * height,
          fraction * -4 + Math.sin(fraction * Math.PI) * -1.6 + Math.sin(waveBase[i * 3] * .3 + t) * .12);
      }
      wavePositions.needsUpdate = true; waveGeometry.computeVertexNormals();
      for (let i = 0; i < 44; i++) pose(waveFoam, i, 73 + i * .64, height + Math.sin(i + t) * .14, wave.position.z - 4,
        .45, .2 + strength * .15, .45);
      inundation.scale.set(1, clamp((age - 18) / 18, 0, 1) * strength, 1);
      inundation.position.y = .25 + strength * .75;
    }
    tornado.visible = spinningDebris.visible = settings.disaster === 'tornado' && active;
    const funnelX = 24 + Math.sin(age * .055) * 24, funnelZ = 13 + Math.sin(age * .07) * 31;
    for (let i = 0; i < 100 && tornado.visible; i++) {
      const fraction = i / 100, radius = .45 + fraction * 5.5, angle = t * 5 + fraction * 38;
      pose(tornado, i, funnelX + Math.sin(angle) * radius, .5 + fraction * 33 * strength,
        funnelZ + Math.cos(angle) * radius, (.7 + fraction * 1.8) * strength, 1.3 * strength, (.7 + fraction * 1.8) * strength);
    }
    for (let i = 0; i < 48 && spinningDebris.visible; i++) {
      const height = (i * 1.7 + t * 2) % 24, angle = t * 4 + i;
      pose(spinningDebris, i, funnelX + Math.sin(angle) * (2 + height * .17), height * strength,
        funnelZ + Math.cos(angle) * (2 + height * .17), .18, .14, .4, angle);
    }
    hail.visible = settings.disaster === 'hailstorm' && active;
    hailStones.visible = hail.visible || (history.hailstorm ?? 0) > .05;
    for (let i = 0; i < 200 && hailStones.visible; i++) {
      const x = -102 + i * 13.71 % 202, z = -61 + i * 31.23 % 133;
      const flight = ((i * 3.17 - t * 19) % 29 + 29) % 29;
      pose(hail, i, x + flight * .1, .35 + flight, z, .12 + strength * .13, .12 + strength * .13, .12 + strength * .13);
      const cover = Math.max(strength, history.hailstorm ?? 0);
      pose(hailStones, i, x, .35, z, cover * .17, cover * .12, cover * .17);
    }
    mud.visible = slopeDebris.visible = settings.disaster === 'landslide' && active || (history.landslide ?? 0) > .05;
    const slope = Math.max(strength, history.landslide ?? 0);
    mud.scale.set(1, slope, 1);
    for (let i = 0; i < 90 && slopeDebris.visible; i++) {
      const travel = clamp((slope * 8 - i * .045) / 6, 0, 1);
      const size = .3 + (i % 4) * .15;
      pose(slopeDebris, i, -102 + travel * (6 + i % 6 * 1.4), .35 + (1 - travel) * (3 + i % 5),
        -62 + travel * (4 + i % 8 * .8), size, size, size, i + travel * 5);
    }
    droughtCracks.visible = (history.drought ?? 0) > .3 || settings.disaster === 'drought' && strength > .3;
    for (let i = 0; i < 35; i++) {
      const z = 56 + i * 3.71 % 23;
      const x = coastX(z) + 2 + ((i * 2.4 + t * .55) % 28);
      pose(seaRipples, i, x, .19 + Math.sin(t * 1.8 + i) * .025, z, .16, .02, 1 + i % 3 * .7, Math.PI * .12);
    }
    for (let i = 0; i < 36; i++) {
      const z = -64 + ((i * 4.1 + t * .55) % 142);
      pose(riverRipples, i, riverX(z) + Math.sin(i * 4.1) * 2, .17, z, .6, .013, .13);
    }
    for (const mesh of instances) mesh.instanceMatrix.needsUpdate = true;
    return { flash: strike.visible && !reduced ? .6 : 0, strength };
  }
  return { update, dispose() { instances.forEach(mesh => mesh.dispose()); } };
}
