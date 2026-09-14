import * as T from 'three';
import { BUILDINGS, HOME_BUILDINGS, RESIDENTS, STREETS,SIDEWALKS,TREES,LAMPS,paved,walkable, type CourierState, targetFor } from './logic';
import { createAssets } from './assets';
import { createActivity,type Activity } from './simulation';

export function createVillage(activity:Activity=createActivity()) {
  const scene=new T.Scene();scene.background=new T.Color(0xb9d6e8);scene.fog=new T.Fog(0xb9d6e8,65,200);
  const camera=new T.PerspectiveCamera(58,1,.08,260);
  const assets=createAssets(),{mesh,box,round,sphere,foliage,cylinder,taperedCylinder,material,geometry}=assets;
  const streets=new T.Group();scene.add(streets);
  const ambient=new T.HemisphereLight(0xf2f7ff,0x71844e,2);scene.add(ambient);
  const sun=new T.DirectionalLight(0xffeccd,2.7);sun.position.set(-35,55,22);scene.add(sun);
  const asphalt=0x485053;
  assets.surface(0x819473,'ground');assets.surface(asphalt,'road');assets.surface(0xc1bdb0,'paving');
  assets.surface(0x736c60,'roof');assets.surface(0x9b7560,'roof');
  const glass=material(0x7f9d9e);glass.roughness=.24;glass.metalness=.08;
  mesh(streets,box,0x819473,0,-.15,0,320,.2,320);
  for(let i=0;i<12;i++){
    const a=i/12*Math.PI*2;
    mesh(streets,sphere,0x839c88,Math.sin(a)*140,1,Math.cos(a)*140,30,12+i%3*4,25);
  }
  // Shared geometry, merged by material: street detail costs few draw calls.
  STREETS.forEach(s=>{
    mesh(streets,box,0xaaa99f,s.x,-.025,s.z,s.w+.22,.08,s.d+.22);
    mesh(streets,box,s.kind==='road'?asphalt:0xc1bdb0,s.x,s.kind==='road'?.035:.024,s.z,s.w,.05,s.d);
  });
  // Sidewalks stop at road crossings so kerbs never run across a traffic lane.
  for(const s of SIDEWALKS){
    const vertical=s.d>s.w,length=vertical?s.d:s.w;
    for(let at=-length/2;at<length/2;at+=1){
      const x=s.x+(vertical?0:at+.5),z=s.z+(vertical?at+.5:0);
      if(paved(x,z,true))continue;
      mesh(streets,box,0xc1bdb0,x,.09,z,vertical?s.w:1,.18,vertical?1:s.d);
      mesh(streets,box,0xa49f90,x+(vertical?(x<0?-.84:.84):0),.095,z+(vertical?0:(z<0?-.84:.84)),vertical?.12:1,.19,vertical?1:.12);
    }
  }
  for(const x of [-39,39]){
    for(let z=-40;z<=40;z+=16){
      if(paved(x,z,true))continue;
      mesh(streets,round,0x393e3c,x+(x<0?.62:-.62),.205,z,.5,.035,1.15,.45);
      for(let bar=-.42;bar<=.42;bar+=.21)mesh(streets,box,0x777b76,x+(x<0?.62:-.62)+bar,.225,z,.035,.018,.92,.5);
    }
  }
  const mainRoads=STREETS.slice(0,13);
  for(const road of mainRoads){
    const vertical=road.d>road.w,length=vertical?road.d:road.w;
    for(let at=-length/2+2;at<length/2-2;at+=4){
      const x=road.x+(vertical?0:at),z=road.z+(vertical?at:0);
      const junction=mainRoads.some(other=>other!==road&&(other.d>other.w)!==vertical&&Math.abs(x-other.x)<other.w/2+1&&Math.abs(z-other.z)<other.d/2+1);
      if(junction||!walkable(x,z,0))continue;
      mesh(streets,box,0xe0dcc7,x,.067,z,vertical?.1:1.8,.012,vertical?1.8:.1);
    }
  }
  for(const z of [-14,26])for(let i=0;i<10;i++)mesh(streets,box,0xe7e2d5,40+i*.8,.078,z,.4,.012,2.2);
  for(let i=0;i<18;i++){
    const lane=i%3===0?-52:i%3===1?2:52,x=-34+(i*17)%68;
    const patch=mesh(streets,round,0x646b6a,x,.071,lane+(i%2-.5)*1.7,.7+(i%3)*.18,.018,.07);
    patch.rotation.y=(i%5-.5)*.22;
  }
  for(const [x,z,turn] of [[-39,-14,0],[39,26,Math.PI],[8,-44,Math.PI/2],[-12,44,-Math.PI/2]] as const){
    mesh(streets,cylinder,0x626760,x,.9,z,.055,1.8,.055);
    const sign=mesh(streets,round,0xd9d6c9,x,1.72,z,.64,.42,.055);sign.rotation.y=turn;
    mesh(streets,box,0x596760,x,1.72,z+.058,.38,.055,.012);
  }
  const branchUp=new T.Vector3(0,1,0),branchDirection=new T.Vector3();
  function branch(parent:T.Group,x1:number,y1:number,z1:number,x2:number,y2:number,z2:number,radius:number){
    branchDirection.set(x2-x1,y2-y1,z2-z1);const length=branchDirection.length();
    const limb=mesh(parent,taperedCylinder,0x796d58,(x1+x2)/2,(y1+y2)/2,(z1+z2)/2,radius,length,radius);
    limb.quaternion.setFromUnitVectors(branchUp,branchDirection.normalize());return limb;
  }

  const roofShape=new T.Shape();roofShape.moveTo(-.5,0);roofShape.lineTo(.5,0);roofShape.lineTo(0,.4);roofShape.closePath();
  const roof=geometry(new T.ExtrudeGeometry(roofShape,{depth:1,bevelEnabled:false}));roof.translate(0,0,-.5);
  const doorPivots:T.Group[]=[];
  const collisionRoot=new T.Group();
  const smallSphere=geometry(new T.SphereGeometry(1,8,4));
  const smallCylinder=geometry(new T.CylinderGeometry(1,1,1,6));
  for(const [i,b] of BUILDINGS.entries()){
    const trim=box;
    const foliage=smallSphere,pole=smallCylinder;
    const wall=[0xf0eee5,0xe4e5de,0xd8d2bf,0xe8ebe6][i%4];
    const accent=[0x309e89,0xe6b62d,0x9a72bf,0xdf6944,0x3b97b5][i%5];
    assets.shadow(streets,b.x+.5,b.z+.5,b.w+3,b.d+3);
    mesh(streets,box,0xd8dad3,b.x,.055,b.z,b.w+1.5,.11,b.d+1.5);
    mesh(streets,box,wall,b.x,b.h/2,b.z,b.w,b.h,b.d);
    mesh(collisionRoot,box,b.color,b.x,b.h/2,b.z,b.w,b.h,b.d);
    const roofColor=i%2?0x736c60:0x9b7560,roofPitch=2.45+(i%3)*.24;
    mesh(streets,roof,roofColor,b.x,b.h,b.z,b.w+.7,roofPitch,b.d+.8);
    const ridge=mesh(streets,cylinder,0x626760,b.x,b.h+roofPitch*.4,b.z,.055,b.w+.76,.055);
    ridge.rotation.z=Math.PI/2;
    const front=b.z+b.d/2;
    const back=b.z-b.d/2;
    mesh(streets,box,0xe1ddcc,b.x,b.h,front+.16,b.w+.45,.16,.28);
    mesh(streets,box,0xe1ddcc,b.x,b.h,back-.16,b.w+.45,.16,.28);
    mesh(streets,box,0xa49f90,b.x,.22,b.z,b.w+.08,.44,b.d+.08);
    mesh(streets,box,0xa49f90,b.x,.46,b.z,b.w+.12,.08,b.d+.12);
    mesh(streets,round,0xaaa79d,b.x,.12,front+.4,b.w*.73,.24,1.15);
    mesh(streets,box,0x393e3c,b.x,1.09,front+.035,1.08,2.18,.08);
    const door=new T.Group();door.position.set(b.x-.46,0,front+.09);scene.add(door);doorPivots.push(door);
    mesh(door,trim,accent,.46,1.04,0,.93,2.06,.085);
    mesh(door,box,0x9db3b4,.46,1.46,.052,.58,.57,.025);
    mesh(door,sphere,0xc6bc9d,.8,.98,.075,.04,.04,.055,0.5);
    assets.batchColors(door);
    // Only delivery doors animate; merge all other doors with the static city.
    if(!HOME_BUILDINGS.some(index=>index===i))streets.add(door);
    // The distant infill blocks keep a clean low-poly facade so the enlarged
    // map stays light; the delivery homes retain the full storefront detail.
    if(i>=24){
      for(const side of [-1,1]){
        const x=b.x+side*b.w*.28;
        mesh(streets,box,0x7f9d9e,x,1.65,front+.05,1.1,1.15,.05);
      }
      mesh(streets,pole,0xd6d0bc,b.x,1.25,front+.38,.055,2.5,.055);
      mesh(streets,foliage,0x5c7751,b.x+b.w*.36,.78,front+.42,.42,.52,.38);
      continue;
    }
    for(const side of [-1,1])for(const face of [-1,1]){
      const x=b.x+side*b.w*.30,z=b.z+face*(b.d/2+.04);
      mesh(streets,box,0xf7f5eb,x,1.65,z,1.35,1.9,.08);
      mesh(streets,box,0x7f9d9e,x,1.65,z+face*.05,1.13,1.7,.04);
      mesh(streets,box,0xe6e2d6,x,2.13,z+face*.08,.04,1.05,.025);
      mesh(streets,box,0xd2cfc1,x,1.48,z+face*.09,1.2,.09,.24);
      if(face===1&&i%3===0)mesh(streets,round,0x596760,x,2.78,z+.2,1.38,.10,.62,.25);
    }
    for(const side of [-1,1])for(const offset of [-.24,.24]){
      const x=b.x+side*(b.w/2+.04),z=b.z+offset*b.d;
      mesh(streets,box,0xe0ddcf,x,2.1,z,.08,1.24,1.05);
      mesh(streets,box,0x7f9d9e,x+side*.05,2.1,z,.035,1.04,.87);
      mesh(streets,box,0xe0ddcf,x+side*.08,2.1,z,.025,1.04,.04);
      mesh(streets,box,0xd2cfc1,x+side*.10,1.44,z,.25,.09,1.12);
    }
    for(const side of [-1,1])mesh(streets,pole,0xa29c89,b.x+side*(b.w/2-.10),b.h/2,front+.1,.035,b.h,.035);
    for(let y=4.7;y<b.h-.6;y+=2.6){
      for(const face of [-1,1]){
        const z=b.z+face*(b.d/2+.06);
        mesh(streets,box,0xe1ddcc,b.x,y-.85,z,b.w+.1,.12,.18);
        for(const side of [-1,1]){
          const x=b.x+side*b.w*.28;
          mesh(streets,box,0xe0ddcf,x,y,z,1.15,1.4,.1);
          mesh(streets,box,0x7f9d9e,x,y,z+face*.06,.95,1.2,.04);
          mesh(streets,box,0xe0ddcf,x,y,z+face*.09,.05,1.2,.025);
        }
      }
      for(const side of [-1,1])for(const offset of [-.24,.24]){
        const x=b.x+side*(b.w/2+.06),z=b.z+offset*b.d;
        mesh(streets,box,0xe0ddcf,x,y,z,.1,1.4,1.15);
        mesh(streets,box,0x7f9d9e,x+side*.06,y,z,.04,1.2,.95);
      }
    }
    for(const side of [-1,1])mesh(streets,pole,0xd6d0bc,b.x+side*1.05,1.32,front+.85,.065,2.64,.065);
    const awningWidth=b.w*.88;
    for(let stripe=0;stripe<10;stripe++){
      const x=b.x-awningWidth/2+(stripe+.5)*awningWidth/10,color=stripe%2?0xfff8e6:accent;
      mesh(streets,box,color,x,2.75,front+.42,awningWidth/10,.1,1.1).rotation.x=.16;
      mesh(streets,box,color,x,2.53,front+.95,awningWidth/10,.32,.08);
    }
    if(i%3===0){
      mesh(streets,box,accent,b.x,3.35,front+.08,1.45,.65,.15);
      // A parcel pictogram identifies shops without introducing untranslated copy.
      mesh(streets,box,0xfff8e6,b.x,3.35,front+.17,.42,.38,.025);
      mesh(streets,box,accent,b.x,3.35,front+.19,.055,.38,.015);
    }
    mesh(streets,pole,0xa48468,b.x+b.w*.36,.29,front+.48,.25,.55,.25);
    mesh(streets,foliage,0x5c7751,b.x+b.w*.36,.82,front+.48,.45,.58,.4);
  }
  collisionRoot.updateMatrixWorld(true);
  const canopies=[0x58784f,0x6f8d5d,0x879c6b,0x58784f].map(color=>{const m=new T.InstancedMesh(foliage,material(color),TREES.length);scene.add(m);return m;});
  const treeMatrix=new T.Matrix4(),treeScale=new T.Vector3(),treePosition=new T.Vector3(),treeRotation=new T.Quaternion(),treeAxis=new T.Vector3(0,1,0);
  for(const [i,{x,z}] of TREES.entries()){
    const lean=(i%5-2)*.035;
    const trunk=mesh(streets,taperedCylinder,0x796d58,x,1.48,z,.25,2.96,.25);trunk.rotation.z=lean;
    const upper=mesh(streets,taperedCylinder,0x796d58,x+lean*1.4,3.12,z,.16,1.85,.16);upper.rotation.z=lean*1.6;
    branch(streets,x,2.45,z,x-.72-(i%3)*.12,3.62,z+.18,.11);
    branch(streets,x,2.7,z,x+.68,3.92,z-.25-(i%2)*.18,.10);
    mesh(streets,foliage,0x796d58,x-.16,.16,z,.28,.12,.5);
    mesh(streets,foliage,0x796d58,x+.17,.14,z+.05,.25,.10,.42);
  }
  const lamps:T.Mesh[]=[];
  for(const {x,z} of LAMPS){
    mesh(streets,cylinder,0x626760,x,2.2,z,.065,4.4,.065);
    mesh(streets,round,0x626760,x+.35,4.4,z,.8,.08,.09);
    lamps.push(mesh(scene,round,0xd8d2b8,x+.66,4.36,z,.45,.1,.24));
  }
  for(let i=0;i<4;i++){
    mesh(streets,round,0x9c805c,-34+i*.7,.38,20,.62,.7,.75);
    for(let j=0;j<4;j++)mesh(streets,sphere,i%2?0xc99551:0xa45f49,-34+i*.7+(j%2-.5)*.24,.78,19.85+Math.floor(j/2)*.24,.14,.13,.14);
  }
  for(const x of [20,24]){
    mesh(streets,cylinder,0xa59c85,x,.85,38,.7,.1,.7);
    mesh(streets,cylinder,0x656d64,x,.43,38,.07,.86,.07);
    for(const side of [-1,1])mesh(streets,cylinder,0x817968,x+side*.95,.32,38,.28,.64,.28);
  }
  const flowers=new T.Group();scene.add(flowers);flowers.visible=false;
  for(let i=0;i<12;i++){
    mesh(flowers,cylinder,0x657f53,9+i*.22,.23,21,.024,.46,.024);
    mesh(flowers,sphere,i%2?0xe4c193:0xce8d81,9+i*.22,.5,21,.13,.12,.13);
  }
  const player=assets.person(0xbe9e65,0xbf926e,true);scene.add(player.group);
  const parcel=new T.Group();player.group.add(parcel);parcel.visible=false;
  mesh(parcel,round,0x796048,0,1.27,-.36,.60,.67,.38);
  mesh(parcel,round,0x4d6669,0,1.58,-.37,.63,.12,.41);
  mesh(parcel,box,0xe5d9aa,0,1.17,-.56,.45,.065,.012);
  for(const x of [-.19,.19])mesh(parcel,box,0x424c4a,x,1.31,-.56,.035,.45,.02);
  const motorcycle=assets.vehicle(true,0x466a70,false);scene.add(motorcycle.group);
  const headlight=new T.PointLight(0xffe1ad,0,15,2);scene.add(headlight);
  const waitingParcel=new T.Group();scene.add(waitingParcel);
  mesh(waitingParcel,box,0xb99668,0,.3,0,.45,.42,.36);
  mesh(waitingParcel,box,0xd9c89d,0,.52,0,.08,.012,.37);
  const residents=RESIDENTS.map((_,i)=>{
    const person=assets.person([0x889d92,0xbda08c,0x9f9c7e][i%3],i%2?0xb78160:0xd1a581,false,true,i);
    scene.add(person.group);person.group.visible=false;return person;
  });
  const pedestrians=activity.pedestrians.map((p,i)=>{
    const person=assets.person([0xa09083,0x627e89,0x939b76,0xb8aba0][i%4],i%2?0xb58161:0xd6ac87,false,true,i);
    scene.add(person.group);return {...p,person};
  });
  const traffic=activity.traffic.map((c,i)=>{
    const vehicle=assets.vehicle(c.motorcycle,[0xefbf27,0xe85d4c,0x329ccc,0x299b86,0xec8742][i]);
    scene.add(vehicle.group);return {...c,vehicle};
  });
  const dogs=activity.dogs.map(d=>{
    const group=new T.Group(),legs:T.Mesh[]=[];scene.add(group);
    mesh(group,sphere,0x9a7753,0,.58,0,.26,.3,.52);
    mesh(group,sphere,0x806044,0,.93,.35,.22,.25,.25);
    mesh(group,sphere,0xb49873,0,.83,.57,.15,.105,.22);
    mesh(group,sphere,0x292e2b,0,.86,.75,.085,.06,.045);
    for(const side of [-1,1]){
      mesh(group,sphere,0x6d513b,side*.19,.99,.3,.09,.22,.10);
      mesh(group,sphere,0x292e2b,side*.12,.98,.53,.028,.024,.028);
      for(const z of [-.3,.3])legs.push(mesh(group,cylinder,0x9a7753,side*.17,.25,z,.055,.5,.055));
    }
    const tail=mesh(group,cylinder,0x806044,0,.8,-.5,.05,.6,.05);tail.rotation.x=-.8;
    mesh(group,cylinder,0x923e34,0,.81,.35,.225,.07,.225);assets.shadow(group,0,0,1.1,1.5);
    return {dog:d,group,legs,tail};
  });
  const rainPositions=new Float32Array(160*6),rainGeometry=geometry(new T.BufferGeometry());
  rainGeometry.setAttribute('position',new T.BufferAttribute(rainPositions,3));
  const rainMaterial=new T.LineBasicMaterial({color:0xc2dae5,transparent:true,opacity:.45});
  const rain=new T.LineSegments(rainGeometry,rainMaterial);rain.frustumCulled=false;scene.add(rain);
  const dustPositions=new Float32Array(24*3),dustGeometry=geometry(new T.BufferGeometry());dustGeometry.setAttribute('position',new T.BufferAttribute(dustPositions,3));
  const dustMaterial=new T.PointsMaterial({color:0xe5bd80,size:.10,transparent:true,opacity:.8});
  const dust=new T.Points(dustGeometry,dustMaterial);dust.frustumCulled=false;scene.add(dust);
  const clouds=new T.Group();scene.add(clouds);
  for(let i=0;i<12;i++)for(let j=0;j<3;j++){
    const a=i/12*Math.PI*2;
    mesh(clouds,sphere,0xeaf0ee,Math.sin(a)*140+j*3,23+i%3*1.5,Math.cos(a)*140,10,2+j*.5,6);
  }
  assets.batch(clouds);assets.batch(streets);
  const marker=new T.Group();scene.add(marker);
  const ring=mesh(marker,geometry(new T.TorusGeometry(.65,.035,5,24)),0xffedb9,0,.12,0,1,1,1);ring.rotation.x=-Math.PI/2;
  const arrow=mesh(marker,cylinder,0xffedb9,0,2.9,0,.065,.45,.065);
  const cameraTarget=new T.Vector3(),desiredCamera=new T.Vector3(),cameraDirection=new T.Vector3();
  const cameraRay=new T.Raycaster();let lastTime=0,lastYaw=0,steer=0,lightState='';
  const groundHeight=(x:number,z:number)=>BUILDINGS.some(b=>Math.abs(x-b.x)<b.w*.365&&Math.abs(z-(b.z+b.d/2+.4))<.575)?.25:
    !paved(x,z,true)&&SIDEWALKS.some(s=>Math.abs(x-s.x)<s.w/2&&Math.abs(z-s.z)<s.d/2)?.19:.06;
  function update(state:CourierState,time:number,moving:boolean,reduced:boolean,aspect:number,yaw=0){
    const dt=Math.max(0,Math.min(.05,time-lastTime));lastTime=time;
    const wet=state.weather==='rain'||state.weather==='storm',wind=state.weather==='wind'||state.weather==='storm';
    const lightKey=`${state.day}:${wet}`;
    if(lightState!==lightKey){
      lightState=lightKey;
      const look={morning:{sky:0xb9ced3,sun:0xffd4a2,intensity:2.2,ambient:1.65,x:-65,y:25},noon:{sky:0xb9d6e8,sun:0xffeccd,intensity:2.7,ambient:2,x:-35,y:65},evening:{sky:0xceaba1,sun:0xffae71,intensity:1.6,ambient:1.15,x:65,y:18},night:{sky:0x142539,sun:0x809bbf,intensity:.22,ambient:.8,x:20,y:55}}[state.day];
      (scene.background as T.Color).set(wet?(state.day==='night'?0x182333:0x8699a3):look.sky);(scene.fog as T.Fog).color.copy(scene.background as T.Color);
      sun.color.set(look.sun);sun.intensity=look.intensity*(wet?.45:1);sun.position.set(look.x,look.y,22);ambient.intensity=look.ambient;
      material(0x7f9d9e).emissive.set(state.day==='night'?0xe7b473:0x000000);material(0x7f9d9e).emissiveIntensity=.65;
      material(0xeaf0ee).color.set(state.day==='night'?0x536575:wet?0xa6b2b7:0xeaf0ee);
      material(asphalt).roughness=wet?.38:.95;
    }
    const yawDelta=Math.atan2(Math.sin(yaw-lastYaw),Math.cos(yaw-lastYaw));lastYaw=yaw;
    const turn=state.riding&&!reduced&&dt>0?Math.max(-.28,Math.min(.28,yawDelta/dt*.14)):0;steer+=(turn-steer)*Math.min(1,dt*12);
    player.group.position.set(state.x,state.riding?.06:groundHeight(state.x,state.z),state.z);
    if(state.riding)player.ride(steer);else player.animate(time,moving,reduced);
    parcel.visible=state.carrying;parcel.rotation.copy(player.body.rotation);
    parcel.position.set(0,player.body.position.y-.92*Math.cos(player.body.rotation.x),player.body.position.z-.92*Math.sin(player.body.rotation.x));
    player.group.rotation.z=state.crashTime>0?Math.sin(Math.min(1,state.crashTime)*Math.PI/2)*.65:0;
    motorcycle.group.position.set(state.bike.x,.06,state.bike.z);if(state.riding)motorcycle.group.rotation.y=yaw+Math.PI;
    motorcycle.steering.rotation.y=state.riding?steer:0;
    motorcycle.group.rotation.z=state.crashTime>0&&state.riding?.7:0;
    if(state.riding&&!reduced)motorcycle.wheels.forEach(w=>w.rotation.x+=dt*state.speed/.34);
    headlight.position.set(state.bike.x-Math.sin(yaw)*1.2,1.2,state.bike.z-Math.cos(yaw)*1.2);headlight.intensity=state.day==='night'?9:0;
    const p=targetFor(state);marker.position.set(p.x,0,p.z);marker.visible=!state.completed;
    waitingParcel.position.set(p.x,groundHeight(p.x,p.z),p.z);waitingParcel.visible=!state.carrying&&!state.completed;
    arrow.position.y=2.9+(reduced?0:Math.sin(time*3)*.1);
    lamps.forEach(m=>{m.material=material(state.day==='night'||state.day==='evening'?0xffe4af:0xd8d2b8);});material(0xffe4af).emissive.set(0xffd28d);material(0xffe4af).emissiveIntensity=1.2;flowers.visible=state.delivery>=4;
    residents.forEach((person,i)=>{
      const visit=state.visit?.resident===i?state.visit:null;
      // Everyone waits indoors. Only a knock brings the recipient to the threshold.
      person.group.visible=Boolean(visit);
      const progress=visit?.phase==='opening'?Math.min(1,visit.time/1.5):visit?.phase==='leaving'?Math.max(0,1-visit.time/2.5):1;
      const resident=activity.residents[i];
      person.group.position.set(resident.state.x,0,resident.state.z);
      person.group.position.y=groundHeight(person.group.position.x,person.group.position.z);
      person.group.rotation.y=visit?.phase==='leaving'?Math.PI:0;
      person.animate(time,!!visit&&visit.phase!=='waiting',reduced);
      doorPivots[HOME_BUILDINGS[i]].rotation.y=visit?-Math.min(1,progress*3)*1.4:0;
    });
    pedestrians.forEach(({state:person,person:actor})=>{
      actor.group.position.set(person.x,groundHeight(person.x,person.z),person.z);actor.group.rotation.y=person.yaw;actor.animate(time,!person.stopped,reduced);
    });
    traffic.forEach(({state:car,vehicle})=>{
      vehicle.group.position.set(car.x,.06,car.z);vehicle.group.rotation.y=car.yaw;
      if(!car.stopped&&!reduced)vehicle.wheels.forEach(w=>{w.rotation.x+=dt*car.speed/.34;});
    });
    dogs.forEach(({dog,group,legs,tail})=>{group.position.set(dog.state.x,groundHeight(dog.state.x,dog.state.z),dog.state.z);group.rotation.y=dog.state.yaw;legs.forEach((leg,i)=>leg.rotation.x=dog.moving&&!reduced?Math.sin(time*14+i%2*Math.PI)*.5:0);tail.rotation.z=reduced?0:Math.sin(time*6)*.2;});
    canopies.forEach((canopy,j)=>{TREES.forEach((p,i)=>{
      const offsetX=[-.78,.72,.04,-.44][j],offsetZ=[.08,-.28,.48,-.46][j],height=[3.78,3.9,4.28,4.42][j],baseScale=[1.2,1.18,1.32,.98][j],variation=1+(i%5)*.055;
      treePosition.set(p.x+offsetX+(reduced?0:Math.sin(time*1.5+i)* (wind?.35:.035)),height+(i%3)*.08,p.z+offsetZ);
      treeScale.set(baseScale*variation,(baseScale*1.22)*variation,(baseScale*(.94+j%2*.09))*variation);
      treeRotation.setFromAxisAngle(treeAxis,(i*.73+j*.9)%Math.PI);treeMatrix.compose(treePosition,treeRotation,treeScale);canopy.setMatrixAt(i,treeMatrix);
    });canopy.instanceMatrix.needsUpdate=true;if(!canopy.boundingSphere){canopy.computeBoundingSphere();canopy.boundingSphere!.radius+=1;}});
    rain.visible=wet;
    if(wet){rain.position.set(state.x,0,state.z);for(let i=0;i<160;i++){
      const x=(i*7.13)%24-12,z=(i*11.71)%24-12,y=((i*.73-(reduced?0:time*12))%12+12)%12;
      const k=i*6;rainPositions[k]=x;rainPositions[k+1]=y;rainPositions[k+2]=z;rainPositions[k+3]=x+(wind?.4:.07);rainPositions[k+4]=y-.6;rainPositions[k+5]=z;
    }rainGeometry.attributes.position.needsUpdate=true;}
    dust.visible=state.crashTime>0;
    if(dust.visible){const age=1.3-state.crashTime;dust.position.set(state.x,.2,state.z);dustMaterial.opacity=Math.max(0,state.crashTime/1.3);
      for(let i=0;i<24;i++){dustPositions[i*3]=Math.sin(i*2.4)*age*1.6;dustPositions[i*3+1]=Math.max(0,Math.sin(age*2)*.7+i%3*.08);dustPositions[i*3+2]=Math.cos(i*2.4)*age*1.6;}dustGeometry.attributes.position.needsUpdate=true;}
    clouds.position.x=reduced?0:Math.sin(time*(wind?.05:.012))*6;
    const boom=state.riding?16:14,height=state.riding?11:9;
    cameraTarget.set(state.x,1.45,state.z);desiredCamera.set(state.x+Math.sin(yaw)*boom,height,state.z+Math.cos(yaw)*boom);
    cameraDirection.copy(desiredCamera).sub(cameraTarget);const boomLength=cameraDirection.length();cameraDirection.normalize();
    cameraRay.set(cameraTarget,cameraDirection);cameraRay.far=boomLength;
    const obstruction=cameraRay.intersectObjects(collisionRoot.children,false)[0];
    const distance=obstruction?Math.max(.45,obstruction.distance-.25):boomLength;
    camera.position.copy(cameraTarget).addScaledVector(cameraDirection,distance);
    camera.lookAt(cameraTarget.x-Math.sin(yaw)*1.5,1.45,cameraTarget.z-Math.cos(yaw)*1.5);
    player.group.visible=distance>1.05;camera.aspect=aspect;camera.updateProjectionMatrix();
  }
  return {scene,camera,player,update,residents,doorPivots,traffic,pedestrians,dogs,motorcycle,parcel,dispose(){assets.dispose();rainMaterial.dispose();dustMaterial.dispose();canopies.forEach(m=>m.dispose());scene.clear();collisionRoot.clear();}};
}
export type Village=ReturnType<typeof createVillage>;
