import {beforeAll,expect,it} from 'vitest';
import {createPhysics,prepareCourierPhysics} from './physics';
import {BUILDINGS} from './logic';
beforeAll(async()=>{await prepareCourierPhysics();},20000);
it('sweeps a fast courier into walls without tunneling through them',()=>{
  const p=createPhysics(),b=BUILDINGS[0];p.add('courier',{x:b.x-10,z:b.z},.95);p.sync();
  const hit=p.move('courier',25,0);
  expect(hit.x).toBeLessThan(b.x-b.w/2-.9);expect(hit.hits).toContain('building0');p.dispose();
});
it('keeps people and traffic separated when they move toward each other',()=>{
  const p=createPhysics();p.add('courier',{x:0,z:2},.95);p.add('traffic0',{x:6,z:2},.95);p.sync();
  for(let i=0;i<15;i++){p.move('courier',.65,0);p.move('traffic0',-.4,0);}
  const a=p.position('courier'),b=p.position('traffic0');expect(b.x-a.x).toBeGreaterThanOrEqual(1.9);p.dispose();
});
