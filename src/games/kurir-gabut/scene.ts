import * as T from 'three';
import { BUILDINGS, RESIDENTS, STREETS, type CourierState, targetFor } from './logic';

const INK=0x363b36, PAPER=0xf0eadc;
export function createVillage() {
  const scene=new T.Scene(); scene.background=new T.Color(PAPER);
  const camera=new T.PerspectiveCamera(58,1,.08,85);
  scene.fog=new T.Fog(PAPER,28,65);
  const geometries=new Set<T.BufferGeometry>();
  const materials=new Map<number,T.MeshToonMaterial>();
  const edgesMaterial=new T.LineBasicMaterial({color:INK});
  const geometry=<G extends T.BufferGeometry>(g:G):G=>{geometries.add(g);return g;};
  const box=geometry(new T.BoxGeometry(1,1,1));
  const sphere=geometry(new T.IcosahedronGeometry(1,1));
  const cone=geometry(new T.ConeGeometry(1,1,5));
  const cylinder=geometry(new T.CylinderGeometry(1,1,1,12));
  const boxEdges=geometry(new T.EdgesGeometry(box));
  const material=(color:number)=>{
    if(!materials.has(color)) materials.set(color,new T.MeshToonMaterial({color}));
    return materials.get(color)!;
  };
  const mesh=(parent:T.Object3D,g:T.BufferGeometry,color:number,x:number,y:number,z:number,sx:number,sy:number,sz:number,outline=false)=>{
    const m=new T.Mesh(g,material(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);
    if(outline){const e=new T.LineSegments(boxEdges,edgesMaterial);m.add(e);}return m;
  };
  scene.add(new T.HemisphereLight(0xfff9eb,0x8b9685,2.5));
  const sun=new T.DirectionalLight(0xfff4df,3);sun.position.set(-8,20,10);scene.add(sun);
  mesh(scene,cylinder,0xaeb79d,0,-.6,0,15,.95,15);
  mesh(scene,cylinder,0xd2c6ac,0,-1.1,0,14.6,.3,14.6);
  // A street-level network: a main road, residential lanes, and narrow shortcuts.
  for(const [index,s] of STREETS.entries()) {
    mesh(scene,box,index===0?0xc3bbaa:0xddd0b6,s.x,-.035-index*.001,s.z,s.w,.04,s.d);
    if(index<3)for(let x=-11;x<=11;x+=2)mesh(scene,box,0xb7ae99,x,-.005,s.z+.7,.025,.012,.7);
  }
  const cameraObstacles:T.Object3D[]=[];
  for(const b of BUILDINGS){
    cameraObstacles.push(mesh(scene,box,b.color,b.x,b.h/2,b.z,b.w,b.h,b.d,true));
    const roof=mesh(scene,cone,0x686f65,b.x,b.h+.6,b.z,b.w*.83,1.55,b.d*.83);roof.rotation.y=Math.PI/4;cameraObstacles.push(roof);
    mesh(scene,box,0x4e5a53,b.x,.9,b.z+b.d/2+.03,.85,1.8,.08,true);
    for(const side of [-1,1]){
      mesh(scene,box,0xefe7cd,b.x+side*b.w*.31,b.h*.63,b.z+b.d/2+.06,.65,.75,.07,true);
      mesh(scene,box,INK,b.x+side*b.w*.31,b.h*.63,b.z+b.d/2+.11,.04,.75,.03);
    }
    mesh(scene,box,0xe9dec3,b.x,b.h*.9,b.z+b.d/2+.32,b.w*1.03,.18,.8,true);
  }
  // Market awning and crates.
  for(let i=0;i<6;i++)mesh(scene,box,i%2?PAPER:0x9c6e5b,-9.1+i*.45,2.25,5, .45,.14,1.3);
  for(const x of [-9.2,-6.8])mesh(scene,box,INK,x,1.1,5.4,.08,2.2,.08);
  for(let i=0;i<3;i++)mesh(scene,box,0xb69773,-9+i*.65,.3,5.4,.55,.6,.6,true);
  // Trees along the outer bank; fixed count and shared buffers.
  for(let i=0;i<18;i++){
    const angle=i/18*Math.PI*2, r=12.8;
    const x=Math.cos(angle)*r,z=Math.sin(angle)*r;
    if(BUILDINGS.some(b=>Math.abs(x-b.x)<3 && Math.abs(z-b.z)<3))continue;
    mesh(scene,cylinder,0x6d6656,x,.65,z,.13,1.3,.13);
    mesh(scene,sphere,i%2?0x81947d:0x98a58a,x,1.9,z,1,1.25,.9);
    mesh(scene,sphere,0xaab397,x+.35,2.4,z,.65,.8,.65);
  }
  const lamps:T.Mesh[]=[];
  for(const [x,z] of [[-3,-3],[3,5],[-4,8],[5,-3]]){
    mesh(scene,cylinder,INK,x,1.3,z,.07,2.6,.07);
    lamps.push(mesh(scene,sphere,0x777c6b,x,2.75,z,.24,.3,.24));
  }
  const pennants=new T.Group();scene.add(pennants);pennants.visible=false;
  const ropeGeometry=geometry(new T.BufferGeometry().setFromPoints([new T.Vector3(-4,3.5,1),new T.Vector3(4,3.5,1)]));
  pennants.add(new T.Line(ropeGeometry,edgesMaterial));
  for(let i=0;i<8;i++){const flag=mesh(pennants,cone,i%2?0xd1a078:0xb6c6b3,-3.5+i,3.2,1,.23,.55,.05);flag.rotation.z=Math.PI;}
  const flowers=new T.Group();scene.add(flowers);flowers.visible=false;
  for(let i=0;i<16;i++){
    const a=i*2.4,x=4+Math.cos(a)*1.5,z=9+Math.sin(a)*1.5;
    mesh(flowers,cylinder,0x768569,x,.2,z,.025,.4,.025);
    mesh(flowers,sphere,i%2?0xecd3ac:0xdca89a,x,.45,z,.15,.12,.15);
  }
  const actor=(color:number,hat=false)=>{
    const group=new T.Group();
    mesh(group,box,color,0,.9,0,.5,.64,.34,true);
    mesh(group,sphere,0xe0bea0,0,1.49,0,.27,.3,.26);
    mesh(group,box,INK,-.12,1.51,.23,.055,.045,.025);
    mesh(group,box,INK,.12,1.51,.23,.055,.045,.025);
    const legs=[mesh(group,box,0x414b48,-.15,.34,0,.18,.52,.22),mesh(group,box,0x414b48,.15,.34,0,.18,.52,.22)];
    mesh(group,box,color,-.34,.94,0,.16,.53,.2);mesh(group,box,color,.34,.94,0,.16,.53,.2);
    if(hat){mesh(group,cylinder,0xa86c54,0,1.78,0,.3,.16,.3);mesh(group,box,0xa86c54,0,1.74,.22,.5,.05,.3);}
    scene.add(group);return {group,legs};
  };
  const player=actor(0xe5c28b,true);
  const parcel=mesh(player.group,box,0xb89570,0,.94,-.31,.5,.5,.3,true);
  parcel.visible=false;
  const residents=RESIDENTS.map((p,i)=>{const a=actor([0x9baea6,0xd1ae99,0xbeb392][i%3]);a.group.position.set(p.x,0,p.z);return a;});
  const cat=new T.Group();scene.add(cat);cat.visible=false;
  mesh(cat,box,0x666f65,0,.25,0,.3,.3,.6);
  mesh(cat,sphere,0x666f65,0,.5,.26,.23,.22,.2);
  for(const x of [-.15,.15])mesh(cat,cone,0x666f65,x,.72,.26,.1,.22,.1);
  const marker=new T.Group();scene.add(marker);
  const ring=geometry(new T.TorusGeometry(.85,.045,5,24));
  const ringMesh=mesh(marker,ring,0xfff5ce,0,.08,0,1,1,1);ringMesh.rotation.x=-Math.PI/2;
  const arrow=mesh(marker,cone,0xfff5ce,0,2.7,0,.3,.55,.3);arrow.rotation.z=Math.PI;
  const cameraTarget=new T.Vector3();
  const desiredCamera=new T.Vector3(),cameraDirection=new T.Vector3();
  const cameraRay=new T.Raycaster();
  function update(state:CourierState,time:number,moving:boolean,reduced:boolean,aspect:number,yaw=0){
    player.group.position.set(state.x,0,state.z);parcel.visible=state.carrying;
    const stride=moving&&!reduced?Math.sin(time*12)*.45:0;
    player.legs[0].rotation.x=stride;player.legs[1].rotation.x=-stride;
    player.group.position.y=moving&&!reduced?Math.abs(Math.sin(time*12))*.045:0;
    const p=targetFor(state);marker.position.set(p.x,0,p.z);marker.visible=!state.completed;
    arrow.position.y=2.7+(reduced?0:Math.sin(time*3)*.12);
    lamps.forEach(m=>{m.material=material(state.delivery>=1?0xffe5a4:0x777c6b);});
    pennants.visible=state.delivery>=2;flowers.visible=state.delivery>=4;
    residents.forEach((a,i)=>{a.group.rotation.y=Math.atan2(state.x-RESIDENTS[i].x,state.z-RESIDENTS[i].z);a.group.position.y=state.delivery>=3&&!reduced?Math.max(0,Math.sin(time*3+i))*.15:0;});
    cat.visible=state.delivery>=5;
    cat.position.set(state.x-.8,0,state.z-.8);
    // Shoulder-height chase camera. Pull forward when a wall blocks the camera boom.
    cameraTarget.set(state.x,1.35,state.z);
    desiredCamera.set(state.x+Math.sin(yaw)*4.2,3.0,state.z+Math.cos(yaw)*4.2);
    cameraDirection.copy(desiredCamera).sub(cameraTarget);
    const boomLength=cameraDirection.length();cameraDirection.normalize();
    scene.updateMatrixWorld(true);
    cameraRay.set(cameraTarget,cameraDirection);cameraRay.far=boomLength;
    const obstruction=cameraRay.intersectObjects(cameraObstacles,false)[0];
    const distance=obstruction?Math.max(.45,obstruction.distance-.25):boomLength;
    camera.position.copy(cameraTarget).addScaledVector(cameraDirection,distance);
    camera.lookAt(cameraTarget.x-Math.sin(yaw)*1.5,1.35,cameraTarget.z-Math.cos(yaw)*1.5);
    player.group.visible=distance>1.05;
    camera.aspect=aspect;camera.updateProjectionMatrix();
  }
  return {scene,camera,player,update,dispose(){
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());edgesMaterial.dispose();scene.clear();
  }};
}
export type Village=ReturnType<typeof createVillage>;
