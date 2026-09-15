// Bewusst vereinfachtes Spielmodell, keine Schnittdaten für echte Maschinen.
export const PROFILE_STEPS=24;
export const FACE_STEPS=12;
export const CUTTERS={
 rough:{name:'Schruppmeißel',nose:.2,load:.75,wear:.8,base:3.3,capacity:1.5,detail:'Robuste Schneide für großen Abtrag. Sichtbare Riefen; anschließend schlichten.'},
 finish:{name:'Schlichtmeißel',nose:.8,load:1.35,wear:1.3,base:.05,capacity:.35,detail:'Glatte Mantelfläche bei kleinem Aufmaß. Tiefe Schnitte überlasten die feine Schneide.'},
 face:{name:'Planmeißel',nose:.4,load:1,wear:1,base:.25,capacity:1.5,detail:'Zum Kürzen und Glätten der Stirnfläche. Beim Längsdrehen ungünstigere Oberfläche.'}
};
export const activeFaces=p=>p.faces.map((l,i)=>({l,ra:p.faceSurface[i],i})).filter(v=>v.i*p.stockRadius/FACE_STEPS<p.diameters[Math.min(PROFILE_STEPS-1,Math.floor((v.l-1e-8)/p.stockLength*PROFILE_STEPS))]/2);
export const partLength=p=>Math.max(...activeFaces(p).map(v=>v.l));
export const keptProfile=p=>p.diameters.map((d,i)=>({d,ra:p.surface[i],i})).filter(v=>v.i*p.stockLength/PROFILE_STEPS<partLength(p)-1e-8);
export const faceIndex=(p,job,r)=>Math.min(FACE_STEPS-1,Math.max(0,Math.floor(r/((job.diameter+4)/2)*FACE_STEPS)));
function lengthFields(job,length){return {stockRadius:(job.diameter+4)/2,stockLength:length,faces:Array(FACE_STEPS).fill(length),faceSurface:Array(FACE_STEPS).fill(length===job.length?1:12),operation:'turn',faceR:(job.diameter+4)/2,faceReference:length,faceDepth:0,lengthReading:null};}

