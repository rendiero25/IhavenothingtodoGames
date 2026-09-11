export interface Point { x: number; z: number }
export interface Building extends Point { w: number; d: number; h: number; color: number }
export interface Street extends Point { w: number; d: number }
/** Connected streets and alleys; the courier stays on these paved corridors. */
const ORIGINAL_STREETS: Street[] = [
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
const ORIGINAL_BUILDINGS: Building[] = [
  { x: -7, z: -7, w: 4, d: 3.5, h: 3.1, color: 0xd4a48e },
  { x: 1, z: -8, w: 3.5, d: 3, h: 3.8, color: 0xb1c0bd },
  { x: 8, z: -6, w: 3.7, d: 4, h: 2.8, color: 0xd5c392 },
  { x: -8, z: 3, w: 4, d: 3.4, h: 2.7, color: 0xb4bca0 },
  { x: 8, z: 4, w: 3.8, d: 3.2, h: 3.4, color: 0xcba69c },
  { x: 0, z: 9, w: 4, d: 3, h: 2.8, color: 0xd7c8ae },
  { x: -.1, z: -2.1, w: 3.1, d: 1.4, h: 3.6, color: 0xb9bda4 },
  { x: -.1, z: 5, w: 3.2, d: 1.3, h: 3.2, color: 0xd4b49b },
];
export const MAP_HALF_SIZE=68;
export const BUILDINGS: Building[] = ORIGINAL_BUILDINGS.map(b=>({...b,x:b.x*4,z:b.z*4,w:b.w*1.65,d:b.d*1.65,h:b.h*1.35}));
BUILDINGS.push(...[-56,56].flatMap(x=>[-36,-14,14,36].map((z,i)=>({x,z,w:6,d:6,h:4.1+i*.45,color:[0xd3c6b2,0xc6c8bf,0xc5b19b,0xbcc6c9][i]}))));
BUILDINGS.push(...[-32,-24,24,32].flatMap(x=>[-40,40].map(z=>({x,z,w:5.4,d:6,h:4.4,color:0xc7c0ad}))));
export const HOME_BUILDINGS=[7,0,2,3,4,1] as const;
export const RESIDENTS: Point[]=HOME_BUILDINGS.map(index=>{
  const b=BUILDINGS[index];return {x:b.x,z:b.z+b.d/2+.95};
});
export const STREETS: Street[]=[
  ...ORIGINAL_STREETS.map(s=>({x:s.x*4,z:s.z*4,w:s.w*4,d:s.d*4})),
  {x:-44,z:0,w:8,d:108},{x:44,z:0,w:8,d:108},
  {x:0,z:-52,w:96,d:8},{x:0,z:52,w:96,d:8},
];
const roads=[...STREETS];
for(const p of RESIDENTS){
  const parking={x:p.x,z:p.z+3.4};
  const nearest=roads.map(s=>({x:Math.max(s.x-s.w/2,Math.min(s.x+s.w/2,parking.x)),z:Math.max(s.z-s.d/2,Math.min(s.z+s.d/2,parking.z))})).sort((a,b)=>Math.hypot(a.x-parking.x,a.z-parking.z)-Math.hypot(b.x-parking.x,b.z-parking.z))[0];
  STREETS.push({x:p.x,z:p.z+1.7,w:3,d:6.4},{...parking,w:6,d:4},
    {x:(parking.x+nearest.x)/2,z:parking.z,w:Math.abs(parking.x-nearest.x)+4,d:4},
    {x:nearest.x,z:(parking.z+nearest.z)/2,w:4,d:Math.abs(parking.z-nearest.z)+4});
}
export const TREES=Array.from({length:34},(_,i)=>({x:(i%2?-1:1)*(62+i%3*1.5),z:-55+Math.floor(i/2)*6.6}));
export const LAMPS=[-39.4,39.4].flatMap(x=>[-38,-4,36].map(z=>({x,z})));
export const STREET_PROPS=[...BUILDINGS.flatMap(b=>[
  {x:b.x-1.05,z:b.z+b.d/2+.85,r:.09}, {x:b.x+1.05,z:b.z+b.d/2+.85,r:.09},
  {x:b.x+b.w*.36,z:b.z+b.d/2+.48,r:.42},
]),...TREES.map(p=>({...p,r:.2})),...LAMPS.map(p=>({...p,r:.1})),
...Array.from({length:4},(_,i)=>({x:-34+i*.7,z:20,r:.5})),
... [20,24].flatMap(x=>[{x,z:38,r:.72},{x:x-.95,z:38,r:.3},{x:x+.95,z:38,r:.3}])];
export const DELIVERIES = [
  { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
  { from: 3, to: 4 }, { from: 4, to: 5 },
] as const;
export interface CourierState extends Point {
  delivery: number; carrying: boolean; dwell: number; completed: boolean; elapsed: number;
  visit: {resident:number;phase:'opening'|'waiting'|'leaving';time:number}|null;
  riding:boolean;speed:number;bike:Point;levelRemaining:number;crashTime:number;crashCooldown:number;crashes:number;
  weather:'clear'|'rain'|'wind'|'storm';day:'morning'|'noon'|'evening'|'night';
}
export function createState(): CourierState {
  const spawn={x:RESIDENTS[0].x-2,z:RESIDENTS[0].z+2};
  return { ...spawn, delivery: 0, carrying: false, dwell: 0, completed: false, elapsed: 0,visit:null,
    riding:true,speed:0,bike:{...spawn},levelRemaining:0,crashTime:0,crashCooldown:0,crashes:0,weather:'clear',day:'noon' };
}
export function canKnock(state:CourierState):boolean {
  if(state.completed||!state.carrying||state.riding||state.crashTime>0)return false;
  const resident=DELIVERIES[state.delivery].to,p=RESIDENTS[resident];
  return Math.hypot(state.x-p.x,state.z-p.z)<1.7 && (!state.visit||state.visit.resident!==resident||state.visit.phase==='leaving');
}
export function knock(state:CourierState):boolean {
  if(!canKnock(state))return false;
  state.visit={resident:DELIVERIES[state.delivery].to,phase:'opening',time:0};state.dwell=0;return true;
}
export function targetFor(state: CourierState): Point {
  const task = DELIVERIES[Math.min(state.delivery, DELIVERIES.length - 1)];
  return RESIDENTS[state.carrying ? task.to : task.from];
}
export function walkable(x: number, z: number,clearance=.4): boolean {
  return STREETS.some(s=>Math.abs(x-s.x)<=s.w/2 && Math.abs(z-s.z)<=s.d/2)
    && !BUILDINGS.some((b) => Math.abs(x-b.x)<b.w/2+clearance && Math.abs(z-b.z)<b.d/2+clearance)
    && !STREET_PROPS.some(p=>Math.hypot(x-p.x,z-p.z)<p.r+clearance);
}
export function paved(x:number,z:number){return STREETS.some(s=>Math.abs(x-s.x)<=s.w/2&&Math.abs(z-s.z)<=s.d/2);}
/** Camera-relative forward and sideways walking; yaw zero faces north (-Z). */
export function movementDirection(horizontal:number, vertical:number, yaw:number):Point {
  return {x:Math.cos(yaw)*horizontal+Math.sin(yaw)*vertical,z:-Math.sin(yaw)*horizontal+Math.cos(yaw)*vertical};
}
/** Small fixed-grid route search keeps tap-to-walk on streets, around houses. */
export function routeTo(start:Point,goal:Point,clearance=.4,obstacles:Array<Point&{r:number}>=[]):Point[] {
  const openAt=(x:number,z:number)=>walkable(x,z,clearance)&&!obstacles.some(p=>Math.hypot(p.x-x,p.z-z)<p.r+clearance);
  const nearest=(p:Point):Point|null=>{
    let best:Point|null=null,distance=Infinity;
    for(let x=Math.round(p.x*2)-3;x<=Math.round(p.x*2)+3;x++)for(let z=Math.round(p.z*2)-3;z<=Math.round(p.z*2)+3;z++){
      const d=Math.hypot(x/2-p.x,z/2-p.z);
      if(openAt(x/2,z/2)&&d<distance){best={x:x/2,z:z/2};distance=d;}
    }
    return best;
  };
  const a=nearest(start),b=nearest(goal);if(!a||!b)return [];
  const key=(p:Point)=>`${p.x},${p.z}`;
  const parents=new Map<string,Point|null>([[key(a),null]]),costs=new Map<string,number>([[key(a),0]]);
  const open:Array<{p:Point;cost:number;priority:number}>=[];
  const push=(p:Point,cost:number)=>{
    const item={p,cost,priority:cost+Math.abs(p.x-b.x)+Math.abs(p.z-b.z)};open.push(item);let i=open.length-1;
    while(i>0){const parent=(i-1)>>1;if(open[parent].priority<=item.priority)break;open[i]=open[parent];i=parent;}open[i]=item;
  };
  const pop=()=>{
    const first=open[0],last=open.pop()!;if(open.length){let i=0;while(i*2+1<open.length){let child=i*2+1;if(child+1<open.length&&open[child+1].priority<open[child].priority)child++;if(open[child].priority>=last.priority)break;open[i]=open[child];i=child;}open[i]=last;}return first;
  };
  push(a,0);
  while(open.length){
    const {p,cost}=pop();if(cost!==costs.get(key(p)))continue;
    if(key(p)===key(b)){
      const path:Point[]=[];let cursor:Point|null=p;
      while(cursor){path.push(cursor);cursor=parents.get(key(cursor))??null;}return path.reverse();
    }
    for(const [dx,dz] of [[.5,0],[-.5,0],[0,.5],[0,-.5]]){
      const next={x:p.x+dx,z:p.z+dz};
      if(cost+.5<(costs.get(key(next))??Infinity)&&openAt(next.x,next.z)){parents.set(key(next),p);costs.set(key(next),cost+.5);push(next,cost+.5);}
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
  if(state.visit){
    state.visit.time+=dt;
    if(state.visit.phase==='opening'&&state.visit.time>=1.5){state.visit.phase='waiting';state.visit.time=0;state.dwell=0;return null;}
    else if(state.visit.phase==='leaving'&&state.visit.time>=2.5)state.visit=null;
  }
  const target = targetFor(state);
  const radius=!state.carrying&&state.riding?3.6:1.7;
  if (Math.hypot(state.x-target.x, state.z-target.z) > radius || Math.abs(state.speed)>.5 || state.crashTime>0) { state.dwell=0; return null; }
  if(state.carrying && (state.visit?.resident!==DELIVERIES[state.delivery].to||state.visit.phase!=='waiting')){state.dwell=0;return null;}
  state.dwell += dt;
  if (state.dwell < .65) return null;
  state.dwell = 0;
  if (!state.carrying) { state.carrying=true;state.levelRemaining=levelBudgets()[state.delivery];state.weather=(['clear','clear','rain','wind','storm'] as const)[state.delivery]; return 'pickup'; }
  if(state.visit){state.visit.phase='leaving';state.visit.time=0;}
  state.carrying=false; state.delivery++;
  state.completed=state.delivery===DELIVERIES.length;
  return 'delivered';
}

let budgets:number[]|undefined;
export function deliveryDistances(){return DELIVERIES.map(t=>{const path=routeTo(RESIDENTS[t.from],RESIDENTS[t.to]);return path.reduce((n,p,i)=>n+(i?Math.hypot(p.x-path[i-1].x,p.z-path[i-1].z):0),0);});}
/** Budget actual street distance at a cautious 6 m/s, door time and obstacle allowance.
 * Work backwards so every later level has a strictly shorter, still feasible deadline. */
export function levelBudgets(){
  if(!budgets){budgets=deliveryDistances().map((distance,i)=>Math.ceil(distance/6+22-i));for(let i=3;i>=0;i--)budgets[i]=Math.max(budgets[i],budgets[i+1]+8);}
  return budgets;
}
export function tickChallenge(s:CourierState,dt:number){
  s.crashTime=Math.max(0,s.crashTime-dt);s.crashCooldown=Math.max(0,s.crashCooldown-dt);
  if(s.carrying&&!s.completed)s.levelRemaining=Math.max(0,s.levelRemaining-dt);
  return s.carrying&&s.levelRemaining<=0&&!s.completed;
}
export function crash(s:CourierState){
  if(s.crashCooldown>0||s.completed)return false;
  s.crashTime=1.3;s.crashCooldown=3;s.speed=0;s.crashes++;
  if(s.carrying)s.levelRemaining=Math.max(0,s.levelRemaining-3);return true;
}
