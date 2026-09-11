import { BUILDINGS, STREETS,MAP_HALF_SIZE, targetFor, type CourierState } from './logic';
import { dictionaries, type DictKey, type Locale } from '../../i18n/dict';
import type { Activity } from './simulation';

const NS='http://www.w3.org/2000/svg';
const scale=136/(MAP_HALF_SIZE*2),coordinate=(value:number)=>(value+MAP_HALF_SIZE)*scale;
/** Fixed north-up map; static streets are built once, only markers move. */
export function createMinimap(){
  const root=document.createElement('div');
  root.className='rounded-xl bg-[#f6f0e3]/95 p-2 text-[#363b36] pointer-events-auto';
  const label=document.createElement('div');label.className='truncate text-[10px] font-semibold';
  const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 136 136');svg.setAttribute('role','img');
  svg.style.width='100%';svg.style.display='block';
  const shape=(tag:string,attributes:Record<string,string|number>)=>{
    const node=document.createElementNS(NS,tag);
    Object.entries(attributes).forEach(([key,value])=>node.setAttribute(key,String(value)));svg.append(node);return node;
  };
  shape('rect',{width:136,height:136,rx:5,fill:'#c6cfbd'});
  for(const s of STREETS)shape('rect',{x:coordinate(s.x-s.w/2),y:coordinate(s.z-s.d/2),width:s.w*scale,height:s.d*scale,fill:'#f7f4e9'});
  for(const b of BUILDINGS)shape('rect',{x:coordinate(b.x-b.w/2),y:coordinate(b.z-b.d/2),width:b.w*scale,height:b.d*scale,rx:1,fill:'#879083'});
  const dogs=[0,1].map(()=>shape('circle',{r:2.5,fill:'#a63e2c',stroke:'#fffaf0','stroke-width':1}));
  const bike=shape('rect',{width:5,height:5,rx:1,fill:'#466a70',stroke:'#fffaf0','stroke-width':1});
  const direction=shape('line',{stroke:'#b36c2e','stroke-width':1.4,'stroke-dasharray':'2 3'});
  const target=shape('path',{d:'M 0 -5 L 5 0 L 0 5 L -5 0 Z',fill:'#b36c2e',stroke:'#fffaf0','stroke-width':1.5});
  const player=shape('path',{d:'M 0 -5 L 3.8 4 L 0 2 L -3.8 4 Z',fill:'#243e46',stroke:'#fffaf0','stroke-width':1.2});
  const north=shape('text',{x:7,y:11,fill:'#363b36','font-size':8,'font-family':'monospace'});
  const legend=document.createElement('div');legend.className='text-[9px] leading-snug';
  root.append(label,svg,legend);let previous='';
  function update(state:CourierState,yaw:number,locale:Locale,destination:string,activity?:Activity){
    const goal=targetFor(state),distance=Math.round(Math.hypot(goal.x-state.x,goal.z-state.z));
    const key=`${state.x.toFixed(1)}:${state.z.toFixed(1)}:${yaw.toFixed(2)}:${goal.x}:${goal.z}:${locale}:${destination}:${state.completed}:${state.riding}:${Math.floor(state.elapsed*5)}`;
    if(key===previous)return;previous=key;
    const t=(k:DictKey)=>dictionaries[locale][k];
    label.textContent=state.completed?t('courier.complete'):`${t('courier.destination')}: ${destination}`;
    legend.textContent=state.completed?t('courier.mapYou'):`${t('courier.mapYou')} · ◆ ${t('courier.destination')} · ${distance} m`;
    north.textContent=t('courier.north');
    svg.setAttribute('aria-label',`${t('courier.map')}. ${label.textContent}${state.completed?'':`. ${distance} m`}`);
    player.setAttribute('transform',`translate(${coordinate(state.x)} ${coordinate(state.z)}) rotate(${-yaw*180/Math.PI})`);
    target.setAttribute('transform',`translate(${coordinate(goal.x)} ${coordinate(goal.z)})`);
    target.setAttribute('visibility',state.completed?'hidden':'visible');direction.setAttribute('visibility',state.completed?'hidden':'visible');
    direction.setAttribute('x1',String(coordinate(state.x)));direction.setAttribute('y1',String(coordinate(state.z)));
    direction.setAttribute('x2',String(coordinate(goal.x)));direction.setAttribute('y2',String(coordinate(goal.z)));
    bike.setAttribute('x',String(coordinate(state.bike.x)-2.5));bike.setAttribute('y',String(coordinate(state.bike.z)-2.5));bike.setAttribute('visibility',state.riding?'hidden':'visible');
    dogs.forEach((marker,i)=>{const dog=activity?.dogs[i];marker.setAttribute('visibility',dog?'visible':'hidden');if(dog){marker.setAttribute('cx',String(coordinate(dog.state.x)));marker.setAttribute('cy',String(coordinate(dog.state.z)));}});
  }
  return {root,update};
}
