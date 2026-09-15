import { afterEach,expect,it,vi } from 'vitest';
import { createMinimap } from './minimap';
import { createState,RESIDENTS,MAP_HALF_SIZE } from './logic';
import { createActivity } from './simulation';
class Element {
  style={};className='';textContent='';children:Element[]=[];attributes:Record<string,string>={};
  constructor(readonly tag:string){}
  setAttribute(k:string,v:string){this.attributes[k]=v;}
  append(...items:Element[]){this.children.push(...items);}
}
afterEach(()=>vi.unstubAllGlobals());
it('tracks heading, delivery changes, parked bike and dogs in a localized bounded map',()=>{
  vi.stubGlobal('document',{createElement:(tag:string)=>new Element(tag),createElementNS:(_ns:string,tag:string)=>new Element(tag)});
  const map=createMinimap(),state=createState(),activity=createActivity();
  const root=map.root as unknown as Element,svg=root.children[1];
  const paths=svg.children.filter(e=>e.tag==='path'),[goal,player]=paths;
  const line=svg.children.find(e=>e.tag==='line')!;
  const scale=136/176,coordinate=(value:number)=>(value+MAP_HALF_SIZE)*scale;
  map.update(state,Math.PI/2,'en','Mr Post',activity);
  expect(player.attributes.transform).toContain('rotate(-90)');
  expect(goal.attributes.transform).toBe(`translate(${coordinate(RESIDENTS[0].x)} ${coordinate(RESIDENTS[0].z)})`);
  expect(svg.attributes['aria-label']).toContain('Neighborhood map');
  state.carrying=true;map.update(state,0,'id','Rani',activity);
  expect(goal.attributes.transform).toBe(`translate(${coordinate(RESIDENTS[1].x)} ${coordinate(RESIDENTS[1].z)})`);
  expect(root.children[0].textContent).toBe('Tujuan: Rani');
  expect(svg.children.filter(e=>e.tag==='circle').every(e=>e.attributes.visibility==='visible')).toBe(true);
  state.riding=false;map.update(state,0,'id','Rani',activity);
  expect(svg.children.find(e=>e.tag==='rect'&&e.attributes.fill==='#466a70')!.attributes.visibility).toBe('visible');
  state.completed=true;state.delivery=5;map.update(state,0,'id','Rani',activity);
  expect(goal.attributes.visibility).toBe('hidden');expect(line.attributes.visibility).toBe('hidden');
  for(const node of svg.children.filter(e=>e.tag==='rect'&&e.attributes.x)){
    expect(Number(node.attributes.x)).toBeGreaterThanOrEqual(0);
    expect(Number(node.attributes.x)+Number(node.attributes.width)).toBeLessThanOrEqual(136);
  }
});
