import R from '@dimforge/rapier3d-compat';
import { BUILDINGS, STREET_PROPS, type Point } from './logic';

let ready:Promise<void>|undefined;
export function prepareCourierPhysics(){return ready??=R.init();}
export function createPhysics(){
  const world=new R.World({x:0,y:0,z:0});world.timestep=1/60;
  const controller=world.createCharacterController(.025);controller.setSlideEnabled(true);
  const colliders=new Map<string,R.Collider>(),names=new Map<number,string>();
  BUILDINGS.forEach((b,i)=>{const c=world.createCollider(R.ColliderDesc.cuboid(b.w/2,b.h/2,b.d/2).setTranslation(b.x,b.h/2,b.z));names.set(c.handle,`building${i}`);});
  for(const p of STREET_PROPS)world.createCollider(R.ColliderDesc.cylinder(1,p.r).setTranslation(p.x,1,p.z));
  function add(id:string,p:Point,radius:number,car=false){
    const desc=car?R.ColliderDesc.cuboid(.95,.8,1.9):R.ColliderDesc.capsule(.45,radius);
    const collider=world.createCollider(desc.setTranslation(p.x,1,p.z));colliders.set(id,collider);names.set(collider.handle,id);return collider;
  }
  function sync(){world.step();}
  function position(id:string){const p=colliders.get(id)!.translation();return {x:p.x,z:p.z};}
  function move(id:string,dx:number,dz:number,yaw?:number,ignore?:string){
    const collider=colliders.get(id)!;
    if(yaw!==undefined)collider.setRotation({x:0,y:Math.sin(yaw/2),z:0,w:Math.cos(yaw/2)});
    controller.computeColliderMovement(collider,{x:dx,y:0,z:dz},undefined,undefined,ignore?(c)=>names.get(c.handle)!==ignore:undefined);
    const actual=controller.computedMovement(),p=collider.translation(),hits:string[]=[];
    for(let i=0;i<controller.numComputedCollisions();i++){
      const hit=controller.computedCollision(i);if(hit?.collider)hits.push(names.get(hit.collider.handle)??'building');
    }
    collider.setTranslation({x:p.x+actual.x,y:1,z:p.z+actual.z});sync();
    return {...position(id),hits};
  }
  function teleport(id:string,p:Point){colliders.get(id)!.setTranslation({x:p.x,y:1,z:p.z});sync();}
  function radius(id:string,r:number){colliders.get(id)!.setShape(new R.Capsule(.45,r));sync();}
  function enable(id:string,value:boolean){colliders.get(id)!.setEnabled(value);sync();}
  function dispose(){world.removeCharacterController(controller);world.free();colliders.clear();names.clear();}
  return {add,move,position,teleport,radius,enable,sync,dispose};
}
export type CourierPhysics=ReturnType<typeof createPhysics>;
