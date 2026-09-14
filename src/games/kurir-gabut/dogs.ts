import { routeTo, walkable, type CourierState, type Point } from './logic';
import type { CourierPhysics } from './physics';

export const DOG_CHASE_METERS=28;
export const DOG_CHASE_RADIUS=7;
const ESCAPE_RADIUS=24;

export function createDog(home:Point,index:number){
  return {id:`dog${index}`,home,state:{...home,yaw:0},phase:'idle' as 'idle'|'chase'|'wander',
    route:[] as Point[],replan:0,cooldown:0,chaseDistance:0,stuckTime:0,moving:false,
    wanderTurn:index*3,wanderTarget:null as Point|null};
}
export type CourierDog=ReturnType<typeof createDog>;

/** A pursuit is limited by metres actually walked, never by a tether to home. */
export function updateDog(dog:CourierDog,s:CourierState,dt:number,physics:Pick<CourierPhysics,'move'>,onCatch:()=>void){
  dog.cooldown=Math.max(0,dog.cooldown-dt);dog.replan-=dt;dog.moving=false;
  const distance=Math.hypot(dog.state.x-s.x,dog.state.z-s.z);
  const wander=()=>{
    dog.phase='wander';dog.route=[];dog.wanderTarget=null;dog.replan=0;
    dog.cooldown=10;dog.stuckTime=0;
  };
  if(dog.phase!=='chase'&&distance<DOG_CHASE_RADIUS&&dog.cooldown===0&&!s.completed){
    dog.phase='chase';dog.chaseDistance=0;dog.stuckTime=0;dog.replan=0;dog.route=[];
  }
  if(dog.phase==='chase'){
    if(dog.chaseDistance>=DOG_CHASE_METERS||distance>ESCAPE_RADIUS||s.completed||dog.stuckTime>3)wander();
    else if(distance<1.45){onCatch();wander();}
  }
  if(dog.phase==='idle')return;
  const obstacles=s.riding?[]:[{...s.bike,r:.95}];
  if(dog.phase==='wander'&&!dog.wanderTarget&&dog.replan<=0){
    // Destinations change around the current position, without a return-home leg.
    for(let attempt=0;attempt<10;attempt++){
      const angle=++dog.wanderTurn*2.399963,range=9+dog.wanderTurn%4*3;
      const candidate={x:Math.round(dog.state.x+Math.sin(angle)*range),z:Math.round(dog.state.z+Math.cos(angle)*range)};
      if(!walkable(candidate.x,candidate.z,.45)||Math.hypot(candidate.x-dog.home.x,candidate.z-dog.home.z)<8)continue;
      const path=routeTo(dog.state,candidate,.45,obstacles);
      if(path.length>2){dog.wanderTarget=candidate;dog.route=path;break;}
    }
    dog.replan=2;
  }else if(dog.phase==='chase'&&dog.replan<=0){
    dog.route=routeTo(dog.state,s,.45,obstacles);dog.replan=.85;
  }
  while(dog.route[0]&&Math.hypot(dog.route[0].x-dog.state.x,dog.route[0].z-dog.state.z)<.12)dog.route.shift();
  const goal=dog.route[0];
  if(goal){
    const x=goal.x-dog.state.x,z=goal.z-dog.state.z,length=Math.hypot(x,z);
    const chasing=dog.phase==='chase',step=Math.min(length,(chasing?5.6:1.65)*dt,chasing?DOG_CHASE_METERS-dog.chaseDistance:Infinity);
    const next=physics.move(dog.id,x/length*step,z/length*step),travel=Math.hypot(next.x-dog.state.x,next.z-dog.state.z);
    dog.moving=travel>.001;
    if(dog.moving)dog.state.yaw=Math.atan2(next.x-dog.state.x,next.z-dog.state.z);
    dog.state.x=next.x;dog.state.z=next.z;
    dog.stuckTime=dog.moving?0:dog.stuckTime+dt;
    if(chasing){dog.chaseDistance+=travel;if(dog.chaseDistance>=DOG_CHASE_METERS-.001)wander();}
  }else dog.stuckTime+=dt;
  if(dog.phase==='wander'&&(!goal||dog.stuckTime>2)){
    dog.wanderTarget=null;dog.route=[];dog.stuckTime=0;
  }
}
