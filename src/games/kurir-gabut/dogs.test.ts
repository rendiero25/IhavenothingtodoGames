import {expect,it,vi} from 'vitest';
import {createDog,updateDog,DOG_CHASE_METERS} from './dogs';
import {createState,walkable} from './logic';

function setup(fraction=1){
  const dog=createDog({x:-39,z:-35},0),state=createState();state.riding=true;
  const physics={move:(_id:string,x:number,z:number)=>({x:dog.state.x+x*fraction,z:dog.state.z+z*fraction,hits:[]})};
  const caught=vi.fn();return {dog,state,physics,caught};
}
it('ends a pursuit at 28 actual metres and keeps roaming to new destinations',()=>{
  const {dog,state,physics,caught}=setup();dog.phase='chase';dog.route=[{x:-39,z:40}];dog.replan=100;
  for(let i=0;i<150&&dog.phase==='chase';i++){
    state.x=dog.state.x;state.z=dog.state.z+6;updateDog(dog,state,.05,physics,caught);
  }
  expect(dog.phase).toBe('wander');expect(dog.chaseDistance).toBeCloseTo(DOG_CHASE_METERS,3);expect(caught).not.toHaveBeenCalled();
  const end={...dog.state},targets=new Set<string>();state.completed=true;
  for(let i=0;i<600;i++){
    updateDog(dog,state,.05,physics,caught);
    if(dog.wanderTarget){
      targets.add(JSON.stringify(dog.wanderTarget));
      expect(Math.hypot(dog.wanderTarget.x-dog.home.x,dog.wanderTarget.z-dog.home.z)).toBeGreaterThanOrEqual(8);
      expect(dog.route.every(p=>walkable(p.x,p.z,.45))).toBe(true);
    }
  }
  expect(dog.phase).toBe('wander');expect(targets.size).toBeGreaterThan(1);
  expect(Math.hypot(dog.state.x-end.x,dog.state.z-end.z)).toBeGreaterThan(2);
});
it('counts collision-limited movement instead of requested speed',()=>{
  const {dog,state,physics,caught}=setup(.25);dog.phase='chase';dog.route=[{x:-39,z:40}];dog.replan=100;
  for(let i=0;i<40;i++){state.x=dog.state.x;state.z=dog.state.z+6;updateDog(dog,state,.05,physics,caught);}
  expect(dog.chaseDistance).toBeCloseTo(5.6*2*.25);expect(dog.phase).toBe('chase');
});
it('abandons an obstructed pursuit without counting blocked distance',()=>{
  const {dog,state,physics,caught}=setup(0);dog.phase='chase';dog.route=[{x:-39,z:40}];dog.replan=100;state.x=-39;state.z=-29;
  for(let i=0;i<65;i++)updateDog(dog,state,.05,physics,caught);
  expect(dog.chaseDistance).toBe(0);expect(dog.phase).toBe('wander');expect(dog.cooldown).toBeGreaterThan(9);
});
it('catches once, then wanders with a cooldown instead of returning home',()=>{
  const {dog,state,physics,caught}=setup();state.x=-39;state.z=-34;
  for(let i=0;i<20;i++)updateDog(dog,state,.05,physics,caught);
  expect(caught).toHaveBeenCalledOnce();expect(dog.phase).toBe('wander');expect(dog.cooldown).toBeGreaterThan(8);
  expect(dog.wanderTarget).not.toEqual(dog.home);
});
