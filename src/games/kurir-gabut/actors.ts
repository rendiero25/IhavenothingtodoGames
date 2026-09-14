import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

interface ActorAssets {
  geometry:<G extends T.BufferGeometry>(g:G)=>G;
  box:T.BufferGeometry; round:T.BufferGeometry; sphere:T.BufferGeometry; cylinder:T.BufferGeometry;
  mesh:(parent:T.Object3D,g:T.BufferGeometry,color:number,x:number,y:number,z:number,sx:number,sy:number,sz:number,metal?:number)=>T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>;
  shadow:(parent:T.Object3D,x:number,z:number,w:number,d:number)=>void;
}
type Ring=readonly [y:number,width:number,depth:number,offset?:number];

/** Metre-scale human rigs and a commuter motorcycle. All meshes are generated once. */
export function createActors(a:ActorAssets){
  const {geometry,mesh,box,round}=a;
  const sphere=geometry(new T.SphereGeometry(1,8,6));
  const cylinder=geometry(new T.CylinderGeometry(1,1,1,8));
  const actorMaterials=[0,.35,.65].map(metalness=>new T.MeshStandardMaterial({vertexColors:true,metalness,roughness:metalness===0?.82:metalness===.35?.36:.27}));
  const up=new T.Vector3(0,1,0),axis=new T.Vector3();
  function rod(parent:T.Object3D,color:number,from:readonly number[],to:readonly number[],r:number,metal=0){
    axis.set(to[0]-from[0],to[1]-from[1],to[2]-from[2]);
    const m=mesh(parent,cylinder,color,(from[0]+to[0])/2,(from[1]+to[1])/2,(from[2]+to[2])/2,r,axis.length(),r,metal);
    m.quaternion.setFromUnitVectors(up,axis.normalize());return m;
  }
  function profile(rings:Ring[],segments=12){
    const positions:number[]=[],uv:number[]=[],indices:number[]=[];
    for(let j=0;j<rings.length;j++)for(let i=0;i<=segments;i++){
      const [y,w,d,z=0]=rings[j],angle=i/segments*Math.PI*2;
      positions.push(Math.sin(angle)*w,y,Math.cos(angle)*d+z);uv.push(i/segments,j/(rings.length-1));
      if(j&&i){const v=j*(segments+1)+i;indices.push(v,v-1,v-segments-1,v-1,v-segments-2,v-segments-1);}
    }
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
    g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return geometry(g);
  }
  // Each articulated section uses one coloured mesh instead of a draw call per detail.
  function bake(root:T.Group){
    root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert();
    const buckets=new Map<number,T.BufferGeometry[]>();
    for(const child of root.children){
      if(!(child instanceof T.Mesh))continue;
      const mat=child.material as T.MeshStandardMaterial;
      const g=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();
      g.applyMatrix4(inverse.clone().multiply(child.matrixWorld));
      const colors=new Float32Array(g.attributes.position.count*3);
      for(let i=0;i<colors.length;i+=3){colors[i]=mat.color.r;colors[i+1]=mat.color.g;colors[i+2]=mat.color.b;}
      g.setAttribute('color',new T.BufferAttribute(colors,3));
      const bucket=mat.metalness>.5?2:mat.metalness>0?1:0;
      if(!buckets.has(bucket))buckets.set(bucket,[]);buckets.get(bucket)!.push(g);
    }
    root.children.filter(c=>c instanceof T.Mesh).forEach(c=>root.remove(c));
    for(const [bucket,parts] of buckets){const combined=mergeGeometries(parts);parts.forEach(p=>p.dispose());if(combined)root.add(new T.Mesh(geometry(combined),actorMaterials[bucket]));}
  }
  const torso=profile([[0,.14,.095],[.09,.152,.104],[.25,.182,.123],[.4,.223,.124],[.46,.221,.108],[.51,.11,.074]]);
  const headShape=profile([[0,.058,.059],[.035,.088,.082,.01],[.09,.105,.098],[.17,.112,.102,-.008],[.235,.089,.081,-.012],[.26,.025,.025,-.01]],16);
  const thigh=profile([[-.42,.061,.062],[-.36,.069,.073],[-.15,.091,.096],[0,.1,.098]],10);
  const shin=profile([[-.43,.039,.045],[-.34,.045,.051],[-.18,.063,.069],[0,.061,.062]],10);
  const upperArm=profile([[-.3,.045,.05],[-.2,.057,.057],[-.06,.063,.064],[0,.05,.05]],10);
  const sleeve=profile([[-.2,.061,.063],[-.08,.07,.072],[0,.058,.06]],10);
  const forearm=profile([[-.28,.03,.036],[-.22,.037,.041],[-.08,.047,.048],[0,.043,.047]],10);
  const hairCap=geometry(new T.SphereGeometry(1,8,5,0,Math.PI*2,0,Math.PI*.57));
  const helmetShell=geometry(new T.SphereGeometry(1,16,8,0,Math.PI*2,0,Math.PI*.67));
  const visor=geometry(new T.SphereGeometry(1,12,5,-.83,1.66,Math.PI*.38,Math.PI*.22));
  function person(color:number,skin=0xbc8d6a,courier=false,groundShadow=true,variant=0,helmet=courier){
    const group=new T.Group();group.name=courier?'courier':'pedestrian';
    const body=new T.Group();body.name='torso';body.position.y=.92;group.add(body);
    const trousers=variant%3===0?0x354652:variant%3===1?0x615b50:0x303a40;
    mesh(body,torso,color,0,0,0,1,1,1);
    mesh(body,sphere,trousers,0,.005,-.006,.17,.10,.108);
    mesh(body,cylinder,skin,0,.55,-.004,.056,.14,.054);
    mesh(body,headShape,skin,0,.58,.014,1,1,1);
    mesh(body,hairCap,variant%2?0x372b25:0x262323,0,.745,0,.116,.108,.106);
    for(const side of [-1,1]){
      mesh(body,sphere,skin,side*.113,.69,.005,.024,.041,.018);
      mesh(body,sphere,0xdfd6c6,side*.043,.724,.106,.024,.012,.008);
      mesh(body,sphere,0x302823,side*.043,.724,.114,.010,.010,.004);
      rod(body,0x332b26,[side*.021,.747,.109],[side*.065,.745,.105],.006);
      const collar=mesh(body,box,0xd1c9b6,side*.071,.49,.075,.067,.12,.018);collar.rotation.z=side*.45;
    }
    mesh(body,sphere,skin,0,.694,.11,.018,.033,.034);
    mesh(body,sphere,0x8d5546,0,.637,.099,.032,.005,.006);
    mesh(body,box,0x77766d,0,.265,.125,.016,.34,.008);
    for(const y of [.16,.28,.4])mesh(body,sphere,0xd2cbbb,0,y,.134,.008,.008,.006);
    mesh(body,box,color,-.11,.31,.13,.087,.09,.016);
    rod(body,0x7f8179,[-.151,.07,.101],[.15,.07,.101],.011);
    if(helmet){
      mesh(body,helmetShell,courier?0x314a50:0xd7d7cd,0,.765,.005,.143,.151,.143,.35);
      mesh(body,visor,0x526e7b,0,.765,.011,.146,.15,.147,.35);
      for(const side of [-1,1])rod(body,0x272f31,[side*.117,.697,.02],[side*.042,.597,.018],.012);
    }
    if(courier)for(const side of [-1,1]){
      rod(body,0x535d55,[side*.115,.49,-.11],[side*.135,.08,-.11],.024);
      rod(body,0x535d55,[side*.105,.48,.091],[side*.127,.07,.107],.022);
    }
    const legs:T.Group[]=[],knees:T.Group[]=[],arms:T.Group[]=[],elbows:T.Group[]=[],hands:T.Group[]=[],feet:T.Group[]=[];
    for(const side of [-1,1]){
      const leg=new T.Group();leg.name=side<0?'left-hip':'right-hip';leg.position.set(side*.095,.92,0);group.add(leg);legs.push(leg);
      mesh(leg,thigh,trousers,0,0,0,1,1,1);
      const knee=new T.Group();knee.name='knee';knee.position.y=-.42;leg.add(knee);knees.push(knee);
      mesh(knee,sphere,trousers,0,0,0,.061,.066,.062);mesh(knee,shin,trousers,0,0,0,1,1,1);
      const foot=new T.Group();foot.name='foot';foot.position.set(0,-.43,.035);knee.add(foot);feet.push(foot);
      mesh(foot,round,0x282e31,0,-.017,.048,.145,.10,.265);
      mesh(foot,round,0x898b83,0,-.053,.048,.152,.025,.276);
      mesh(foot,box,0xb9b8a8,0,.024,.055,.07,.01,.08);
      const arm=new T.Group();arm.name=side<0?'left-shoulder':'right-shoulder';arm.position.set(side*.223,1.355,0);group.add(arm);arms.push(arm);
      mesh(arm,upperArm,skin,0,0,0,1,1,1);mesh(arm,sleeve,color,0,0,0,1,1,1);
      const elbow=new T.Group();elbow.name='elbow';elbow.position.y=-.3;arm.add(elbow);elbows.push(elbow);
      mesh(elbow,sphere,skin,0,0,0,.045,.047,.049);mesh(elbow,forearm,skin,0,0,0,1,1,1);
      const hand=new T.Group();hand.name='hand';hand.position.y=-.28;elbow.add(hand);hands.push(hand);
      mesh(hand,sphere,skin,0,-.045,.012,.039,.067,.028);
      mesh(hand,sphere,skin,side*.035,-.025,.022,.017,.035,.021);
      for(let finger=0;finger<3;finger++)rod(hand,skin,[(finger-1)*.017,-.07,.008],[(finger-1)*.017,-.108,.03],.009);
      [foot,knee,leg,hand,elbow,arm].forEach(bake);
    }
    bake(body);if(groundShadow)a.shadow(group,0,0,1,.8);
    const down=new T.Vector3(0,-1,0),direction=new T.Vector3(),bend=new T.Vector3(),jointPoint=new T.Vector3(),endDirection=new T.Vector3(),inverse=new T.Quaternion();
    function poseLimb(root:T.Group,joint:T.Group,target:T.Vector3,bendToward:T.Vector3,upper:number,lower:number){
      direction.copy(target).sub(root.position);const distance=Math.min(upper+lower-.001,direction.length());direction.normalize();
      const along=(upper*upper-lower*lower+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,upper*upper-along*along));
      bend.copy(bendToward).addScaledVector(direction,-bendToward.dot(direction)).normalize();
      jointPoint.copy(root.position).addScaledVector(direction,along).addScaledVector(bend,height);
      endDirection.copy(jointPoint).sub(root.position).normalize();root.quaternion.setFromUnitVectors(down,endDirection);
      inverse.copy(root.quaternion).invert();endDirection.copy(target).sub(jointPoint).applyQuaternion(inverse).normalize();joint.quaternion.setFromUnitVectors(down,endDirection);
    }
    const target=new T.Vector3(),bendToward=new T.Vector3();
    function ride(steer=0){
      body.position.set(0,.89,-.18);body.rotation.x=.30;
      for(let i=0;i<2;i++){
        const side=i===0?-1:1,hip=legs[i],knee=knees[i];
        hip.position.set(side*.13,.88,-.18);
        target.set(side*.30,.46,-.16);bendToward.set(side*.2,0,1);poseLimb(hip,knee,target,bendToward,.42,.43);
        feet[i].quaternion.copy(hip.quaternion).multiply(knee.quaternion).invert();
        const shoulder=arms[i];shoulder.position.set(side*.225,1.31,-.052);
        const gripX=side*.315*Math.cos(steer)-.12*Math.sin(steer),gripZ=.52-side*.315*Math.sin(steer)-.12*Math.cos(steer);
        target.set(gripX,1.08,gripZ-.012);bendToward.set(side*.25,-1,0);poseLimb(shoulder,elbows[i],target,bendToward,.30,.28);hands[i].rotation.set(0,0,0);
      }
    }
    function animate(time:number,moving:boolean,reduced:boolean){
      const cycle=time*7,stride=moving&&!reduced?.48:0;
      body.position.set(0,.92+(moving&&!reduced?Math.abs(Math.sin(cycle))*.022:0),0);body.rotation.set(0,0,0);
      for(let i=0;i<2;i++){
        const side=i===0?-1:1,phase=cycle+i*Math.PI;
        legs[i].position.set(side*.095,.92,0);legs[i].rotation.set(Math.sin(phase)*stride,0,0);
        knees[i].rotation.set(Math.max(0,Math.cos(phase))*stride*.85,0,0);feet[i].rotation.x=0;
        arms[i].position.set(side*.223,1.355,0);arms[i].rotation.set(-Math.sin(phase)*stride*.7,0,side*.06);
        elbows[i].rotation.set(-.10-Math.max(0,Math.sin(phase))*stride*.3,0,0);hands[i].rotation.x=0;
      }
    }
    return {group,body,legs,knees,arms,elbows,hands,feet,animate,ride};
  }

  const tire=geometry(new T.TorusGeometry(.265,.07,6,24));
  const rim=geometry(new T.TorusGeometry(.232,.018,5,24));
  const fender=geometry(new T.TorusGeometry(.365,.052,5,18,Math.PI*.82));
  const coil=geometry(new T.TorusGeometry(.043,.008,4,8));
  function wheel(){
    const group=new T.Group();group.name='wheel';
    mesh(group,tire,0x25292c,0,0,0,1,1,1).rotation.y=Math.PI/2;
    mesh(group,rim,0xa5abad,0,0,0,1,1,1,.65).rotation.y=Math.PI/2;
    mesh(group,cylinder,0x727d82,0,0,0,.055,.19,.055,.65).rotation.z=Math.PI/2;
    mesh(group,cylinder,0x9ca4a5,.075,0,0,.145,.016,.145,.65).rotation.z=Math.PI/2;
    for(let i=0;i<6;i++){
      const angle=i/6*Math.PI*2;
      rod(group,0x9ca4a5,[0,Math.cos(angle)*.05,Math.sin(angle)*.05],[0,Math.cos(angle+.14)*.223,Math.sin(angle+.14)*.223],.014,.65);
    }
    bake(group);return group;
  }
  function vehicle(motorcycle:boolean,color:number,withRider=true){
    const sphere=a.sphere;
    const group=new T.Group();group.name=motorcycle?'commuter-motorcycle':'car';
    const chassis=new T.Group();chassis.name='chassis';group.add(chassis);
    const steering=new T.Group();steering.name='steering';group.add(steering);
    const wheels:T.Group[]=[];
    if(motorcycle){
      for(const side of [-1,1]){
        rod(chassis,0x323a3d,[side*.12,.8,.36],[side*.15,.46,-.26],.028,.65);
        rod(chassis,0x323a3d,[side*.15,.46,-.26],[side*.13,.76,-.59],.028,.65);
        rod(chassis,0x323a3d,[side*.13,.76,-.59],[side*.12,.8,.36],.026,.65);
        rod(chassis,0x586166,[side*.14,.49,-.04],[side*.14,.34,-.71],.037,.65);
        rod(chassis,0x9ba4a5,[side*.18,.36,-.71],[side*.18,.74,-.44],.026,.65);
        for(let j=0;j<5;j++)mesh(chassis,coil,0x444d51,side*.18,.44+j*.048,-.65+j*.033,1,1,1,.65).rotation.x=.63;
        mesh(chassis,round,color,side*.159,.67,-.32,.1,.19,.50,.35).rotation.x=-.18;
        rod(chassis,0x363c3e,[side*.17,.4,-.12],[side*.33,.4,-.12],.033);
        mesh(chassis,sphere,0xd7963e,side*.245,.76,-.83,.065,.038,.032);
      }
      mesh(chassis,sphere,color,0,.80,.14,.224,.157,.315,.35);
      mesh(chassis,cylinder,0x9ba4a5,0,.957,.16,.042,.012,.042,.65);
      mesh(chassis,round,0x242c30,0,.805,-.38,.38,.10,.68);
      mesh(chassis,round,0x485153,0,.779,-.4,.40,.025,.71);
      mesh(chassis,round,color,0,.755,-.77,.30,.085,.28,.35);
      mesh(chassis,cylinder,0x929a9d,0,.49,.02,.137,.30,.137,.65).rotation.z=Math.PI/2;
      mesh(chassis,round,0x69767b,0,.6,.13,.24,.22,.23,.65).rotation.x=.18;
      for(let j=0;j<5;j++)mesh(chassis,box,0xa2a9aa,0,.51+j*.035,.13,.275,.013,.235,.65);
      rod(chassis,0x776d5d,[.12,.55,.25],[.18,.29,.20],.028,.65);
      rod(chassis,0x776d5d,[.18,.29,.20],[.27,.29,-.36],.028,.65);
      rod(chassis,0x959d9f,[.27,.32,-.23],[.27,.39,-.79],.065,.65);
      rod(chassis,0x333b3d,[.27,.39,-.78],[.27,.4,-.84],.047);
      mesh(chassis,round,0x96392e,0,.75,-.926,.235,.07,.027);
      mesh(chassis,round,0x293235,0,.56,-.93,.23,.19,.024).rotation.x=-.22;
      for(let j=0;j<4;j++)mesh(chassis,box,0xd9ddda,-.068+j*.044,.56,-.947,.023,.045,.005);
      const rear=wheel();rear.position.set(0,.34,-.71);chassis.add(rear);wheels.push(rear);
      mesh(chassis,fender,color,0,.34,-.71,1,1,1,.35).rotation.set(0,Math.PI/2,.27);
      steering.position.set(0,0,.52);
      for(const side of [-1,1]){
        rod(steering,0x959ea2,[side*.1,.34,.19],[side*.1,.94,-.04],.024,.65);
        rod(steering,0x38464b,[side*.1,.34,.19],[side*.1,.60,.092],.034,.65);
        rod(steering,0x8c989d,[0,1.0,-.025],[side*.32,1.085,-.12],.017,.65);
        rod(steering,0x2c3437,[side*.265,1.085,-.12],[side*.365,1.085,-.12],.025);
        rod(steering,0x9ba4a5,[side*.295,1.09,-.095],[side*.36,1.30,-.122],.011,.65);
        mesh(steering,round,0x344249,side*.37,1.32,-.122,.15,.09,.038);
        mesh(steering,round,0x9fbdc9,side*.37,1.32,-.144,.122,.064,.01,.65);
        mesh(steering,sphere,0xd7963e,side*.20,.87,.24,.055,.035,.037);
      }
      mesh(steering,cylinder,0x3b484e,0,.93,.24,.12,.14,.12,.35).rotation.x=Math.PI/2;
      mesh(steering,cylinder,0xe2dfc2,0,.93,.317,.105,.015,.105,.35).rotation.x=Math.PI/2;
      mesh(steering,round,0x29373c,0,1.075,.03,.21,.085,.15).rotation.x=-.2;
      mesh(steering,round,0x9bacad,0,1.117,.032,.151,.014,.096);
      const front=wheel();front.position.set(0,.34,.19);steering.add(front);wheels.push(front);
      mesh(steering,fender,color,0,.34,.19,1,1,1,.35).rotation.set(0,Math.PI/2,.27);
      if(withRider){const rider=person(0x51585f,0xbc8d6a,false,false,1,true);rider.ride();group.add(rider.group);}
    }else{
      mesh(chassis,round,color,0,.61,0,1.8,.52,3.7,.35);
      mesh(chassis,round,color,0,1.03,-.15,1.6,.70,2.15,.35);
      mesh(chassis,round,0x3e5968,0,1.12,-.15,1.64,.42,1.87,.35);
      mesh(chassis,round,color,0,1.40,-.15,1.5,.10,1.9,.35);
      for(const side of [-1,1]){
        mesh(chassis,round,0xe1d9bb,side*.62,.72,1.86,.42,.15,.06);
        mesh(chassis,round,0x9f5142,side*.63,.70,-1.86,.4,.13,.06);
        mesh(chassis,round,color,side*.86,1.08,.48,.28,.12,.18,.35);
        mesh(chassis,round,color,side*.82,1.1,-.1,.08,.5,.09,.35);
      }
      for(const z of [-1.15,1.15])for(const x of [-.88,.88]){
        const wheelGroup=new T.Group();wheelGroup.position.set(x,.34,z);chassis.add(wheelGroup);wheels.push(wheelGroup);
        mesh(wheelGroup,cylinder,0x282b2c,0,0,0,.34,.20,.34).rotation.z=Math.PI/2;
        mesh(wheelGroup,cylinder,0x919797,0,0,0,.20,.21,.20,.65).rotation.z=Math.PI/2;bake(wheelGroup);
      }
    }
    bake(chassis);bake(steering);a.shadow(group,0,0,motorcycle?1.1:3,motorcycle?2.5:5);
    return {group,wheels,steering};
  }
  return {person,vehicle,batchColors:bake,dispose(){actorMaterials.forEach(m=>m.dispose());}};
}
