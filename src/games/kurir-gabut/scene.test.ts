import { it, expect, vi } from 'vitest';
import * as T from 'three';
import { createVillage } from './scene';
import { createState } from './logic';

it('builds a bounded texture-free village and disposes shared resources',()=>{
  const v=createVillage(),s=createState();
  let meshes=0,triangles=0;
  const geometries=new Set<T.BufferGeometry>();
  v.scene.traverse(o=>{if(o instanceof T.Mesh){meshes++;geometries.add(o.geometry);triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
  expect(meshes).toBeLessThan(320);expect(triangles).toBeLessThan(30000);
  v.update(s,1,true,true,.5);expect(v.camera).toBeInstanceOf(T.PerspectiveCamera);
  expect(v.camera.aspect).toBe(.5);expect(v.camera.position.y).toBeLessThanOrEqual(3);
  expect(v.camera.position.z).toBeGreaterThan(s.z);
  s.delivery=5;s.completed=true;v.update(s,2,false,false,1.8);
  expect(v.camera.aspect).toBeCloseTo(1.8);
  const spies=[...geometries].map(g=>vi.spyOn(g,'dispose'));
  v.dispose();spies.forEach(spy=>expect(spy).toHaveBeenCalledOnce());expect(v.scene.children).toHaveLength(0);
});