export const CUT_MATERIALS={
  aluminium:{resistance:.65,speed:80},
  c45:{resistance:1.35,speed:32},
  brass:{resistance:.85,speed:58}
};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function blankPiece(job,material=job.material,diameter=job.diameter+4){
  return {...lengthFields(job,job.length+6),material,diameters:Array(PROFILE_STEPS).fill(diameter),surface:Array(PROFILE_STEPS).fill(diameter===job.diameter+4?12:1),
    z:0,target:diameter,reference:diameter,depth:0,probeZ:0,reading:null,revision:0,
    heat:20,load:0,feeding:0,seconds:0,removed:0,notice:'Rohling eingespannt. Erst messen, dann die Schnitttiefe einstellen.'};
}
export function validatePiece(p,job,legacyVersion=0){
  const finite=(n,a,b)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=b;
  if(legacyVersion>0&&legacyVersion<3&&p){const reference=Math.max(p.target,...p.diameters);p={...p,reference,depth:(reference-p.target)/2,probeZ:0,reading:null,revision:0};}
  if(legacyVersion>0&&legacyVersion<4&&p)p={...p,...lengthFields(job,job.length)};
  if(!p||!Object.hasOwn(CUT_MATERIALS,p.material)||
    !finite(p.stockLength,job.length,job.length+6)||p.stockRadius!==(job.diameter+4)/2||!Array.isArray(p.faces)||p.faces.length!==FACE_STEPS||!p.faces.every(v=>finite(v,1,p.stockLength))||
    !Array.isArray(p.faceSurface)||p.faceSurface.length!==FACE_STEPS||!p.faceSurface.every(v=>finite(v,0,100))||
    !['turn','face'].includes(p.operation)||!finite(p.faceR,0,(job.diameter+4)/2)||!finite(p.faceReference,1,p.stockLength)||!finite(p.faceDepth,0,1.5)||p.faceReference-p.faceDepth<1||
    (p.lengthReading!==null&&(!p.lengthReading||!finite(p.lengthReading.length,1,p.stockLength+.01)||!Number.isInteger(p.lengthReading.revision)||!finite(p.lengthReading.revision,0,p.revision)))||
    !Array.isArray(p.diameters)||p.diameters.length!==PROFILE_STEPS||!p.diameters.every(n=>finite(n,1,job.diameter+4))||
    !Array.isArray(p.surface)||p.surface.length!==PROFILE_STEPS||!p.surface.every(n=>finite(n,0,100))||
    !finite(p.z,0,p.stockLength)||!finite(p.target,1,job.diameter+4.5)||!finite(p.heat,20,150)||!finite(p.load,0,200)||
    !finite(p.reference,1,job.diameter+4.5)||!finite(p.depth,0,3)||Math.abs(p.target-(p.reference-2*p.depth))>.00001||
    !finite(p.probeZ,0,p.stockLength)||!Number.isInteger(p.revision)||!finite(p.revision,0,1e9)||
    (p.reading!==null&&(!p.reading||!finite(p.reading.z,0,p.stockLength)||!finite(p.reading.diameter,1,job.diameter+4.01)||!Number.isInteger(p.reading.revision)||!finite(p.reading.revision,0,p.revision)))||
    ![-1,0,1].includes(p.feeding)||!finite(p.seconds,0,1e9)||!finite(p.removed,0,1e6)||typeof p.notice!=='string'||p.notice.length>300)
    throw new Error('Die gespeicherten Werkstückdaten sind beschädigt.');
  return {...p,faces:[...p.faces],faceSurface:[...p.faceSurface],lengthReading:p.lengthReading?{...p.lengthReading}:null,diameters:[...p.diameters],surface:[...p.surface],reading:p.reading?{z:p.reading.z,diameter:p.reading.diameter,revision:p.reading.revision}:null};
}
export const profileIndex=(p,job,z)=>Math.min(p.diameters.length-1,Math.max(0,Math.floor(z/p.stockLength*p.diameters.length)));
export function rewardFor(order,job){
  const q=qualityReport(order,job);
  const deviation=order?.piece?Math.round(Math.max(...keptProfile(order.piece).map(v=>Math.abs(v.d-job.diameter)))*1e9)/1e9:Infinity;
  const lengthDeviation=order?.piece?Math.round(Math.max(...activeFaces(order.piece).map(v=>Math.abs(v.l-job.length)))*1e9)/1e9:Infinity;
  const bonus=q.ok?Math.round(job.pay*.5*clamp(1-Math.max(deviation/.1,lengthDeviation/.2),0,1)):0;
  return {base:job.pay,bonus,total:q.ok?job.pay+bonus:0,deviation,lengthDeviation};
}
export function qualityReport(order,job){
  const p=order?.piece;
  if(!p)return {ok:false,reasons:['Noch kein Werkstück.'],undersize:false,min:0,max:0,roughness:12};
  const kept=keptProfile(p),min=Math.min(...kept.map(v=>v.d)),max=Math.max(...kept.map(v=>v.d)),roughness=Math.max(...kept.map(v=>v.ra),...activeFaces(p).map(v=>v.ra));
  const length=partLength(p),minLength=Math.min(...activeFaces(p).map(v=>v.l)),tooShort=minLength<job.length-.20001;
  const undersize=min<job.diameter-.10001||tooShort,reasons=[];
  if(p.material!==job.material)reasons.push('Falscher Werkstoff – für diesen Auftrag nicht verwendbar.');
  if(undersize)reasons.push('Untermaß – abgetragenes Material lässt sich nicht ersetzen.');
  if(max>job.diameter+.10001)reasons.push('Übermaß oder ungedrehte Abschnitte – weiter bearbeiten.');
  if(tooShort)reasons.push('Zu kurz gedreht – für diesen Auftrag ist ein neuer Rohling nötig.');
  if(length>job.length+.20001)reasons.push('Zu lang oder unvollständig geplante Stirnfläche – weiter bearbeiten.');
  if(roughness>3.2)reasons.push('Oberfläche zu rau – ein feiner Schlichtschnitt ist nötig.');
  return {ok:reasons.length===0,reasons,undersize,min,max,roughness,length,minLength,tooShort};
}
export function cutTick(w,order,job,elapsed){
  const p=order.piece,dt=clamp(elapsed,0,1000)/1000;
  if(!p||order.status!=='machining')return false;
  const spinning=!order.paused;
  const cooled=spinning&&w.settings.coolant&&w.coolant>0;
  if(cooled)w.coolant=Math.max(0,w.coolant-dt*.8);
  p.heat=Math.max(20,p.heat-dt*(cooled?12:2));
  if(!spinning||!p.feeding){p.load=0;return false;}
  if(p.operation==='face')return faceTick(w,order,job,dt,cooled);
  const material=CUT_MATERIALS[p.material],cutter=CUTTERS[w.cutter];
  // Beschleunigte Spielzeit: derselbe Vorschub bestimmt Weg und Oberflächengüte.
  const nextZ=clamp(p.z+p.feeding*w.settings.rpm*w.settings.feed/60*12*dt,0,partLength(p));
  const left=Math.min(p.z,nextZ),right=Math.max(p.z,nextZ);
  let peak=0,cut=false;
  for(let i=0;i<PROFILE_STEPS;i++){
    const a=i*p.stockLength/PROFILE_STEPS,b=(i+1)*p.stockLength/PROFILE_STEPS;
    if(right<=a||left>=b)continue;
    const depth=Math.max(0,(p.diameters[i]-p.target)/2);
    if(depth<.00001)continue;
    const load=depth*material.resistance*(w.settings.feed/.1)*35*(1+w.wear/150)*cutter.load*(1+Math.max(0,depth-(w.cutter==='face'?.4:cutter.capacity))*3);
    peak=Math.max(peak,load);
    if(load>100){
      p.load=Math.min(200,load);p.feeding=0;order.paused=true;w.wear=Math.min(100,w.wear+2);
      p.notice='Überlast! Spindel gestoppt. Weniger zustellen oder Vorschub reduzieren.';return true;
    }
    const speed=Math.PI*p.diameters[i]*w.settings.rpm/1000;
    const ideal=material.speed*(w.tool==='carbide'?1.7:1);
    const mismatch=Math.abs(Math.log(Math.max(.05,speed/ideal)));
    const roughness=clamp(w.settings.feed**2*1000/(32*cutter.nose)+(w.cutter==='face'?2.8:cutter.base)+
      mismatch*.6+w.wear*.015+Math.max(0,p.heat-55)*.035+load*.004,0,100);
    const spring=load*.00025+w.wear*.00015+Math.max(0,p.heat-60)*.0006;
    const actual=Math.min(p.diameters[i],p.target+spring);
    const removed=p.diameters[i]-actual;
    if(removed>.00001){
      p.diameters[i]=actual;p.surface[i]=roughness;p.removed+=removed;p.revision+=1;cut=true;
      const heat=removed*material.resistance*(1+speed/ideal)*.55;
      p.heat=clamp(p.heat+heat*(cooled?.28:1),20,150);
      w.wear=clamp(w.wear+removed*material.resistance*(w.tool==='carbide'?.018:.05)*cutter.wear*(1+load/100)*(1+Math.max(0,speed/ideal-1)),0,100);
    }
  }
  p.z=Math.min(nextZ,partLength(p));p.load=Math.min(200,peak);p.seconds+=dt;
  order.progress=Math.min(job.duration,p.removed/(PROFILE_STEPS*4)*job.duration);
  if(p.heat>=110||w.wear>=95){
    order.paused=true;p.feeding=0;p.notice=p.heat>=110?'Zu heiß! Abkühlen lassen und Kühlung prüfen.':'Schneide stumpf. Teil ausspannen und Werkzeug instand setzen.';return true;
  }
  p.notice=cut?'Der Meißel schneidet. Schnitttiefe und Vorschub bestimmen den Abtrag.':'Kein Eingriff. Prüfe Schnitttiefe und Position.';
  if(p.z===0||p.z===partLength(p)){p.feeding=0;p.notice='Ende des Arbeitswegs. Spindel stoppen, zustellen und für den nächsten Schnitt zurückfahren.';return true;}
  return false;
}

