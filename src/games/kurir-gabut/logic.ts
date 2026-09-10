export interface Point { x: number; z: number }
export interface Building extends Point { w: number; d: number; h: number; color: number }
export interface Street extends Point { w: number; d: number }
/** Connected streets and alleys; the courier stays on these paved corridors. */
export const STREETS: Street[] = [
  {x:0,z:.5,w:25,d:3.2},
  {x:0,z:-3.6,w:23,d:2.4},
  {x:0,z:6.5,w:23,d:2.4},
  {x:-3.5,z:0,w:2.6,d:24},
  {x:4,z:0,w:2.6,d:24},
  {x:-10.8,z:.5,w:1.8,d:17},
  {x:10.8,z:.5,w:1.8,d:17},
  {x:-1.5,z:3,w:5,d:2},
  {x:.25,z:-5.1,w:7.5,d:1.8},
];
export const BUILDINGS: Building[] = [
  { x: -7, z: -7, w: 4, d: 3.5, h: 3.1, color: 0xd4a48e },
  { x: 1, z: -8, w: 3.5, d: 3, h: 3.8, color: 0xb1c0bd },
  { x: 8, z: -6, w: 3.7, d: 4, h: 2.8, color: 0xd5c392 },
  { x: -8, z: 3, w: 4, d: 3.4, h: 2.7, color: 0xb4bca0 },
  { x: 8, z: 4, w: 3.8, d: 3.2, h: 3.4, color: 0xcba69c },
  { x: 0, z: 9, w: 4, d: 3, h: 2.8, color: 0xd7c8ae },
  { x: -.1, z: -2.1, w: 3.1, d: 1.4, h: 3.6, color: 0xb9bda4 },
  { x: -.1, z: 5, w: 3.2, d: 1.3, h: 3.2, color: 0xd4b49b },
];
export const RESIDENTS: Point[] = [
  { x: -2, z: 3 }, { x: -7, z: -3.8 }, { x: 8, z: -2.6 },
  { x: -8, z: 6 }, { x: 8, z: 7 }, { x: 0, z: -5.1 },
];
export const DELIVERIES = [
  { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
  { from: 3, to: 4 }, { from: 4, to: 5 },
] as const;
export interface CourierState extends Point {
  delivery: number; carrying: boolean; dwell: number; completed: boolean; elapsed: number;
}
export function createState(): CourierState {
  return { x: 0, z: 3, delivery: 0, carrying: false, dwell: 0, completed: false, elapsed: 0 };
}
export function targetFor(state: CourierState): Point {
  const task = DELIVERIES[Math.min(state.delivery, DELIVERIES.length - 1)];
  return RESIDENTS[state.carrying ? task.to : task.from];
}
export function walkable(x: number, z: number): boolean {
  return STREETS.some(s=>Math.abs(x-s.x)<=s.w/2 && Math.abs(z-s.z)<=s.d/2)
    && !BUILDINGS.some((b) => Math.abs(x-b.x)<b.w/2+.4 && Math.abs(z-b.z)<b.d/2+.4);
}
/** Camera-relative forward and sideways walking; yaw zero faces north (-Z). */
export function movementDirection(horizontal:number, vertical:number, yaw:number):Point {
  return {x:Math.cos(yaw)*horizontal+Math.sin(yaw)*vertical,z:-Math.sin(yaw)*horizontal+Math.cos(yaw)*vertical};
}
/** Small fixed-grid route search keeps tap-to-walk on streets, around houses. */
export function routeTo(start:Point,goal:Point):Point[] {
  const nearest=(p:Point):Point|null=>{
    let best:Point|null=null,distance=Infinity;
    for(let x=Math.round(p.x*2)-3;x<=Math.round(p.x*2)+3;x++)for(let z=Math.round(p.z*2)-3;z<=Math.round(p.z*2)+3;z++){
      const d=Math.hypot(x/2-p.x,z/2-p.z);
      if(walkable(x/2,z/2)&&d<distance){best={x:x/2,z:z/2};distance=d;}
    }
    return best;
  };
  const a=nearest(start),b=nearest(goal);if(!a||!b)return [];
  const key=(p:Point)=>`${p.x},${p.z}`;
  const queue=[a],parents=new Map<string,Point|null>([[key(a),null]]);
  for(let i=0;i<queue.length;i++){
    const p=queue[i];
    if(key(p)===key(b)){
      const path:Point[]=[];let cursor:Point|null=p;
      while(cursor){path.push(cursor);cursor=parents.get(key(cursor))??null;}return path.reverse();
    }
    for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){
      const next={x:p.x+dx,z:p.z+dz};
      if(!parents.has(key(next))&&walkable(next.x,next.z)){parents.set(key(next),p);queue.push(next);}
    }
  }
  return [];
}
export function move(state: CourierState, dx: number, dz: number, dt: number): void {
  if (state.completed) return;
  const length = Math.hypot(dx, dz);
  if (length < .001) return;
  const step = 4.2 * Math.min(.05, Math.max(0, dt)) / Math.max(1, length);
  const x = state.x + dx*step, z = state.z + dz*step;
  if (walkable(x, state.z)) state.x = x;
  if (walkable(state.x, z)) state.z = z;
}
export function tickDelivery(state: CourierState, dt: number): 'pickup' | 'delivered' | null {
  if (state.completed) return null;
  state.elapsed += dt;
  const target = targetFor(state);
  if (Math.hypot(state.x-target.x, state.z-target.z) > 1.35) { state.dwell=0; return null; }
  state.dwell += dt;
  if (state.dwell < .65) return null;
  state.dwell = 0;
  if (!state.carrying) { state.carrying=true; return 'pickup'; }
  state.carrying=false; state.delivery++;
  state.completed=state.delivery===DELIVERIES.length;
  return 'delivered';
}
