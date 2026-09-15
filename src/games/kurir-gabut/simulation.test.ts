import {beforeAll,expect,it} from 'vitest';
import {prepareCourierPhysics} from './physics';
import {createSimulation} from './simulation';
import {createState,tickChallenge} from './logic';
beforeAll(async()=>{await prepareCourierPhysics();},20000);
it('parks a solid motorcycle, dismounts beside it, and mounts again nearby',()=>{
  const s=createState(),sim=createSimulation(s);
  expect(sim.toggleBike(Math.PI/2)).toBe(true);expect(s.riding).toBe(false);
  expect(Math.hypot(s.x-s.bike.x,s.z-s.bike.z)).toBeGreaterThan(1.4);
  expect(sim.toggleBike(Math.PI/2)).toBe(true);expect(s.riding).toBe(true);
  s.speed=7;expect(sim.toggleBike(0)).toBe(false);sim.dispose();
});
it('triggers a dog chase and switches to roaming when the courier escapes',()=>{
  const s=createState(),sim=createSimulation(s),dog=sim.activity.dogs[0];
  s.x=dog.home.x+4;s.z=dog.home.z;sim.physics.teleport('courier',s);
  sim.update(.05,{x:0,z:0},0,false,false);expect(dog.phase).toBe('chase');
  s.x=dog.home.x+30;sim.physics.teleport('courier',s);sim.update(.05,{x:0,z:0},0,false,false);
  expect(dog.phase).toBe('wander');expect(dog.cooldown).toBeGreaterThan(0);sim.dispose();
});
it('makes pedestrians dodge a speeding rider and reduces wet-road braking',()=>{
  const s=createState(),sim=createSimulation(s),person=sim.activity.pedestrians[0];
  s.x=person.state.x+2;s.z=person.state.z+3;s.speed=10;sim.physics.teleport('courier',s);
  sim.update(.05,{x:0,z:-1},0,false,true);expect(person.dodging).toBe(true);
  sim.dispose();
  const dry=createState(),wet=createState();wet.weather='rain';dry.speed=wet.speed=8;
  const a=createSimulation(dry),b=createSimulation(wet);a.update(.05,{x:0,z:-1},0,true,false);b.update(.05,{x:0,z:-1},0,true,false);
  expect(wet.speed).toBeGreaterThan(dry.speed);a.dispose();b.dispose();
});
it('does not move the courier while recovering from an accident',()=>{
  const s=createState(),sim=createSimulation(s);s.crashTime=1.3;
  const x=s.x,z=s.z;for(let i=0;i<10;i++){sim.update(.05,{x:1,z:0},0,false,true);tickChallenge(s,.05);}
  expect(s.x).toBeCloseTo(x);expect(s.z).toBeCloseTo(z);sim.dispose();
});
it('keeps forty simulation updates inside a conservative CPU frame budget',()=>{
  const s=createState(),sim=createSimulation(s);
  for(let i=0;i<5;i++)sim.update(.025,{x:0,z:-1},0,false,false);
  const started=performance.now();
  for(let i=0;i<40;i++)sim.update(.025,{x:0,z:-1},0,false,false);
  const elapsed=performance.now()-started;sim.dispose();
  console.info('Courier simulation budget',{updates:40,elapsed});
  expect(elapsed).toBeLessThan(120);
});
