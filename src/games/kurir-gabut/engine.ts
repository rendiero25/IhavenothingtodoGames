import * as T from 'three';
import type { GameEngine, GameOptions, EndReason } from '../types';
import { dictionaries, type DictKey } from '../../i18n/dict';
import { canKnock, knock, createState, DELIVERIES, movementDirection, routeTo, targetFor, tickDelivery,tickChallenge, type Point } from './logic';
import { createVillage, type Village } from './scene';
import { createMinimap } from './minimap';
import { createSimulation } from './simulation';
export { prepareCourierPhysics } from './physics';

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
  private minimap?:ReturnType<typeof createMinimap>;
  private simulation?:ReturnType<typeof createSimulation>;
  private rideButton?:HTMLButtonElement;
  private telemetry?:HTMLDivElement;
  private telemetryKey='';
  private chased=false;
  private knockButton?:HTMLButtonElement;
  private interactionState='';
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
      this.renderer.toneMapping=T.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure=1;
      this.simulation=createSimulation(this.state);this.village=createVillage(this.simulation.activity);
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
    if(!this.running||e.ctrlKey||e.metaKey||e.altKey)return;
    if(['SELECT','INPUT','TEXTAREA'].includes((e.target as HTMLElement|null)?.tagName??''))return;
    if(key==='e'){e.preventDefault();if(!e.repeat)this.attemptKnock();return;}
    if(key==='b'){e.preventDefault();if(!e.repeat)this.toggleBike();return;}
    if(!['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','shift'].includes(key))return;
    e.preventDefault();this.keys.add(key);if(key!=='shift'){this.destination=null;this.route=[];}
  };
  private keyup=(event:Event)=>{this.keys.delete((event as KeyboardEvent).key.toLowerCase());};
  private attemptKnock=()=>{
    if(!this.running||!knock(this.state))return;
    this.clearInput();this.simulation?.makeRoom(targetFor(this.state));this.refreshUI();
  };
  private toggleBike=()=>{if(this.running&&this.simulation?.toggleBike(this.yaw)){this.clearInput();this.refreshUI();}};
  private pointer=(event:Event)=>{
    if(!this.running||!this.village)return;
    const e=event as PointerEvent,rect=this.canvas.getBoundingClientRect();
    this.ray.setFromCamera(new T.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1),this.village.camera);
    if(this.ray.ray.intersectPlane(this.plane,this.hit)){
      const target=targetFor(this.state);
      const goal=this.state.riding&&Math.hypot(this.hit.x-target.x,this.hit.z-target.z)<8?{x:target.x,z:target.z+3.4}:{x:this.hit.x,z:this.hit.z};
      const activity=this.simulation!.activity;
      const obstacles=[...activity.dogs.map(d=>({...d.state,r:.65})),...activity.pedestrians.map(p=>({...p.state,r:.45})),
        ...activity.traffic.map(c=>({...c.state,r:c.motorcycle?1:2.2})),...(this.state.riding?[]:[{...this.state.bike,r:.95}])];
      this.route=routeTo(this.state,goal,this.state.riding?1.2:.4,obstacles);this.destination=this.route.shift()??null;
    }
  };
  private buildUI():void {
    this.root=document.createElement('div');
    this.root.className='absolute inset-0 pointer-events-none text-[#363b36]';
    const hud=document.createElement('div');
    hud.className='absolute top-16 left-3 right-32 sm:left-5 sm:right-auto sm:max-w-xs rounded-xl bg-[#f6f0e3]/95 px-3 py-2';
    this.progress=document.createElement('div');this.progress.className='font-mono text-[10px] uppercase tracking-widest';
    this.objective=document.createElement('div');this.objective.className='text-sm font-semibold leading-snug mt-1';
    this.objective.setAttribute('role','status');this.objective.setAttribute('aria-live','polite');
    this.detail=document.createElement('div');this.detail.className='text-xs mt-1';
    this.telemetry=document.createElement('div');this.telemetry.className='mt-2 font-mono text-[11px] font-semibold';
    hud.append(this.progress,this.objective,this.detail,this.telemetry);this.root.append(hud);
    const timePicker=document.createElement('select');timePicker.className='absolute top-16 right-3 w-28 min-h-11 rounded-lg bg-[#f6f0e3] px-2 text-xs pointer-events-auto focus-visible:outline-2';
    timePicker.setAttribute('aria-label',this.t('courier.daytime'));
    const times=['morning','noon','evening','night'] as const;
    for(const time of times){const option=document.createElement('option');option.value=time;option.textContent=this.t(`courier.${time}`);timePicker.append(option);this.localized.push(()=>{option.textContent=this.t(`courier.${time}`);});}
    timePicker.value=this.state.day;timePicker.onchange=()=>{this.state.day=timePicker.value as typeof this.state.day;this.render(this.state.elapsed,false);};
    this.localized.push(()=>timePicker.setAttribute('aria-label',this.t('courier.daytime')));this.root.append(timePicker);
    this.notice=document.createElement('div');
    this.notice.className='mt-2 text-xs';
    this.notice.setAttribute('role','status');this.notice.hidden=true;hud.append(this.notice);
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
    for(const [key,label,column] of [['shift','courier.boost',1],[' ','courier.brake',3]] as const){
      const b=document.createElement('button');b.type='button';b.textContent=this.t(label);b.setAttribute('aria-label',this.t(label));
      b.className='w-12 h-12 rounded-xl border border-[#363b36]/30 bg-[#f6f0e3] text-[10px] font-semibold focus-visible:outline-2 active:bg-[#d6c49c]';b.style.gridColumn=String(column);b.style.gridRow='1';b.style.touchAction='none';
      this.localized.push(()=>{b.textContent=this.t(label);b.setAttribute('aria-label',this.t(label));});
      b.onpointerdown=e=>{if(this.running){b.setPointerCapture(e.pointerId);this.keys.add(key);if(key===' '){this.destination=null;this.route=[];}}};
      const release=()=>this.keys.delete(key);b.onpointerup=release;b.onpointercancel=release;b.onlostpointercapture=release;b.onblur=release;
      b.onkeydown=e=>{if(this.running&&(e.key===' '||e.key==='Enter')){e.preventDefault();this.keys.add(key);}};b.onkeyup=release;pad.append(b);
    }
    const hint=document.createElement('div');hint.className='absolute bottom-32 left-3 max-w-36 text-[11px] bg-[#f6f0e3]/95 rounded-lg p-2';hint.textContent=this.t('courier.hint');
    this.localized.push(()=>{hint.textContent=this.t('courier.hint');});
    this.root.append(pad,hint);this.canvas.parentElement?.append(this.root);
    const navigation=document.createElement('div');navigation.className='absolute right-3 bottom-3 flex flex-col gap-2';
    navigation.style.width='clamp(96px, calc(100% - 180px), 160px)';
    this.minimap=createMinimap();
    this.rideButton=document.createElement('button');this.rideButton.type='button';
    this.rideButton.className='min-h-11 px-2 rounded-xl bg-[#f6f0e3] text-xs font-semibold pointer-events-auto disabled:opacity-50 focus-visible:outline-2';
    this.rideButton.onclick=this.toggleBike;
    this.knockButton=document.createElement('button');this.knockButton.type='button';
    this.knockButton.className='min-h-12 px-2 rounded-xl bg-[#f6f0e3] text-sm font-semibold pointer-events-auto focus-visible:outline-2 focus-visible:outline-offset-2';
    this.knockButton.onclick=this.attemptKnock;navigation.append(this.knockButton,this.rideButton,this.minimap.root);this.root.append(navigation);
  }
  private refreshUI():void {
    if(!this.objective||!this.progress||!this.detail)return;
    this.progress.textContent=`${this.t('courier.level')} ${Math.min(5,this.state.delivery+1)}/5 · ${this.t(`courier.${this.state.weather}`)}`;
    if(this.state.completed){this.objective.textContent=this.t('courier.complete');this.detail.textContent=this.t('courier.finishHint');return;}
    const task=DELIVERIES[this.state.delivery],resident=this.state.carrying?task.to:task.from;
    const action=this.t(this.state.carrying?'courier.deliver':'courier.pickup');
    this.objective.textContent=`${action} ${this.t(`courier.resident${resident}` as DictKey)}`;
    const opening=this.state.visit?.resident===resident&&this.state.visit.phase==='opening';
    const near=Math.hypot(this.state.x-targetFor(this.state).x,this.state.z-targetFor(this.state).z)<4.5;
    this.detail.textContent=this.t(opening?'courier.knocking':this.state.riding&&this.state.carrying&&near?'courier.dismountHint':canKnock(this.state)?'courier.knockHint':`courier.parcel${this.state.delivery}` as DictKey);
  }
  start():void {
    if(this.running||this.destroyed||this.finished)return;
    this.running=true;this.last=performance.now();this.raf=requestAnimationFrame(this.frame);
  }
  pause():void {this.running=false;cancelAnimationFrame(this.raf);this.clearInput();}
  resume():void{this.start();}
  private frame=(now:number)=>{
    if(!this.running||this.destroyed)return;
    if(now-this.last<1000/40){this.raf=requestAnimationFrame(this.frame);return;}
    const dt=Math.min(.05,Math.max(0,(now-this.last)/1000));this.last=now;
    if(this.state.completed){this.celebration+=dt;if(this.state.visit){this.state.visit.time+=dt;if(this.state.visit.time>=2.5)this.state.visit=null;}this.simulation!.update(dt,{x:0,z:0},this.yaw,true,false,0);if(this.celebration>=4){this.end('complete');return;}}
    else {
      const horizontal=Number(this.keys.has('d')||this.keys.has('arrowright'))-Number(this.keys.has('a')||this.keys.has('arrowleft'));
      const vertical=Number(this.keys.has('s')||this.keys.has('arrowdown'))-Number(this.keys.has('w')||this.keys.has('arrowup'));
      this.yaw-=horizontal*dt*(this.state.riding?1.5/(1+this.state.speed*.035):1.9);
      let {x:dx,z:dz}=movementDirection(0,vertical,this.yaw);
      let distanceLimit=Infinity;
      if(this.destination){
        while(this.destination&&Math.hypot(this.destination.x-this.state.x,this.destination.z-this.state.z)<.2)this.destination=this.route.shift()??null;
        if(!this.destination){dx=dz=0;this.state.speed=0;distanceLimit=0;}
        else {
          dx=this.destination.x-this.state.x;dz=this.destination.z-this.state.z;distanceLimit=Math.hypot(dx,dz);
          const desired=Math.atan2(-dx,-dz),delta=Math.atan2(Math.sin(desired-this.yaw),Math.cos(desired-this.yaw));
          this.yaw+=delta*Math.min(1,dt*8);
        }
      }
      const oldX=this.state.x,oldZ=this.state.z;
      const activity=this.simulation!.update(dt,{x:dx,z:dz},this.yaw,this.keys.has(' '),this.keys.has('shift'),distanceLimit);
      if(activity.crashed){this.clearInput();this.notice!.textContent=this.t('courier.crash');this.notice!.hidden=false;this.feedbackUntil=this.state.elapsed+3;}
      else if(activity.chased&&!this.chased){this.notice!.textContent=this.t('courier.dogChase');this.notice!.hidden=false;this.feedbackUntil=this.state.elapsed+4;}
      this.chased=activity.chased;
      if(tickChallenge(this.state,dt)){this.end('timeup');return;}
      const moving=Math.hypot(this.state.x-oldX,this.state.z-oldZ)>.001;
      if(this.village)this.village.player.group.rotation.y=this.yaw+Math.PI;
      const event=tickDelivery(this.state,dt);
      if(event){
        this.destination=null;this.route=[];this.state.speed=0;this.refreshUI();
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
    const near=Math.hypot(this.state.x-targetFor(this.state).x,this.state.z-targetFor(this.state).z)<4.5;
    const interaction=`${near}:${this.state.riding}:${canKnock(this.state)}:${this.state.visit?.phase??''}:${this.state.delivery}:${this.state.carrying}:${this.opts.locale}`;
    if(this.interactionState!==interaction){
      this.interactionState=interaction;this.refreshUI();
      if(this.knockButton){this.knockButton.hidden=!canKnock(this.state);this.knockButton.textContent=this.t('courier.knock');}
      if(this.rideButton){this.rideButton.textContent=this.t(this.state.riding?'courier.dismount':'courier.mount');this.rideButton.hidden=this.state.completed;}
    }
    if(this.uiLocale!==this.opts.locale){this.uiLocale=this.opts.locale;this.refreshUI();this.localized.forEach(update=>update());if(this.notice)this.notice.hidden=true;}
    const task=DELIVERIES[Math.min(this.state.delivery,DELIVERIES.length-1)];
    this.minimap?.update(this.state,this.yaw,this.opts.locale,this.t(`courier.resident${this.state.carrying?task.to:task.from}` as DictKey),this.simulation!.activity);
    if(this.rideButton)this.rideButton.disabled=this.state.speed>.6||this.state.crashTime>0||!this.state.riding&&Math.hypot(this.state.x-this.state.bike.x,this.state.z-this.state.bike.z)>4.5;
    const seconds=Math.ceil(this.state.levelRemaining),speed=Math.round(this.state.speed*3.6),telemetryKey=`${seconds}:${speed}:${this.state.carrying}:${this.state.completed}:${this.opts.locale}`;
    if(this.telemetry&&telemetryKey!==this.telemetryKey){this.telemetryKey=telemetryKey;this.telemetry.textContent=this.state.completed?this.t('courier.complete'):`${this.state.carrying?`${seconds} s`:this.t('courier.ready')} · ${speed} km/h`;this.telemetry.style.color=this.state.carrying&&seconds<=10?'#a63e2c':'#363b36';}
    this.village.update(this.state,time,moving,this.reduced,this.aspect,this.yaw);
    this.renderer.render(this.village.scene,this.village.camera);
  }
  private end(reason:EndReason):void {
    if(this.finished)return;this.finished=true;this.pause();
    this.opts.callbacks.onGameOver({score:this.state.delivery*100,bestCombo:this.state.delivery,levelReached:Math.min(5,this.state.delivery+1),durationMs:Math.round(this.state.elapsed*1000),livesLeft:this.opts.startLives,endReason:reason,stats:{deliveries:this.state.delivery,crashes:this.state.crashes}});
  }
  destroy():void {
    if(this.destroyed)return;this.destroyed=true;this.pause();this.observer?.disconnect();
    this.disposers.forEach(dispose=>dispose());this.disposers=[];
    this.root?.remove();this.village?.dispose();this.renderer?.dispose();this.simulation?.dispose();this.simulation=undefined;
    this.localized=[];
    this.village=undefined;this.renderer=undefined;this.minimap=undefined;
  }
}
