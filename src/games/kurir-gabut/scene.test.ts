import { it, expect, vi } from 'vitest';
import * as T from 'three';
import { createVillage } from './scene';
import { createState, HOME_BUILDINGS, RESIDENTS, knock, tickDelivery } from './logic';
import { createActivity } from './simulation';

it('builds a bounded procedural village and disposes shared resources',()=>{
  const v=createVillage(),s=createState();
  let meshes=0,triangles=0;
  const geometries=new Set<T.BufferGeometry>();
  const textures=new Set<T.Texture>();
  v.scene.traverse(o=>{if(o instanceof T.Mesh){
    meshes++;geometries.add(o.geometry);triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3*(o instanceof T.InstancedMesh?o.count:1);
    const mat=o.material as T.MeshBasicMaterial;if(mat.map)textures.add(mat.map);
  }});
  console.info('Courier geometry budget',{meshes,triangles});
  expect(meshes).toBeLessThan(500);expect(triangles).toBeLessThan(200000);
  v.update(s,1,true,true,.5);expect(v.camera).toBeInstanceOf(T.PerspectiveCamera);
  expect(v.camera.aspect).toBe(.5);expect(v.camera.position.y).toBeLessThanOrEqual(3.5);
  expect(v.camera.position.z).toBeGreaterThan(s.z);
  s.delivery=5;s.completed=true;v.update(s,2,false,false,1.8);
  expect(v.camera.aspect).toBeCloseTo(1.8);
  const spies=[...geometries].map(g=>vi.spyOn(g,'dispose'));
  const textureSpies=[...textures].map(t=>vi.spyOn(t,'dispose'));
  v.dispose();[...spies,...textureSpies].forEach(spy=>expect(spy).toHaveBeenCalledOnce());expect(v.scene.children).toHaveLength(0);
});
it('switches daylight and weather without rebuilding the world and carries the parcel on the back',()=>{
  const v=createVillage(),s=createState();v.update(s,0,false,true,1.6);
  const day=(v.scene.background as T.Color).getHex(),count=v.scene.children.length;
  expect(v.parcel.visible).toBe(false);
  s.carrying=true;s.day='night';s.weather='storm';v.update(s,2,true,true,1.6);
  expect(v.parcel.visible).toBe(true);expect(v.parcel.parent).toBe(v.player.group);expect(v.parcel.children.some(p=>p.position.z<0)).toBe(true);
  expect((v.scene.background as T.Color).getHex()).not.toBe(day);
  expect(v.scene.children.length).toBe(count);
  let visibleRain=false;v.scene.traverse(o=>{if(o instanceof T.LineSegments&&o.visible)visibleRain=true;});
  expect(visibleRain).toBe(true);
  s.carrying=false;s.weather='clear';s.day='morning';v.update(s,3,false,false,1.6);expect(v.parcel.visible).toBe(false);v.dispose();
});
it('keeps recipients indoors until knocked and animates the door and walk out',()=>{
  const activity=createActivity(),v=createVillage(activity),s=createState();s.riding=false;v.update(s,0,false,false,1.6);
  expect(v.residents.every(p=>!p.group.visible)).toBe(true);
  Object.assign(s,RESIDENTS[1]);s.carrying=true;expect(knock(s)).toBe(true);
  tickDelivery(s,.75);v.update(s,.75,false,false,1.6);
  expect(v.residents[1].group.visible).toBe(true);
  expect(v.doorPivots[HOME_BUILDINGS[1]].rotation.y).toBeLessThan(-.5);
  expect(v.residents[1].group.position.z).toBeLessThan(RESIDENTS[1].z);
  tickDelivery(s,.75);Object.assign(activity.residents[1].state,RESIDENTS[1]);v.update(s,1.5,false,false,1.6);
  expect(v.residents[1].group.position.z).toBeCloseTo(RESIDENTS[1].z);
  tickDelivery(s,.7);s.x=40;tickDelivery(s,2.5);v.update(s,5,false,false,1.6);
  expect(v.residents[1].group.visible).toBe(false);
  expect(v.doorPivots[HOME_BUILDINGS[1]].rotation.y).toBe(0);v.dispose();
});
