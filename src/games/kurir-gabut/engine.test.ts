import { afterEach, expect, it, vi } from 'vitest';
import * as T from 'three';
import { CourierEngine } from './engine';
import { RESIDENTS } from './logic';

const gpu=vi.hoisted(()=>({camera:null as unknown,dispose:vi.fn(),renders:0}));
vi.mock('three',async(importOriginal)=>{
  const actual=await importOriginal<typeof import('three')>();
  return {...actual,WebGLRenderer:class {
    setPixelRatio(){} setSize(){} dispose(){gpu.dispose();}
    render(_scene:unknown,camera:unknown){gpu.camera=camera;gpu.renders++;}
  }};
});
afterEach(()=>{vi.unstubAllGlobals();vi.clearAllMocks();});
class Element extends EventTarget {
  style:Record<string,string>={};className='';textContent='';hidden=false;type='';
  children:Element[]=[];attributes:Record<string,string>={};
  remove=vi.fn();setAttribute(key:string,value:string){this.attributes[key]=value;}
  append(...children:Element[]){this.children.push(...children);}
}
function setup(){
  let frame:FrameRequestCallback|undefined,now=performance.now();
  vi.stubGlobal('requestAnimationFrame',(callback:FrameRequestCallback)=>{frame=callback;return 1;});
  vi.stubGlobal('cancelAnimationFrame',()=>{frame=undefined;});
  const win=Object.assign(new EventTarget(),{devicePixelRatio:1,matchMedia:()=>Object.assign(new EventTarget(),{matches:true})});
  vi.stubGlobal('window',win);vi.stubGlobal('document',{createElement:()=>new Element()});
  const disconnect=vi.fn();vi.stubGlobal('ResizeObserver',class{observe(){}disconnect(){disconnect();}});
  const parent=new Element();
  const canvas=Object.assign(new EventTarget(),{parentElement:parent,getBoundingClientRect:()=>({left:0,top:0,width:800,height:500})});
  const callbacks={onScore:vi.fn(),onLifeLost:vi.fn(),onGameOver:vi.fn(),onFatalError:vi.fn()};
  const engine=new CourierEngine();engine.init(canvas as unknown as HTMLCanvasElement,{seed:42,locale:'en',startLives:5,callbacks});
  const advance=(frames:number)=>{for(let i=0;i<frames;i++){now+=50;frame?.(now);}};
  const click=(index:number)=>{
    const point=RESIDENTS[index],camera=gpu.camera as T.Camera;
    let projected=new T.Vector3();
    // Turn normally until the street target is in front of the third-person camera.
    for(let i=0;i<150;i++){
      camera.updateMatrixWorld(true);projected.set(point.x,0,point.z).project(camera);
      if(projected.z>-1&&projected.z<1&&Math.abs(projected.x)<.95&&Math.abs(projected.y)<.95)break;
      win.dispatchEvent(Object.assign(new Event('keydown'),{key:'d',preventDefault(){}}));advance(1);
    }
    win.dispatchEvent(Object.assign(new Event('keyup'),{key:'d'}));
    expect(Math.abs(projected.x)).toBeLessThan(1);expect(projected.z).toBeLessThan(1);
    canvas.dispatchEvent(Object.assign(new Event('pointerdown'),{clientX:(projected.x+1)*400,clientY:(1-projected.y)*250}));
  };
  return {engine,callbacks,parent,advance,click,disconnect,canvas,win};
}
it('walks all five deliveries through the input and frame loop, finishes once, and cleans up',()=>{
  const test=setup();test.engine.start();
  test.click(0);test.advance(120);
  for(let i=1;i<=5;i++){test.click(i);test.advance(700);expect(test.callbacks.onScore).toHaveBeenLastCalledWith(i*100,i);}
  expect(test.callbacks.onScore).toHaveBeenLastCalledWith(500,5);
  expect(test.callbacks.onGameOver).toHaveBeenCalledOnce();
  expect(test.callbacks.onGameOver.mock.calls[0][0]).toMatchObject({endReason:'complete',score:500,stats:{deliveries:5}});
  test.engine.resume();test.advance(100);expect(test.callbacks.onGameOver).toHaveBeenCalledOnce();
  test.engine.destroy();test.engine.destroy();expect(gpu.dispose).toHaveBeenCalledOnce();
  expect(test.parent.children[0].remove).toHaveBeenCalledOnce();expect(test.disconnect).toHaveBeenCalledOnce();
},20000);
it('pauses frames and handles WebGL loss through the shell error callback',()=>{
  const test=setup();test.engine.start();test.advance(5);test.engine.pause();
  const renders=gpu.renders;test.advance(50);expect(gpu.renders).toBe(renders);
  test.engine.resume();test.advance(3);expect(gpu.renders).toBeGreaterThan(renders);
  test.canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));
  expect(test.callbacks.onFatalError).toHaveBeenCalledOnce();test.engine.destroy();
});
