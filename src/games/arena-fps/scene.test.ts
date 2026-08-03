import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { createEnemyObject, seedContainerPlacements } from './scene';

describe('seedContainerPlacements', () => {
  it('keeps seed 18 containers out of the player spawn safety box', () => {
    const safetyBox = new THREE.Box3(new THREE.Vector3(-2, 0, 10.5), new THREE.Vector3(2, 3, 17.5));
    const placements = seedContainerPlacements(18);

    expect(placements).toHaveLength(10);
    expect(placements.length).toBeGreaterThanOrEqual(8);
    expect(placements.length).toBeLessThanOrEqual(14);
    expect(placements[1].rotationY).toBe(Math.PI / 2);

    for (const placement of placements) {
      expect(Math.abs(placement.x)).toBeLessThanOrEqual(20);
      expect(Math.abs(placement.z)).toBeLessThanOrEqual(26);
      const horizontalLength = placement.rotationY === 0 ? placement.length : 2.35;
      const verticalLength = placement.rotationY === 0 ? 2.35 : placement.length;
      const collider = new THREE.Box3(
        new THREE.Vector3(placement.x - horizontalLength / 2, 0, placement.z - verticalLength / 2),
        new THREE.Vector3(placement.x + horizontalLength / 2, 2.9, placement.z + verticalLength / 2),
      );
      expect(collider.intersectsBox(safetyBox)).toBe(false);
    }
  });
});

describe('createEnemyObject', () => {
  it('creates a distinct low-poly silhouette and hit metadata for every enemy kind', () => {
    const kinds = ['drone', 'runner', 'turret', 'soldier', 'zombie'] as const;
    const silhouettes = new Set<string>();
    const bodyColors = new Set<string>();

    for (const kind of kinds) {
      const enemy = createEnemyObject({ id: kind, kind, x: 0, z: 0, yaw: 0, health: 100, boss: false });
      const meshes = enemy.children.filter((child): child is THREE.Mesh => child instanceof THREE.Mesh);
      silhouettes.add(meshes.map((mesh) => mesh.geometry.type).join('|'));
      bodyColors.add((meshes[0].material as THREE.MeshStandardMaterial).color.getHexString());
      expect(meshes.map((mesh) => mesh.userData.hitPart)).toContain('body');
      expect(meshes.map((mesh) => mesh.userData.hitPart)).toContain('head');
    }

    expect(silhouettes.size).toBe(5);
    expect(bodyColors.size).toBe(5);
  });
});
