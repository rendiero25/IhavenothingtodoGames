import { describe, it, expect } from 'vitest';
import { canKnock, knock, createState, tickDelivery,tickChallenge,crash,levelBudgets,deliveryDistances, targetFor, move, walkable, RESIDENTS, BUILDINGS, STREETS, TREES, paved, routeTo, movementDirection } from './logic';

describe('courier delivery loop',()=>{
  it('tolerates physics rounding at a driveway edge without opening the lawn',()=>{
    expect(paved(-29,21)).toBe(true);
    expect(paved(-28.9999942779541,21)).toBe(true);
    expect(paved(-28.99,21)).toBe(false);
  });
  it('keeps new street gardens clear of paved routes and building entrances',()=>{
    expect(TREES.length).toBeGreaterThan(50);
    for(const tree of TREES.slice(34)){
      expect(paved(tree.x,tree.z)).toBe(false);
      for(const p of RESIDENTS)expect(Math.hypot(tree.x-p.x,tree.z-p.z)).toBeGreaterThan(2);
    }
  });
  it('fills empty city blocks without obstructing roads or overlapping buildings',()=>{
    expect(BUILDINGS.length).toBeGreaterThanOrEqual(55);
    for(const [i,b] of BUILDINGS.entries()){
      if(i<24)continue;
      for(const road of STREETS){
        expect(Math.abs(b.x-road.x)>=(b.w+road.w)/2+.8
          || Math.abs(b.z+.45-road.z)>=(b.d+road.d)/2+1.3).toBe(true);
      }
      for(const other of BUILDINGS.slice(0,i)){
        expect(Math.abs(b.x-other.x)>=(b.w+other.w)/2
          || Math.abs(b.z-other.z)>=(b.d+other.d)/2).toBe(true);
      }
    }
  });
  it('routes along streets around buildings and keeps forward aligned with the camera',()=>{
    let start={x:createState().x,z:createState().z};
    for(const goal of RESIDENTS){
      const path=routeTo(start,goal);expect(path.length).toBeGreaterThan(0);
      expect(path.every(p=>walkable(p.x,p.z))).toBe(true);
      expect(Math.hypot(path.at(-1)!.x-goal.x,path.at(-1)!.z-goal.z)).toBeLessThan(1);
      start=goal;
    }
    expect(movementDirection(0,-1,0)).toEqual({x:0,z:-1});
    expect(movementDirection(0,-1,Math.PI/2).x).toBeCloseTo(-1);
    expect(routeTo(start,{x:100,z:100})).toEqual([]);
    expect(walkable(35,35)).toBe(false);
  });
  it('requires proximity and dwell, then picks up before delivering exactly five parcels',()=>{
    const state=createState();state.riding=false;
    expect(tickDelivery(state,1)).toBeNull();
    for(let i=0;i<5;i++){
      Object.assign(state,targetFor(state));
      expect(tickDelivery(state,.3)).toBeNull();
      expect(tickDelivery(state,.4)).toBe('pickup');
      expect(state.delivery).toBe(i);
      expect(tickDelivery(state,1)).toBeNull();
      Object.assign(state,targetFor(state));
      expect(tickDelivery(state,2)).toBeNull();
      expect(state.delivery).toBe(i);
      expect(knock(state)).toBe(true);
      expect(knock(state)).toBe(false);
      expect(tickDelivery(state,1)).toBeNull();
      expect(state.visit?.phase).toBe('opening');
      expect(tickDelivery(state,.5)).toBeNull();
      expect(state.visit?.phase).toBe('waiting');
      expect(tickDelivery(state,.7)).toBe('delivered');
    }
    expect(state.completed).toBe(true);
    expect(tickDelivery(state,1)).toBeNull();
    expect(state.delivery).toBe(5);
    expect(knock(state)).toBe(false);
  });
  it('only knocks at the current recipient with a parcel and returns the resident indoors',()=>{
    const s=createState();s.riding=false;expect(canKnock(s)).toBe(false);
    Object.assign(s,RESIDENTS[1]);expect(knock(s)).toBe(false);
    s.carrying=true;Object.assign(s,RESIDENTS[2]);expect(knock(s)).toBe(false);
    Object.assign(s,RESIDENTS[1]);expect(knock(s)).toBe(true);
    tickDelivery(s,1.5);tickDelivery(s,.7);expect(s.visit?.phase).toBe('leaving');
    s.x=40;tickDelivery(s,2.5);expect(s.visit).toBeNull();
  });
  it('resets interaction progress when walking away',()=>{
    const s=createState();Object.assign(s,targetFor(s));tickDelivery(s,.4);
    s.x=5;tickDelivery(s,.2);expect(s.dwell).toBe(0);
  });
  it('caps long frames and diagonal movement, blocks walls and island edge',()=>{
    const s=createState(),start={x:s.x,z:s.z};move(s,1,1,5);expect(Math.hypot(s.x-start.x,s.z-start.z)).toBeCloseTo(.21);
    for(const b of BUILDINGS)expect(walkable(b.x,b.z)).toBe(false);
    expect(walkable(75,0)).toBe(false);
    const b=BUILDINGS[0];Object.assign(s,{x:b.x,z:b.z+b.d/2+.41});move(s,0,-1,.05);
    expect(s.z).toBeCloseTo(b.z+b.d/2+.41);
  });
  it('connects every delivery to a motorcycle parking approach',()=>{
    let start={x:createState().x,z:createState().z};
    for(const p of RESIDENTS){const parking={x:p.x,z:p.z+3.4},path=routeTo(start,parking,1);
      expect(path.length,JSON.stringify({start,parking})).toBeGreaterThan(0);expect(Math.hypot(path.at(-1)!.x-parking.x,path.at(-1)!.z-parking.z)).toBeLessThan(1);start=parking;
    }
  });
});
it('budgets every level from reachable street distance with decreasing deadlines',()=>{
  const times=levelBudgets(),distances=deliveryDistances();
  console.info('Courier levels',distances.map((distance,i)=>({level:i+1,distance,seconds:times[i]})));
  for(let i=0;i<5;i++){expect(distances[i]).toBeGreaterThan(20);expect(times[i]).toBeGreaterThan(distances[i]/6+10);if(i)expect(times[i]).toBeLessThan(times[i-1]);}
});
it('counts down only after collection and prevents repeated crash penalties',()=>{
  const s=createState();expect(tickChallenge(s,2)).toBe(false);expect(s.levelRemaining).toBe(0);
  s.carrying=true;s.levelRemaining=10;expect(crash(s)).toBe(true);expect(s.levelRemaining).toBe(7);
  expect(crash(s)).toBe(false);expect(s.crashes).toBe(1);expect(tickChallenge(s,7)).toBe(true);expect(s.levelRemaining).toBe(0);
});
