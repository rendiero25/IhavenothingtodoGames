import type { Point } from './logic';

export const TRAFFIC_LOOP:Point[]=[{x:-42,z:-50},{x:42,z:-50},{x:42,z:50},{x:-42,z:50}];
export const INNER_TRAFFIC:Point[]=[{x:-42,z:2},{x:42,z:2},{x:42,z:26},{x:-42,z:26}];
export const WALK_LOOPS:Point[][]=[
  [{x:-39,z:-44},{x:-39,z:44},{x:39,z:44},{x:39,z:-44}],
  [{x:-12,z:-14.4},{x:16,z:-14.4},{x:16,z:2},{x:-12,z:2}],
  [{x:38,z:-15},{x:47,z:-15},{x:47,z:-13},{x:38,z:-13}],
];
export interface Traveler extends Point {segment:number;progress:number;yaw:number;speed:number;stopped:boolean}
export function createTraveler(path:Point[],segment:number,speed:number):Traveler{
  return {...path[segment],segment,progress:0,yaw:0,speed,stopped:false};
}
export function advanceTraveler(t:Traveler,path:Point[],dt:number,blockers:Point[]=[],radius=0):void {
  const a=path[t.segment],b=path[(t.segment+1)%path.length],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
  t.yaw=Math.atan2(dx,dz);
  t.stopped=blockers.some(p=>{const px=p.x-t.x,pz=p.z-t.z,forward=(px*dx+pz*dz)/length,side=Math.abs(px*dz-pz*dx)/length;return forward>-.4&&forward<radius+2.8&&side<radius;});
  if(t.stopped)return;
  t.progress+=Math.min(.05,Math.max(0,dt))*t.speed;
  if(t.progress>=length){t.progress-=length;t.segment=(t.segment+1)%path.length;}
  const start=path[t.segment],end=path[(t.segment+1)%path.length],fraction=t.progress/Math.hypot(end.x-start.x,end.z-start.z);
  t.x=start.x+(end.x-start.x)*fraction;t.z=start.z+(end.z-start.z)*fraction;t.yaw=Math.atan2(end.x-start.x,end.z-start.z);
}
