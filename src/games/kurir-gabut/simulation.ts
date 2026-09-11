import { advanceTraveler,createTraveler,INNER_TRAFFIC,TRAFFIC_LOOP,WALK_LOOPS } from './activity';
import { BUILDINGS,HOME_BUILDINGS,crash,paved,RESIDENTS,routeTo,type CourierState,type Point } from './logic';
import { createPhysics } from './physics';

export function createActivity(){
  const pedestrians=Array.from({length:8},(_,i)=>{
    const path=WALK_LOOPS[i>=6?2:i%2],travel=createTraveler(path,i%4,1.1+i%3*.1);
    for(let j=0;j<i*35;j++)advanceTraveler(travel,path,.05);
    return {id:`person${i}`,path,travel,state:{...travel},offset:{x:0,z:0},dodging:false};
  });
  const traffic=Array.from({length:5},(_,i)=>{
    const path=i>=3?INNER_TRAFFIC:TRAFFIC_LOOP,travel=createTraveler(path,i%4,i>=3?6:5);
    for(let j=0;j<i*50;j++)advanceTraveler(travel,path,.05);
    return {id:`traffic${i}`,path,travel,state:{...travel},motorcycle:i>=3};
  });
  const dogs=[1,4].map((resident,i)=>{
    const home={x:RESIDENTS[resident].x-3,z:RESIDENTS[resident].z+4};
    return {id:`dog${i}`,home,state:{...home,yaw:0},phase:'idle' as 'idle'|'chase'|'return',route:[] as Point[],replan:0,cooldown:0};
  });
  const residents=RESIDENTS.map((p,i)=>({id:`resident${i}`,active:false,state:{x:p.x,z:BUILDINGS[HOME_BUILDINGS[i]].z+BUILDINGS[HOME_BUILDINGS[i]].d/2-.7}}));
  return {pedestrians,traffic,dogs,residents};
}
export type Activity=ReturnType<typeof createActivity>;
export function createSimulation(s:CourierState){
  const activity=createActivity(),physics=createPhysics();
  physics.add('courier',s,s.riding?.95:.35);physics.add('bike',s.bike,.95);physics.enable('bike',!s.riding);
  activity.pedestrians.forEach(p=>physics.add(p.id,p.state,.32));
  activity.traffic.forEach(c=>physics.add(c.id,c.state,c.motorcycle?.8:.95,!c.motorcycle));
  activity.dogs.forEach(d=>physics.add(d.id,d.state,.4));physics.sync();
  activity.residents.forEach(p=>{physics.add(p.id,p.state,.32);physics.enable(p.id,false);});
  let didCrash=false;
  let coastSign=1;
  const collide=()=>{if(crash(s))didCrash=true;};
  function update(dt:number,direction:Point,yaw:number,brake:boolean,boost:boolean,maxDistance=Infinity){
    didCrash=false;
    const wet=s.weather==='rain'||s.weather==='storm',moving=Math.hypot(direction.x,direction.z)>.01;
    const top=s.riding?(wet?9:boost?13:10):3.6;
    const targetSpeed=moving&&!brake&&s.crashTime===0?top:0;
    const acceleration=targetSpeed>s.speed?7:brake?(wet?8:18):(wet?5:10);
    s.speed+=Math.sign(targetSpeed-s.speed)*Math.min(Math.abs(targetSpeed-s.speed),acceleration*dt);
    for(const [i,p] of activity.residents.entries()){
      const visit=s.visit?.resident===i?s.visit:null;
      if(Boolean(visit)!==p.active){p.active=Boolean(visit);physics.enable(p.id,p.active);}
      if(!visit)continue;
      const b=BUILDINGS[HOME_BUILDINGS[i]],inside=b.z+b.d/2-.7;
      const progress=visit.phase==='opening'?Math.min(1,visit.time/1.5):visit.phase==='leaving'?Math.max(0,1-visit.time/2.5):1;
      const desiredZ=inside+(RESIDENTS[i].z-inside)*progress;
      const result=physics.move(p.id,0,Math.max(-dt*1.2,Math.min(dt*1.2,desiredZ-p.state.z)),undefined,`building${HOME_BUILDINGS[i]}`);
      p.state.x=result.x;p.state.z=result.z;
    }
    for(const p of activity.pedestrians){
      const before={...p.travel},dx=p.state.x-s.x,dz=p.state.z-s.z,distance=Math.hypot(dx,dz);
      p.dodging=s.riding&&s.speed>6&&distance<7;
      if(p.dodging){
        const cross=dx*Math.cos(yaw)-dz*Math.sin(yaw),side=cross>=0?1:-1;
        p.offset.x+=Math.cos(yaw)*side*dt*2.7;p.offset.z-=Math.sin(yaw)*side*dt*2.7;
        const size=Math.hypot(p.offset.x,p.offset.z);if(size>2){p.offset.x*=2/size;p.offset.z*=2/size;}
      }else{p.offset.x*=Math.max(0,1-dt*1.5);p.offset.z*=Math.max(0,1-dt*1.5);}
      advanceTraveler(p.travel,p.path,dt);
      const result=physics.move(p.id,p.travel.x+p.offset.x-p.state.x,p.travel.z+p.offset.z-p.state.z);
      if(result.hits.length)Object.assign(p.travel,before);
      p.state.yaw=Math.atan2(result.x-p.state.x,result.z-p.state.z);p.state.stopped=Math.hypot(result.x-p.state.x,result.z-p.state.z)<.001;
      p.state.x=result.x;p.state.z=result.z;
    }
    for(const c of activity.traffic){
      const before={...c.travel};
      advanceTraveler(c.travel,c.path,dt,[s,...activity.pedestrians.map(p=>p.state),...activity.traffic.filter(t=>t!==c).map(t=>t.state)],c.motorcycle?1:1.4);
      const result=physics.move(c.id,c.travel.x-c.state.x,c.travel.z-c.state.z,c.travel.yaw);
      if(result.hits.includes('courier')&&!c.travel.stopped)collide();
      if(result.hits.length)Object.assign(c.travel,before);
      c.state.stopped=c.travel.stopped||result.hits.length>0;c.state.x=result.x;c.state.z=result.z;c.state.yaw=c.travel.yaw;
    }
    const step=Math.min(s.speed*dt,maxDistance),length=Math.hypot(direction.x,direction.z);
    if(length)coastSign=direction.x*(-Math.sin(yaw))+direction.z*(-Math.cos(yaw))>=0?1:-1;
    let dx=length?direction.x/length*step:-Math.sin(yaw)*coastSign*step,dz=length?direction.z/length*step:-Math.cos(yaw)*coastSign*step;
    if(s.riding&&moving&&s.crashTime===0&&(s.weather==='wind'||s.weather==='storm')){dx+=Math.cos(yaw)*Math.sin(s.elapsed*1.7)*dt*.8;dz-=Math.sin(yaw)*Math.sin(s.elapsed*1.7)*dt*.8;}
    if(!paved(s.x+dx,s.z))dx=0;if(!paved(s.x,s.z+dz))dz=0;
    const result=physics.move('courier',dx,dz);
    // Cars and bikes cause a crash only when the courier is riding. A person on
    // foot is blocked by the swept collider and can step around the vehicle.
    if(s.riding&&(result.hits.some(id=>id.startsWith('traffic'))||s.speed>6&&result.hits.length))collide();
    if(result.hits.length)s.speed*=.5;
    s.x=result.x;s.z=result.z;if(s.riding)s.bike={x:s.x,z:s.z};
    for(const dog of activity.dogs){
      dog.cooldown=Math.max(0,dog.cooldown-dt);dog.replan-=dt;
      const distance=Math.hypot(dog.state.x-s.x,dog.state.z-s.z),fromHome=Math.hypot(s.x-dog.home.x,s.z-dog.home.z);
      if(dog.phase==='idle'&&distance<7&&dog.cooldown===0){dog.phase='chase';dog.replan=0;}
      if(dog.phase==='chase'&&(distance>16||fromHome>23||s.completed)){dog.phase='return';dog.replan=0;dog.cooldown=6;}
      if(dog.phase==='chase'&&distance<1.5){collide();dog.phase='return';dog.replan=0;dog.cooldown=10;}
      if(dog.phase==='idle')continue;
      if(dog.replan<=0){dog.route=routeTo(dog.state,dog.phase==='chase'?s:dog.home,.45,s.riding?[]:[{...s.bike,r:.95}]);dog.replan=1;}
      while(dog.route[0]&&Math.hypot(dog.route[0].x-dog.state.x,dog.route[0].z-dog.state.z)<.25)dog.route.shift();
      const goal=dog.route[0];
      if(goal){const x=goal.x-dog.state.x,z=goal.z-dog.state.z,d=Math.hypot(x,z),speed=dog.phase==='chase'?5.6:2;
        const amount=Math.min(d,speed*dt),next=physics.move(dog.id,x/d*amount,z/d*amount);
        dog.state.yaw=Math.atan2(next.x-dog.state.x,next.z-dog.state.z);dog.state.x=next.x;dog.state.z=next.z;
      }
      if(dog.phase==='return'&&Math.hypot(dog.state.x-dog.home.x,dog.state.z-dog.home.z)<.7){dog.phase='idle';dog.route=[];}
    }
    return {crashed:didCrash,chased:activity.dogs.some(d=>d.phase==='chase')};
  }
  function toggleBike(yaw:number){
    if(s.crashTime>0||s.speed>.6||s.completed)return false;
    if(s.riding){
      const origin={x:s.x,z:s.z};physics.radius('courier',.35);
      for(const angle of [yaw,yaw+Math.PI,yaw+Math.PI/2,yaw-Math.PI/2]){
        const dx=Math.cos(angle)*1.6,dz=-Math.sin(angle)*1.6;
        if(!paved(origin.x+dx,origin.z+dz))continue;
        const next=physics.move('courier',dx,dz);
        if(Math.hypot(next.x-origin.x,next.z-origin.z)>1.4){s.riding=false;s.bike=origin;s.x=next.x;s.z=next.z;physics.teleport('bike',origin);physics.enable('bike',true);return true;}
        physics.teleport('courier',origin);
      }
      physics.radius('courier',.95);return false;
    }
    if(Math.hypot(s.x-s.bike.x,s.z-s.bike.z)>4.5)return false;
    physics.enable('bike',false);physics.teleport('courier',s.bike);physics.radius('courier',.95);s.x=s.bike.x;s.z=s.bike.z;s.riding=true;return true;
  }
  function makeRoom(goal:Point){const next=physics.move('courier',goal.x-s.x,goal.z+1.25-s.z);s.x=next.x;s.z=next.z;}
  return {activity,physics,update,toggleBike,makeRoom,dispose:physics.dispose};
}
