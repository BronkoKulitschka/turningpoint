import * as THREE from '../vendor/three/three.module.js';
import { GLTFLoader } from '../vendor/three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from '../vendor/three/addons/controls/OrbitControls.js';
import { bindLathe, STOCK_X, UNIT, AXIS_Y } from './lathe-model.js?v=008';

export async function createLatheView() {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.setClearColor(0x18251f);renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
  const canvas=renderer.domElement;canvas.setAttribute('aria-label','3D-Drehbank mit beweglichem Futter, Schlitten und Werkstück');canvas.setAttribute('role','img');
  const scene=new THREE.Scene(), camera=new THREE.PerspectiveCamera(32,1,.003,20);
  scene.add(new THREE.HemisphereLight(0xffedd0,0x567461,3));
  const key=new THREE.DirectionalLight(0xffe2ac,3);key.position.set(-1,3,2);scene.add(key);
  const rim=new THREE.DirectionalLight(0xb6d0dc,2);rim.position.set(2,2,-1);scene.add(rim);
  const controls=new OrbitControls(camera,canvas);controls.enablePan=false;controls.enableDamping=false;controls.minDistance=.08;controls.maxDistance=5;
  let rig;
  try {rig=bindLathe((await new GLTFLoader().loadAsync(new URL('../assets/models/TurningPoint_Leitspindeldrehbank.glb',import.meta.url).href)).scene);}
  catch(e){controls.dispose();renderer.dispose();throw e;}
  scene.add(rig.root);
  let host=null, mode='detail', currentW=null,currentO=null,last=0, frame=0,failed=false;
  const resetCamera=()=>{
    const p=currentO?.piece,detail=mode==='detail'&&p;
    const middle=detail?STOCK_X+p.stockLength*UNIT*.5:0;
    const target=new THREE.Vector3(middle,detail?AXIS_Y:.67,detail ? .012 : 0);
    const aspect=Math.max(.4,camera.aspect);
    const distance=detail?Math.max(.30,.70/aspect):Math.max(2.4,3.6/aspect);
    controls.target.copy(target);camera.position.copy(target).add(new THREE.Vector3(.18,.52,1).normalize().multiplyScalar(distance));
    camera.lookAt(target);controls.update();
  };
  const resize=()=>{if(!host)return;const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();resetCamera();};
  const observer=new ResizeObserver(resize);
  const fail=()=>{failed=true;cancelAnimationFrame(frame);if(host){host.hidden=true;const fallback=host.parentElement?.querySelector('#machine-live');if(fallback)fallback.hidden=false;const status=host.parentElement?.querySelector('.lathe-view-status');if(status)status.textContent='3D nicht verfügbar · Schnittansicht aktiv';}};
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();fail();});
  const loop=time=>{
    frame=0;if(!host?.isConnected||host.hidden||document.hidden||failed)return;
    try{
      rig.sync(currentW,currentO,Math.min(.05,last?(time-last)/1000:0));last=time;
      const status=host.parentElement?.querySelector('.lathe-view-status'),p=currentO?.piece;
      if(status){
        const spinning=currentO?.status==='machining'&&!currentO.paused;
        status.textContent=p?`${spinning?'Spindel an':'Spindel steht'} · Last ${Math.round(spinning?p.load:0)} % · ${Math.round(p.heat)} °C · Ziehen zum Drehen`:'3D · Ziehen zum Drehen';
      }
      renderer.render(scene,camera);frame=requestAnimationFrame(loop);
    }catch{fail();}
  };
  const stop=()=>{cancelAnimationFrame(frame);frame=0;last=0;};
  document.addEventListener('visibilitychange',()=>{stop();if(!document.hidden&&host&&!host.hidden&&!failed)frame=requestAnimationFrame(loop);});
  return {
    mount(next,w,o,nextMode='detail') {
      stop();observer.disconnect();host=next;currentW=w;currentO=o;const changed=mode!==nextMode;mode=nextMode;
      if(!host||failed)return false;
      const moved=canvas.parentElement!==host;if(moved)host.append(canvas);
      host.hidden=mode==='sketch';observer.observe(host);
      if(mode!=='sketch'){resize();if(changed||moved)resetCamera();frame=requestAnimationFrame(loop);}return !failed;
    },
    sync(w,o){currentW=w;currentO=o;},
    detach(){stop();observer.disconnect();host=null;canvas.remove();}
  };
}