// Stirnfläche in radialen Abschnitten. Erst ein vollständiger Werkzeugweg kürzt die ganze Fläche.
function faceTick(w,order,job,dt,cooled){
 const p=order.piece,m=CUT_MATERIALS[p.material],c=CUTTERS[w.cutter];
 const radius=(job.diameter+4)/2,previous=p.faceR;
 const next=clamp(previous+p.feeding*w.settings.rpm*w.settings.feed/60*12*dt,0,radius);
 const left=Math.min(previous,next),right=Math.max(previous,next),target=p.faceReference-p.faceDepth;
 let peak=0,cut=false;
 for(let i=0;i<FACE_STEPS;i++){
  if(right<=i*radius/FACE_STEPS||left>=(i+1)*radius/FACE_STEPS)continue;
  const depth=Math.max(0,p.faces[i]-target);if(depth<.00001)continue;
  const capacity=w.cutter==='finish'?.15:c.capacity;
  const load=depth*m.resistance*(w.settings.feed/.1)*35*c.load*(1+w.wear/150)*(1+Math.max(0,depth-capacity)*3);peak=Math.max(peak,load);
  if(load>100){order.paused=true;p.feeding=0;p.load=Math.min(200,load);w.wear=Math.min(100,w.wear+2);p.notice='Überlast beim Planen. Weniger axial zustellen oder einen geeigneteren Meißel wählen.';return true;}
  const speed=Math.PI*Math.max(2,(i+.5)*radius/FACE_STEPS*2)*w.settings.rpm/1000;
  const ideal=m.speed*(w.tool==='carbide'?1.7:1);
  const rough=clamp(w.settings.feed**2*1000/(32*c.nose)+c.base+Math.abs(Math.log(Math.max(.05,speed/ideal)))*.2+w.wear*.01+Math.max(0,p.heat-55)*.035,0,100);
  const actual=Math.min(p.faces[i],target+load*.00015+w.wear*.00008);
  const removed=p.faces[i]-actual;
  if(removed>.00001){p.faces[i]=actual;p.faceSurface[i]=rough;p.removed+=removed;p.revision++;cut=true;
   p.heat=clamp(p.heat+removed*m.resistance*(1+speed/ideal)*(cooled?.2:.7),20,150);
   w.wear=clamp(w.wear+removed*m.resistance*c.wear*(w.tool==='carbide'?.02:.05)*(1+load/100),0,100);
  }
 }
 p.faceR=next;p.load=Math.min(200,peak);p.seconds+=dt;
 if(p.heat>=110||w.wear>=95){order.paused=true;p.feeding=0;p.notice='Bearbeitung gestoppt. Temperatur und Werkzeugzustand prüfen.';return true;}
 p.notice=cut?'Stirnfläche wird gekürzt. Führe den Meißel über die ganze Fläche.':'Kein Eingriff an der Stirnfläche.';
 if(next===0||next===radius){p.feeding=0;p.notice='Radialer Werkzeugweg beendet. Spindel stoppen und Länge messen.';return true;}
 return false;
}
