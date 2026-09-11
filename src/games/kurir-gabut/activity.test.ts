import { expect,it } from 'vitest';
import { advanceTraveler,createTraveler,TRAFFIC_LOOP,WALK_LOOPS } from './activity';
import { BUILDINGS } from './logic';

it('stops traffic for the courier, then continues after the road clears',()=>{
  const car=createTraveler(TRAFFIC_LOOP,0,3),start={x:car.x,z:car.z};
  advanceTraveler(car,TRAFFIC_LOOP,.05,[{x:car.x+2,z:car.z}],1.2);
  expect(car.stopped).toBe(true);expect(car.x).toBe(start.x);
  advanceTraveler(car,TRAFFIC_LOOP,.05,[],1.2);expect(car.stopped).toBe(false);expect(car.x).toBeGreaterThan(start.x);
  const x=car.x;advanceTraveler(car,TRAFFIC_LOOP,0);expect(car.x).toBe(x);
});
it('loops pedestrians and vehicles without entering any house',()=>{
  for(const path of [TRAFFIC_LOOP,...WALK_LOOPS]){
    const t=createTraveler(path,0,4);
    for(let i=0;i<1600;i++){
      advanceTraveler(t,path,.05);
      expect(BUILDINGS.some(b=>Math.abs(t.x-b.x)<b.w/2+.25&&Math.abs(t.z-b.z)<b.d/2+.25)).toBe(false);
      expect(Number.isFinite(t.yaw)).toBe(true);
    }
  }
});
