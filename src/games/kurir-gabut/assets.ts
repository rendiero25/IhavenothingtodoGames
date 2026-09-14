import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { createActors } from './actors';

/** Shared geometry/material bank. Rounded silhouettes, physically lit matte surfaces. */
export function createAssets(){
  const geometries=new Set<T.BufferGeometry>();
  const materials=new Map<string,T.MeshStandardMaterial>();
  const surfaceTextures=new Map<string,T.DataTexture>();
  const surfaceReliefs=new Map<string,T.DataTexture>();
  const geometry=<G extends T.BufferGeometry>(g:G):G=>{geometries.add(g);return g;};
  const box=geometry(new T.BoxGeometry(1,1,1));
  const round=geometry(new RoundedBoxGeometry(1,1,1,1,.12));
  const sphere=geometry(new T.SphereGeometry(1,10,6));
  const foliage=geometry(new T.IcosahedronGeometry(1,1));
  const cylinder=geometry(new T.CylinderGeometry(1,1,1,12));
  const taperedCylinder=geometry(new T.CylinderGeometry(.68,1,1,10));
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
  function surface(color:number,kind:'roof'|'road'|'wall'|'ground'|'paving'){
    let texture=surfaceTextures.get(kind);
    let relief=surfaceReliefs.get(kind);
    if(!texture||!relief){const pixels=new Uint8Array(64*64*4),reliefPixels=new Uint8Array(64*64*4);
      for(let y=0;y<64;y++)for(let x=0;x<64;x++){
        const grain=(x*37+y*17+x*y*3)%29;
        let value=kind==='wall'?232+grain%21:kind==='ground'?184+grain%38:198+grain;
        let height=118+grain;
        if(kind==='roof'){
          const stagger=(Math.floor(y/8)%2)*8;
          const seam=y%8===0||(x+stagger)%16===0;
          value=seam?126:205+grain%26;height=seam?72:142+grain%24;
        }else if(kind==='paving'){
          const seam=y%16===0||(x+(Math.floor(y/16)%2)*8)%16===0;
          value=seam?158:220+grain%20;height=seam?72:137+grain/2;
        }else if(kind==='road'){
          const aggregate=(x*11+y*23)%31===0;
          value=aggregate?150:190+grain;height=aggregate?92:124+grain;
        }else if(kind==='wall'){
          const plaster=(x*19+y*31)%47===0;
          value=plaster?211:value;height=plaster?105:128+grain/2;
        }else{
          const blade=(x*5+y*13)%17===0;
          value=blade?151:value;height=blade?148:112+grain;
        }
        const i=(y*64+x)*4;
        pixels[i]=pixels[i+1]=pixels[i+2]=value;pixels[i+3]=255;
        reliefPixels[i]=reliefPixels[i+1]=reliefPixels[i+2]=height;reliefPixels[i+3]=255;
      }
      texture=new T.DataTexture(pixels,64,64);texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.repeat.set(kind==='road'?12:3,kind==='road'?12:3);texture.magFilter=T.LinearFilter;texture.needsUpdate=true;surfaceTextures.set(kind,texture);
      relief=new T.DataTexture(reliefPixels,64,64);relief.wrapS=relief.wrapT=T.RepeatWrapping;relief.repeat.copy(texture.repeat);relief.magFilter=T.LinearFilter;relief.needsUpdate=true;surfaceReliefs.set(kind,relief);
    }
    const mat=material(color);mat.map=texture;mat.bumpMap=relief;mat.bumpScale=kind==='road'?.035:kind==='roof'?.045:kind==='ground'?.025:.018;
    mat.roughness=kind==='road'?.94:kind==='ground'?1:.88;mat.needsUpdate=true;return mat;
  }
  function mesh(parent:T.Object3D,g:T.BufferGeometry,color:number,x:number,y:number,z:number,sx:number,sy:number,sz:number,metal=0){
    const m=new T.Mesh(g,material(color,metal));m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;
  }
  const actors=createActors({geometry,box,round,sphere,cylinder,mesh,shadow});
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
  return {geometry,box,round,sphere,foliage,cylinder,taperedCylinder,capsule,roof,mesh,material,surface,person:actors.person,vehicle:actors.vehicle,batchColors:actors.batchColors,batch,shadow,dispose(){actors.dispose();geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());surfaceTextures.forEach(t=>t.dispose());surfaceReliefs.forEach(t=>t.dispose());shadowMaterial.dispose();shadowTexture.dispose();}};
}
