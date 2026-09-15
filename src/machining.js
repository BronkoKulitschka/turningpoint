// Bewusst vereinfachtes Spielmodell, keine Schnittdaten für echte Maschinen.
export const PROFILE_STEPS=24;
export const CUT_MATERIALS={
  aluminium:{resistance:.65,speed:80},
  c45:{resistance:1.35,speed:32},
  brass:{resistance:.85,speed:58}
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function blankPiece(job,material=job.material,diameter=job.diameter+4){
  return {material,diameters:Array(PROFILE_STEPS).fill(diameter),surface:Array(PROFILE_STEPS).fill(diameter===job.diameter+4?12:1),
    z:0,target:job.diameter+3,heat:20,load:0,feeding:0,seconds:0,removed:0,notice:'Rohling eingespannt. Stelle den Meißel ein und führe den Vorschub selbst.'};
}
export function validatePiece(p,job){
  const finite=(n,a,b)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=b;
  if(!p||!Object.hasOwn(CUT_MATERIALS,p.material)||
    !Array.isArray(p.diameters)||p.diameters.length!==PROFILE_STEPS||!p.diameters.every(n=>finite(n,job.diameter-1,job.diameter+4))||
    !Array.isArray(p.surface)||p.surface.length!==PROFILE_STEPS||!p.surface.every(n=>finite(n,0,100))||
    !finite(p.z,0,job.length)||!finite(p.target,job.diameter-1,job.diameter+4.5)||!finite(p.heat,20,150)||!finite(p.load,0,200)||
    ![-1,0,1].includes(p.feeding)||!finite(p.seconds,0,1e9)||!finite(p.removed,0,1e6)||typeof p.notice!=='string'||p.notice.length>300)
    throw new Error('Die gespeicherten Werkstückdaten sind beschädigt.');
  return {...p,diameters:[...p.diameters],surface:[...p.surface]};
}
export function qualityReport(order,job){
  const p=order?.piece;
  if(!p)return {ok:false,reasons:['Noch kein Werkstück.'],undersize:false,min:0,max:0,roughness:12};
  const min=Math.min(...p.diameters),max=Math.max(...p.diameters),roughness=Math.max(...p.surface);
  const undersize=min<job.diameter-.10001,reasons=[];
  if(p.material!==job.material)reasons.push('Falscher Werkstoff – für diesen Auftrag nicht verwendbar.');
  if(undersize)reasons.push('Untermaß – abgetragenes Material lässt sich nicht ersetzen.');
  if(max>job.diameter+.10001)reasons.push('Übermaß oder ungedrehte Abschnitte – weiter bearbeiten.');
  if(roughness>3.2)reasons.push('Oberfläche zu rau – ein feiner Schlichtschnitt ist nötig.');
  return {ok:reasons.length===0,reasons,undersize,min,max,roughness};
}
export function cutTick(w,order,job,elapsed){
  const p=order.piece,dt=clamp(elapsed,0,1000)/1000;
  if(!p||order.status!=='machining')return false;
  const spinning=!order.paused;
  const cooled=spinning&&w.settings.coolant&&w.coolant>0;
  if(cooled)w.coolant=Math.max(0,w.coolant-dt*.8);
  p.heat=Math.max(20,p.heat-dt*(cooled?12:2));
  if(!spinning||!p.feeding){p.load=0;return false;}
  const material=CUT_MATERIALS[p.material];
  // Beschleunigte Spielzeit: derselbe Vorschub bestimmt Weg und Oberflächengüte.
  const nextZ=clamp(p.z+p.feeding*w.settings.rpm*w.settings.feed/60*12*dt,0,job.length);
  const left=Math.min(p.z,nextZ),right=Math.max(p.z,nextZ);
  let peak=0,cut=false;
  for(let i=0;i<PROFILE_STEPS;i++){
    const a=i*job.length/PROFILE_STEPS,b=(i+1)*job.length/PROFILE_STEPS;
    if(right<=a||left>=b)continue;
    const depth=Math.max(0,(p.diameters[i]-p.target)/2);
    if(depth<.00001)continue;
    const load=depth*material.resistance*(w.settings.feed/.1)*35*(1+w.wear/150);
    peak=Math.max(peak,load);
    if(load>100){
      p.load=Math.min(200,load);p.feeding=0;order.paused=true;w.wear=Math.min(100,w.wear+2);
      p.notice='Überlast! Spindel gestoppt. Weniger zustellen oder Vorschub reduzieren.';return true;
    }
    const speed=Math.PI*p.diameters[i]*w.settings.rpm/1000;
    const ideal=material.speed*(w.tool==='carbide'?1.7:1);
    const mismatch=Math.abs(Math.log(Math.max(.05,speed/ideal)));
    const roughness=clamp(w.settings.feed**2*1000/(32*(w.tool==='carbide'?.6:.4))+
      mismatch*.6+w.wear*.015+Math.max(0,p.heat-55)*.035+load*.004,0,100);
    const spring=load*.00025+w.wear*.00015+Math.max(0,p.heat-60)*.0006;
    const actual=Math.min(p.diameters[i],p.target+spring);
    const removed=p.diameters[i]-actual;
    if(removed>.00001){
      p.diameters[i]=actual;p.surface[i]=roughness;p.removed+=removed;cut=true;
      const heat=removed*material.resistance*(1+speed/ideal)*.55;
      p.heat=clamp(p.heat+heat*(cooled?.28:1),20,150);
      w.wear=clamp(w.wear+removed*material.resistance*(w.tool==='carbide'?.018:.05)*(1+load/100)*(1+Math.max(0,speed/ideal-1)),0,100);
    }
  }
  p.z=nextZ;p.load=Math.min(200,peak);p.seconds+=dt;
  order.progress=Math.min(job.duration,p.removed/(PROFILE_STEPS*4)*job.duration);
  if(p.heat>=110||w.wear>=95){
    order.paused=true;p.feeding=0;p.notice=p.heat>=110?'Zu heiß! Abkühlen lassen und Kühlung prüfen.':'Schneide stumpf. Teil ausspannen und Werkzeug instand setzen.';return true;
  }
  p.notice=cut?'Der Meißel schneidet. Beobachte Maß, Temperatur und Belastung.':'Kein Eingriff. Die Schneide steht außerhalb des Materials.';
  if(nextZ===0||nextZ===job.length){p.feeding=0;p.notice='Ende des Arbeitswegs. Spindel stoppen, zustellen und für den nächsten Schnitt zurückfahren.';return true;}
  return false;
}
