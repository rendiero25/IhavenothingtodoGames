import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Shared geometry/material bank. Rounded silhouettes, physically lit matte surfaces. */
export function createAssets(){
  const geometries=new Set<T.BufferGeometry>();
  const materials=new Map<string,T.MeshStandardMaterial>();
  const surfaceTextures=new Map<string,T.DataTexture>();
  const geometry=<G extends T.BufferGeometry>(g:G):G=>{geometries.add(g);return g;};
  const box=geometry(new T.BoxGeometry(1,1,1));
  const round=geometry(new RoundedBoxGeometry(1,1,1,1,.12));
  const sphere=geometry(new T.SphereGeometry(1,12,8));
  const cylinder=geometry(new T.CylinderGeometry(1,1,1,12));
  const capsule=geometry(new T.CapsuleGeometry(.5,1,3,8));
  const roof=geometry(new T.CylinderGeometry(1,1,1,3));
  const shadowPixels=new Uint8Array(32*32*4);
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){
    const alpha=Math.max(0,1-Math.hypot((x-15.5)/15.5,(y-15.5)/15.5));
    shadowPixels[(y*32+x)*4+3]=Math.round(alpha*alpha*85);
  }
  const shadowTexture=new T.DataTexture(shadowPixels,32,32);shadowTexture.needsUpdate=true;
  shadowTexture.magFilter=T.LinearFilter;shadowTexture.minFilter=T.LinearFilter;
  const shadowMaterial=new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false});
  const shadowPlane=geometry(new T.PlaneGeometry(1,1));
  function shadow(parent:T.Object3D,x:number,z:number,w:number,d:number){
    const m=new T.Mesh(shadowPlane,shadowMaterial);m.rotation.x=-Math.PI/2;m.position.set(x,.085,z);m.scale.set(w,d,1);parent.add(m);
  }
  const material=(color:number,metal=0)=>{
    const key=`${color}:${metal}`;
    if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:metal?.32:.86,metalness:metal}));
    return materials.get(key)!;
  };
  function surface(color:number,kind:'roof'|'road'|'wall'){
    let texture=surfaceTextures.get(kind);
    if(!texture){const pixels=new Uint8Array(64*64*4);
      for(let y=0;y<64;y++)for(let x=0;x<64;x++){
        let value=225+(x*37+y*17)%24;
        if(kind==='roof'&&(y%8===0||(x+(Math.floor(y/8)%2)*8)%16===0))value=160;
        if(kind==='wall')value=244+(x*13+y*7)%12;
        const i=(y*64+x)*4;pixels[i]=pixels[i+1]=pixels[i+2]=value;pixels[i+3]=255;
      }
      texture=new T.DataTexture(pixels,64,64);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(kind==='road'?12:3,kind==='road'?12:3);texture.magFilter=T.LinearFilter;texture.needsUpdate=true;surfaceTextures.set(kind,texture);
    }
    const mat=material(color);mat.map=texture;mat.needsUpdate=true;return mat;
  }
  function mesh(parent:T.Object3D,g:T.BufferGeometry,color:number,x:number,y:number,z:number,sx:number,sy:number,sz:number,metal=0){
    const m=new T.Mesh(g,material(color,metal));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;
  }
  function person(color:number,skin=0xbc8d6a,courier=false,groundShadow=true){
    const group=new T.Group(),body=new T.Group();group.add(body);
    mesh(body,sphere,color,0,1.18,0,.26,.37,.16);
    mesh(body,cylinder,skin,0,1.51,0,.075,.14,.075);
    mesh(body,sphere,skin,0,1.72,0,.165,.22,.17);
    mesh(body,sphere,0x332b26,0,1.84,-.025,.172,.115,.17);
    mesh(body,sphere,skin,0,1.71,.17,.032,.045,.06);
    for(const x of [-.065,.065])mesh(body,sphere,0x292d30,x,1.77,.148,.018,.015,.018);
    const legs:T.Group[]=[],arms:T.Group[]=[];
    for(const side of [-1,1]){
      const leg=new T.Group();leg.position.set(side*.12,.92,0);group.add(leg);legs.push(leg);
      mesh(leg,capsule,0x354652,0,-.21,0,.18,.22,.19);
      mesh(leg,capsule,0x354652,0,-.61,.015,.145,.20,.15);
      mesh(leg,sphere,0x354652,0,-.42,.018,.093,.105,.095);
      mesh(leg,round,0x333536,0,-.85,.07,.20,.12,.35);
      const arm=new T.Group();arm.position.set(side*.27,1.39,0);group.add(arm);arms.push(arm);
      mesh(arm,capsule,color,side*.03,-.16,0,.14,.17,.15);
      mesh(arm,capsule,skin,side*.03,-.42,.02,.105,.13,.11);
      mesh(arm,sphere,skin,side*.03,-.32,.02,.062,.068,.065);
      mesh(arm,sphere,skin,side*.03,-.58,.02,.065,.085,.06);
    }
    if(courier){
      mesh(body,sphere,0x435e64,0,1.88,0,.205,.19,.205);
      mesh(body,round,0x243c45,0,1.78,.178,.32,.095,.06,.25);
      for(const x of [-.16,.16])mesh(body,round,0x76553e,x,1.28,.13,.045,.48,.035);
    }
    batch(body);legs.forEach(batch);arms.forEach(batch);if(groundShadow)shadow(group,0,0,1.3,1);
    function animate(time:number,moving:boolean,reduced:boolean){
      const stride=moving&&!reduced?Math.sin(time*9)*.52:0;
      legs[0].rotation.x=stride;legs[1].rotation.x=-stride;
      arms[0].rotation.x=-stride*.7;arms[1].rotation.x=stride*.7;
      body.position.y=moving&&!reduced?Math.abs(Math.sin(time*9))*.025:0;
    }
    return {group,legs,arms,animate};
  }
  function vehicle(motorcycle:boolean,color:number,withRider=true){
    const group=new T.Group(),wheels:T.Mesh[]=[];
    if(motorcycle){
      mesh(group,round,color,0,.72,0,.45,.42,1.35,.25);
      mesh(group,round,0x292c2f,0,1.0,.1,.40,.15,.68);
      mesh(group,cylinder,0x777b7e,0,1.1,.6,.035,.7,.035,.6).rotation.z=Math.PI/2;
      mesh(group,sphere,color,0,.77,.65,.24,.25,.35,.3);
      mesh(group,sphere,0xe8e4cc,0,.92,.87,.15,.10,.045);
      for(const side of [-1,1]){
        const fork=mesh(group,cylinder,0x848c8e,side*.12,.60,.68,.025,.65,.025,.65);fork.rotation.x=-.16;
        mesh(group,cylinder,0x848c8e,side*.29,1.25,.59,.018,.38,.018,.65);
        mesh(group,sphere,0x55636c,side*.32,1.45,.59,.105,.065,.035,.3);
      }
      mesh(group,round,0x616767,.25,.4,-.48,.12,.13,.65,.65);
      if(withRider){
      const rider=person(0x51585f,0xbc8d6a,false,false);rider.group.scale.setScalar(.78);rider.group.position.set(0,.3,-.1);
      rider.legs.forEach((l,i)=>{l.rotation.x=-.9;l.rotation.z=i===0?-.3:.3;});
      rider.arms.forEach(a=>a.rotation.x=-1.05);group.add(rider.group);
      mesh(rider.group,sphere,0xd8dbd8,0,1.77,0,.205,.245,.215);
      }
    }else{
      mesh(group,round,color,0,.61,0,1.8,.52,3.7,.3);
      mesh(group,round,color,0,1.03,-.15,1.6,.70,2.15,.3);
      mesh(group,round,0x3e5968,0,1.12,-.15,1.64,.42,1.87,.35);
      mesh(group,round,color,0,1.40,-.15,1.5,.10,1.9,.3);
      for(const side of [-1,1]){
        mesh(group,round,0xe1d9bb,side*.62,.72,1.86,.42,.15,.06);
        mesh(group,round,0x9f5142,side*.63,.70,-1.86,.4,.13,.06);
        mesh(group,round,color,side*.86,1.08,.48,.28,.12,.18,.3);
        mesh(group,round,color,side*.82,1.1,-.1,.08,.5,.09,.3);
      }
    }
    batch(group);shadow(group,0,0,motorcycle?1.4:3,motorcycle?2.6:5);
    for(const z of motorcycle?[-.7,.7]:[-1.15,1.15])for(const x of motorcycle?[0]:[-.88,.88]){
      const wheel=mesh(group,cylinder,0x282b2c,x,.34,z,.34,motorcycle?.14:.2,.34);wheel.rotation.z=Math.PI/2;wheels.push(wheel);
      mesh(wheel,cylinder,0x919797,0,0,0,.56,1.03,.56,.6);
    }
    return {group,wheels};
  }
  function batch(root:T.Group){
    root.updateMatrixWorld(true);
    const inverse=root.matrixWorld.clone().invert();
    const buckets=new Map<T.Material,T.BufferGeometry[]>();
    root.traverse(o=>{if(o instanceof T.Mesh){
      const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));
      const mat=o.material as T.Material;if(!buckets.has(mat))buckets.set(mat,[]);buckets.get(mat)!.push(g);
    }});
    root.clear();
    for(const [mat,parts] of buckets){const combined=mergeGeometries(parts);parts.forEach(g=>g.dispose());if(combined){geometry(combined);const m=new T.Mesh(combined,mat);root.add(m);}}
  }
  return {geometry,box,round,sphere,cylinder,capsule,roof,mesh,material,surface,person,vehicle,batch,shadow,dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());surfaceTextures.forEach(t=>t.dispose());shadowMaterial.dispose();shadowTexture.dispose();}};
}
