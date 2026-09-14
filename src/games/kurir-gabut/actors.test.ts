import {expect,it} from 'vitest';
import * as T from 'three';
import {createAssets} from './assets';

it('uses human proportions and aligns the mounted rider with grips and foot pegs',()=>{
  const assets=createAssets(),person=assets.person(0xbba481,0xbe9671,true,false),bike=assets.vehicle(true,0x466a70,false);
  person.animate(0,false,true);const standing=new T.Box3().setFromObject(person.group);
  expect(standing.max.y).toBeGreaterThan(1.7);expect(standing.max.y).toBeLessThan(1.9);expect(standing.min.y).toBeGreaterThan(-.02);
  for(const steer of [-.28,0,.28]){
    person.ride(steer);person.group.updateMatrixWorld(true);
    person.hands.forEach((hand,i)=>{
      const side=i===0?-1:1,grip=new T.Vector3(side*.315,1.085,-.12).applyAxisAngle(new T.Vector3(0,1,0),steer).add(new T.Vector3(0,0,.52));
      const palm=hand.localToWorld(new T.Vector3(0,-.05,.012));expect(palm.distanceTo(grip)).toBeLessThan(.08);
      const sole=person.feet[i].localToWorld(new T.Vector3(0,-.053,.048));expect(sole.distanceTo(new T.Vector3(side*.3,.4,-.12))).toBeLessThan(.09);
    });
  }
  person.animate(1,false,true);expect(person.legs.every(leg=>Math.abs(leg.rotation.x)<.001)).toBe(true);
  expect(person.body.position.z).toBe(0);expect(person.knees.every(knee=>Math.abs(knee.rotation.x)<.001)).toBe(true);
  expect(bike.wheels).toHaveLength(2);const bounds=new T.Box3().setFromObject(bike.group.getObjectByName('chassis')!).union(new T.Box3().setFromObject(bike.steering));
  expect(bounds.max.z-bounds.min.z).toBeGreaterThan(2);expect(bounds.max.z-bounds.min.z).toBeLessThan(2.4);expect(bounds.max.y).toBeLessThan(1.5);
  const center=bike.wheels[0].getWorldPosition(new T.Vector3());bike.wheels[0].rotation.x=1;
  expect(bike.wheels[0].getWorldPosition(new T.Vector3()).distanceTo(center)).toBe(0);assets.dispose();
});
