import { describe, it, expect } from 'vitest';
import { createState, tickDelivery, targetFor, move, walkable, RESIDENTS, BUILDINGS, routeTo, movementDirection } from './logic';

describe('courier delivery loop',()=>{
  it('routes along streets around buildings and keeps forward aligned with the camera',()=>{
    let start={x:0,z:3};
    for(const goal of RESIDENTS){
      const path=routeTo(start,goal);expect(path.length).toBeGreaterThan(0);
      expect(path.every(p=>walkable(p.x,p.z))).toBe(true);
      expect(Math.hypot(path.at(-1)!.x-goal.x,path.at(-1)!.z-goal.z)).toBeLessThan(1);
      start=goal;
    }
    expect(movementDirection(0,-1,0)).toEqual({x:0,z:-1});
    expect(movementDirection(0,-1,Math.PI/2).x).toBeCloseTo(-1);
    expect(routeTo(start,{x:100,z:100})).toEqual([]);
    expect(walkable(12,11)).toBe(false);
  });
  it('requires proximity and dwell, then picks up before delivering exactly five parcels',()=>{
    const state=createState();
    expect(tickDelivery(state,1)).toBeNull();
    for(let i=0;i<5;i++){
      Object.assign(state,targetFor(state));
      expect(tickDelivery(state,.3)).toBeNull();
      expect(tickDelivery(state,.4)).toBe('pickup');
      expect(state.delivery).toBe(i);
      expect(tickDelivery(state,1)).toBeNull();
      Object.assign(state,targetFor(state));
      expect(tickDelivery(state,.7)).toBe('delivered');
    }
    expect(state.completed).toBe(true);
    expect(tickDelivery(state,1)).toBeNull();
    expect(state.delivery).toBe(5);
  });
  it('resets interaction progress when walking away',()=>{
    const s=createState();Object.assign(s,targetFor(s));tickDelivery(s,.4);
    s.x=5;tickDelivery(s,.2);expect(s.dwell).toBe(0);
  });
  it('caps long frames and diagonal movement, blocks walls and island edge',()=>{
    const s=createState();move(s,1,1,5);expect(Math.hypot(s.x,s.z-3)).toBeCloseTo(.21);
    for(const b of BUILDINGS)expect(walkable(b.x,b.z)).toBe(false);
    expect(walkable(15,0)).toBe(false);
    const b=BUILDINGS[0];Object.assign(s,{x:b.x,z:b.z+b.d/2+.41});move(s,0,-1,.05);
    expect(s.z).toBeCloseTo(b.z+b.d/2+.41);
  });
  it('connects every resident through walkable village ground',()=>{
    const visited=new Set<string>(['0,3']), queue=[[0,3]];
    for(let i=0;i<queue.length;i++){
      const [x,z]=queue[i];
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const key=`${x+dx},${z+dz}`;
        if(!visited.has(key)&&walkable(x+dx,z+dz)){visited.add(key);queue.push([x+dx,z+dz]);}
      }
    }
    for(const p of RESIDENTS)expect(queue.some(([x,z])=>Math.hypot(x-p.x,z-p.z)<1)).toBe(true);
  });
});
