import * as T from 'three';
import type { GameEngine, GameOptions, EndReason } from '../types';
import { dictionaries, type DictKey } from '../../i18n/dict';
import { createState, DELIVERIES, move, movementDirection, routeTo, targetFor, tickDelivery, type Point } from './logic';
import { createVillage, type Village } from './scene';

export class CourierEngine implements GameEngine {
  private state=createState();
  private opts!:GameOptions;
  private canvas!:HTMLCanvasElement;
  private renderer?:T.WebGLRenderer;
  private village?:Village;
  private observer?:ResizeObserver;
  private root?:HTMLDivElement;
  private objective?:HTMLDivElement;
  private detail?:HTMLDivElement;
  private progress?:HTMLDivElement;
  private notice?:HTMLDivElement;
  private compass?:HTMLDivElement;
  private uiLocale='';
  private localized:Array<()=>void>=[];
  private keys=new Set<string>();
  private destination:Point|null=null;
  private route:Point[]=[];
  private yaw=Math.PI/2;
  private raf=0;
  private last=0;
  private running=false;
  private destroyed=false;
  private finished=false;
  private reduced=false;
  private aspect=1;
  private celebration=0;
  private feedbackUntil=0;
  private disposers:Array<()=>void>=[];
  private ray=new T.Raycaster();
  private plane=new T.Plane(new T.Vector3(0,1,0),0);
  private hit=new T.Vector3();
  private t(key:DictKey):string{return dictionaries[this.opts.locale][key];}
  init(canvas:HTMLCanvasElement,opts:GameOptions):void {
    this.canvas=canvas;this.opts=opts;
    try {
      this.renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'low-power'});
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
      this.renderer.outputColorSpace=T.SRGBColorSpace;
      this.village=createVillage();
      const query=window.matchMedia('(prefers-reduced-motion: reduce)');this.reduced=query.matches;
      this.listen(query,'change',()=>{this.reduced=query.matches;});
      this.buildUI();
      this.listen(window,'keydown',this.keydown);this.listen(window,'keyup',this.keyup);
      this.listen(window,'blur',this.clearInput);
      this.listen(canvas,'pointerdown',this.pointer);
      this.listen(canvas,'webglcontextlost',this.contextLost);
      this.observer=new ResizeObserver(this.resize);this.observer.observe(canvas);
      this.resize();this.refreshUI();this.render(0,false);
    } catch(error) {this.destroy();throw error;}
  }
  private listen(target:EventTarget,type:string,listener:EventListener):void {
    target.addEventListener(type,listener);this.disposers.push(()=>target.removeEventListener(type,listener));
  }
  private contextLost=(event:Event)=>{
    event.preventDefault();this.pause();this.opts.callbacks.onFatalError?.(new Error('WEBGL_CONTEXT_LOST'));
  };
  private resize=()=>{
    if(!this.renderer||this.destroyed)return;
    const rect=this.canvas.getBoundingClientRect();
    const w=Math.max(1,rect.width),h=Math.max(1,rect.height);this.aspect=w/h;
    this.renderer.setSize(w,h,false);this.render(this.state.elapsed,false);
  };
  private clearInput=()=>{this.keys.clear();this.destination=null;this.route=[];};
  private keydown=(event:Event)=>{
    const e=event as KeyboardEvent,key=e.key.toLowerCase();
    if(!this.running||e.ctrlKey||e.metaKey||e.altKey||!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(key))return;
    e.preventDefault();this.keys.add(key);this.destination=null;this.route=[];
  };
  private keyup=(event:Event)=>{this.keys.delete((event as KeyboardEvent).key.toLowerCase());};
  private pointer=(event:Event)=>{
    if(!this.running||!this.village)return;
    const e=event as PointerEvent,rect=this.canvas.getBoundingClientRect();
    this.ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),this.village.camera);
    if(this.ray.ray.intersectPlane(this.plane,this.hit)){
      this.route=routeTo(this.state,{x:this.hit.x,z:this.hit.z});this.destination=this.route.shift()??null;
    }
  };
  private buildUI():void {
    this.root=document.createElement('div');
    this.root.className='absolute inset-0 pointer-events-none text-[#363b36]';
    const hud=document.createElement('div');
    hud.className='absolute top-16 left-3 right-3 sm:left-5 sm:right-auto sm:max-w-xs rounded-xl bg-[#f6f0e3]/95 px-3 py-2';
    this.progress=document.createElement('div');this.progress.className='font-mono text-[10px] uppercase tracking-widest';
    this.objective=document.createElement('div');this.objective.className='text-sm font-semibold leading-snug mt-1';
    this.objective.setAttribute('role','status');this.objective.setAttribute('aria-live','polite');
    this.detail=document.createElement('div');this.detail.className='text-xs mt-1';
    hud.append(this.progress,this.objective,this.detail);this.root.append(hud);
    this.notice=document.createElement('div');
    this.notice.className='absolute bottom-44 inset-x-4 text-center text-xs rounded-lg bg-[#f6f0e3]/95 px-3 py-2';
    this.notice.setAttribute('role','status');this.notice.hidden=true;this.root.append(this.notice);
    const pad=document.createElement('div');pad.className='absolute bottom-3 left-3 grid grid-cols-3 gap-1 pointer-events-auto';
    const controls=[['↑','arrowup','courier.up',2],['←','arrowleft','courier.left',1],['↓','arrowdown','courier.down',2],['→','arrowright','courier.right',3]] as const;
    controls.forEach(([symbol,key,label,column],i)=>{
      const b=document.createElement('button');b.type='button';b.textContent=symbol;b.setAttribute('aria-label',this.t(label));
      this.localized.push(()=>b.setAttribute('aria-label',this.t(label)));
      b.className='w-12 h-12 rounded-xl border border-[#363b36]/30 bg-[#f6f0e3] text-xl focus-visible:outline-2 focus-visible:outline-offset-2 active:bg-[#d6c49c]';
      b.style.gridColumn=String(column);b.style.gridRow=i===0?'1':'2';b.style.touchAction='none';
      b.onpointerdown=e=>{if(this.running){b.setPointerCapture(e.pointerId);this.keys.add(key);this.destination=null;this.route=[];}};
      const release=()=>{this.keys.delete(key);};
      b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;b.onblur=release;
      b.onkeydown=e=>{if((e.key===' '||e.key==='Enter')&&this.running){e.preventDefault();this.keys.add(key);this.destination=null;this.route=[];}};
      b.onkeyup=release;
      pad.append(b);
    });
    const hint=document.createElement('div');hint.className='absolute bottom-4 right-3 max-w-32 text-right text-[11px] bg-[#f6f0e3]/95 rounded-lg p-2';hint.textContent=this.t('courier.hint');
    this.localized.push(()=>{hint.textContent=this.t('courier.hint');});
    this.root.append(pad,hint);this.canvas.parentElement?.append(this.root);
    this.compass=document.createElement('div');
    this.compass.className='absolute right-3 bottom-24 rounded-full bg-[#f6f0e3] text-[#363b36] w-12 h-12 flex items-center justify-center text-2xl';
    this.compass.textContent='↑';this.compass.setAttribute('aria-hidden','true');this.root.append(this.compass);
  }
  private refreshUI():void {
    if(!this.objective||!this.progress||!this.detail)return;
    this.progress.textContent=`${this.t('courier.title')} · ${this.state.delivery}/5`;
    if(this.state.completed){this.objective.textContent=this.t('courier.complete');this.detail.textContent=this.t('courier.finishHint');return;}
    const task=DELIVERIES[this.state.delivery],resident=this.state.carrying?task.to:task.from;
    const action=this.t(this.state.carrying?'courier.deliver':'courier.pickup');
    this.objective.textContent=`${action} ${this.t(`courier.resident${resident}` as DictKey)}`;
    this.detail.textContent=this.t(`courier.parcel${this.state.delivery}` as DictKey);
  }
  start():void {
    if(this.running||this.destroyed||this.finished)return;
    this.running=true;this.last=performance.now();this.raf=requestAnimationFrame(this.frame);
  }
  pause():void {this.running=false;cancelAnimationFrame(this.raf);this.clearInput();}
  resume():void{this.start();}
  private frame=(now:number)=>{
    if(!this.running||this.destroyed)return;
    const dt=Math.min(.05,Math.max(0,(now-this.last)/1000));this.last=now;
    if(this.state.completed){this.celebration+=dt;if(this.celebration>=4){this.end('complete');return;}}
    else {
      const horizontal=Number(this.keys.has('d')||this.keys.has('arrowright'))-Number(this.keys.has('a')||this.keys.has('arrowleft'));
      const vertical=Number(this.keys.has('s')||this.keys.has('arrowdown'))-Number(this.keys.has('w')||this.keys.has('arrowup'));
      this.yaw-=horizontal*dt*1.9;
      let {x:dx,z:dz}=movementDirection(0,vertical,this.yaw);
      if(this.destination){
        dx=this.destination.x-this.state.x;dz=this.destination.z-this.state.z;const d=Math.hypot(dx,dz);
        if(d<.14){this.destination=this.route.shift()??null;dx=dz=0;}
        else {
          dx/=d;dz/=d;
          const desired=Math.atan2(-dx,-dz),delta=Math.atan2(Math.sin(desired-this.yaw),Math.cos(desired-this.yaw));
          this.yaw+=delta*Math.min(1,dt*8);
        }
      }
      const oldX=this.state.x,oldZ=this.state.z;
      move(this.state,dx,dz,dt);
      const moving=Math.hypot(this.state.x-oldX,this.state.z-oldZ)>.001;
      if(this.village)this.village.player.group.rotation.y=this.yaw+Math.PI;
      const event=tickDelivery(this.state,dt);
      if(event){
        this.destination=null;this.route=[];this.refreshUI();
        if(event==='delivered'){
          this.opts.callbacks.onScore(this.state.delivery*100,this.state.delivery);
          this.notice!.textContent=this.t(`courier.reaction${this.state.delivery-1}` as DictKey);
          this.notice!.hidden=false;this.feedbackUntil=this.state.elapsed+3;
        }
      }
      if(this.notice&&this.state.elapsed>this.feedbackUntil)this.notice.hidden=true;
      if(this.opts.roundMs&&this.state.elapsed*1000>=this.opts.roundMs){this.end('timeup');return;}
      this.render(this.state.elapsed,moving);
    }
    if(this.state.completed)this.render(this.state.elapsed+this.celebration,false);
    this.raf=requestAnimationFrame(this.frame);
  };
  private render(time:number,moving:boolean):void {
    if(!this.village||!this.renderer)return;
    if(this.uiLocale!==this.opts.locale){this.uiLocale=this.opts.locale;this.refreshUI();this.localized.forEach(update=>update());if(this.notice)this.notice.hidden=true;}
    if(this.compass){
      const p=targetFor(this.state),dx=p.x-this.state.x,dz=p.z-this.state.z;
      this.compass.style.transform=`rotate(${Math.atan2(dx*Math.cos(this.yaw)-dz*Math.sin(this.yaw),-dx*Math.sin(this.yaw)-dz*Math.cos(this.yaw))}rad)`;
      this.compass.hidden=this.state.completed;
    }
    this.village.update(this.state,time,moving,this.reduced,this.aspect,this.yaw);
    this.renderer.render(this.village.scene,this.village.camera);
  }
  private end(reason:EndReason):void {
    if(this.finished)return;this.finished=true;this.pause();
    this.opts.callbacks.onGameOver({score:this.state.delivery*100,bestCombo:this.state.delivery,levelReached:this.state.delivery+1,durationMs:Math.round(this.state.elapsed*1000),livesLeft:this.opts.startLives,endReason:reason,stats:{deliveries:this.state.delivery}});
  }
  destroy():void {
    if(this.destroyed)return;this.destroyed=true;this.pause();this.observer?.disconnect();
    this.disposers.forEach(dispose=>dispose());this.disposers=[];
    this.root?.remove();this.village?.dispose();this.renderer?.dispose();
    this.localized=[];
    this.village=undefined;this.renderer=undefined;
  }
}
