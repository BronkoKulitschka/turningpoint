import { blankPiece, validatePiece, qualityReport, cutTick, profileIndex, rewardFor, CUTTERS, partLength, faceIndex, keptProfile, activeFaces } from './machining.js?v=008';
// Spielregeln des Funktionstests. Zeit, Preise und Schnittwerte sind Spielbalancing.
export const MATERIALS = {
  aluminium: {name:'Aluminium', price:12, color:'#b9c5bc'},
  c45: {name:'Stahl C45', price:18, color:'#818e92'},
  brass: {name:'Messing', price:24, color:'#c1a257'},
};
export const JOBS = [
  {id:'bolt', name:'Ein Bolzen für Kowalski', customer:'Herr Kowalski', material:'aluminium', diameter:20, length:60, pay:90, duration:12000, detail:'Für das Gartentor. Ein einfacher Bolzen ohne Gewinde.'},
  {id:'pin', name:'Ein Stift für die Bäckerei', customer:'Frau Brenner', material:'c45', diameter:16, length:45, pay:130, duration:15000, detail:'Ein Ersatzstift für den Griff eines Transportwagens.'},
  {id:'knob', name:'Ein Griff für Mehmet', customer:'Mehmet', material:'brass', diameter:24, length:35, pay:160, duration:18000, detail:'Ein glatter Messinggriff für eine Schublade.'},
];
export const STEPS = ['new','accepted','material','prepared','machining','machined','deburred','checked','completed'];
export const DEFAULT_LAYOUT = [
  {id:'desk',x:330,y:555},{id:'lathe',x:620,y:545},{id:'storage',x:1060,y:565},
  {id:'tools',x:850,y:530},{id:'rack',x:1000,y:715},{id:'cart',x:620,y:755},
  {id:'vise',x:445,y:460},{id:'measure',x:265,y:427},{id:'radio',x:112,y:390},
  {id:'clean',x:135,y:490},{id:'build',x:372,y:295},{id:'cat',x:777,y:631},
];
export function freshWorkshop() {
  return {version:4,money:250,stock:{aluminium:4,c45:3,brass:2},
    orders:JOBS.map(j=>({id:j.id,status:'new',progress:0,paused:false,actual:null,measured:false,passes:0,piece:null,payout:null})),
    active:null,cutter:'rough',tool:'hss',wear:20,cartReady:false,chips:0,scrap:0,
    coolant:100,settings:{rpm:450,feed:0.1,coolant:false},radio:false,volume:25,light:true,catPets:0,
    room:{width:6,depth:5,extension:false,drill:false,layout:DEFAULT_LAYOUT.map(o=>({...o}))}};
}
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
const bool=v=>typeof v==='boolean';
export function validateWorkshop(w) {
  if(w===undefined) return freshWorkshop();
  const bad=()=>{throw new Error('Die Werkstattdaten sind beschädigt oder haben eine nicht unterstützte Version.');};
  if(!w||![1,2,3,4].includes(w.version)||!integer(w.money,0,1e8)||!w.stock||!w.settings||!w.room||
    !['aluminium','c45','brass'].every(k=>integer(w.stock[k],0,9999))||
    !['hss','carbide'].includes(w.tool)||!finite(w.wear,0,100)||!bool(w.cartReady)||
    !integer(w.chips,0,9999)||!integer(w.scrap,0,9999)||!bool(w.radio)||!bool(w.light)||!finite(w.volume,0,100)||
    !integer(w.catPets,0,1e7)||![300,450,800,1200].includes(w.settings.rpm)||![0.05,0.1,0.2,0.3].includes(w.settings.feed)||
    !Array.isArray(w.orders)||w.orders.length!==JOBS.length||!bool(w.room.extension)||!bool(w.room.drill)||
    w.room.width!==(w.room.extension?8:6)||w.room.depth!==5||!Array.isArray(w.room.layout)||w.room.layout.length!==DEFAULT_LAYOUT.length)bad();
  if(w.version>=2&&(!finite(w.coolant,0,100)||!bool(w.settings.coolant)))bad();
  const cutter=w.version<4?'finish':w.cutter;if(!Object.hasOwn(CUTTERS,cutter))bad();
  const orders=JOBS.map(j=>{
    const o=w.orders.find(o=>o?.id===j.id);
    if(!o||!STEPS.includes(o.status)||!finite(o.progress,0,j.duration)||!bool(o.paused)||!bool(o.measured)||
      !integer(o.passes,0,100)||(o.actual!==null&&!finite(o.actual,0,1000)))bad();
    if(STEPS.indexOf(o.status)>=5&&(o.actual===null||o.progress!==j.duration))bad();
    if(['checked','completed'].includes(o.status)&&(!o.measured||Math.abs(o.actual-j.diameter)>0.10001))bad();
    const needsPiece=STEPS.indexOf(o.status)>=2;
    let piece=null;
    if(w.version===1&&needsPiece){
      piece=validatePiece(blankPiece(j,j.material,o.actual??j.diameter+4),j,3);
      // Alte Timerdurchgänge hatten noch kein Profil. Sie beginnen pausiert am Rohling.
      if(o.status==='machining')piece.notice='Update: Dieser alte Durchgang hat noch kein Schnittprofil. Der Rohling ist jetzt manuell zu bearbeiten.';
    }else if(w.version>=2){
      if(needsPiece){piece=validatePiece(o.piece,j,w.version<4?w.version:0);}else if(o.piece!==null)bad();
    }
    const payout=w.version<3?(o.status==='completed'?j.pay:null):o.payout;
    if(o.status==='completed'?!integer(payout,j.pay,Math.round(j.pay*1.5)):payout!==null)bad();
    const result={payout,id:j.id,status:o.status,progress:o.progress,paused:w.version===1&&o.status==='machining'?true:o.paused,actual:o.actual,measured:o.measured,passes:o.passes,piece};
    if(w.version>=2&&['checked','completed'].includes(o.status)&&!qualityReport(result,j).ok)bad();
    return result;
  });
  const ongoing=orders.filter(o=>!['new','completed'].includes(o.status));
  if(ongoing.length>1|| (ongoing.length? w.active!==ongoing[0].id : w.active!==null))bad();
  const layout=DEFAULT_LAYOUT.map(def=>{
    const o=w.room.layout.find(o=>o?.id===def.id);
    if(!o||!finite(o.x,0,1200)||!finite(o.y,0,820))bad();return {id:def.id,x:o.x,y:o.y};
  });
  return {version:4,money:w.money,stock:{aluminium:w.stock.aluminium,c45:w.stock.c45,brass:w.stock.brass},orders,
    active:w.active,cutter,tool:w.tool,wear:w.wear,cartReady:w.cartReady,chips:w.chips,scrap:w.scrap,
    coolant:w.version===1?100:w.coolant,settings:{rpm:w.settings.rpm,feed:w.settings.feed,coolant:w.version===1?false:w.settings.coolant},radio:w.radio,volume:w.volume,light:w.light,catPets:w.catPets,
    room:{width:w.room.width,depth:5,extension:w.room.extension,drill:w.room.drill,layout}};
}
export const activeOrder=w=>w.orders.find(o=>o.id===w.active)||null;
export const jobFor=o=>JOBS.find(j=>j.id===o?.id)||null;
export const inTolerance=o=>!!o&&o.actual!==null&&qualityReport(o,jobFor(o)).ok;
function need(ok,text){if(!ok)throw new Error(text);}
function pay(w,cost){need(w.money>=cost,'Dafür reicht die Werkstattkasse noch nicht.');w.money-=cost;}
export function act(w,action,arg) {
  const o=activeOrder(w);const j=jobFor(o);
  switch(action){
    case 'accept': {
      need(!o,'Schließe zuerst deinen laufenden Auftrag ab.');const target=w.orders.find(x=>x.id===arg);
      need(target?.status==='new','Dieser Auftrag ist bereits angenommen.');target.status='accepted';w.active=target.id;w.cartReady=false;
      return 'Auftrag angenommen. Wähle am Materialständer das Rohmaterial.';
    }
    case 'select-material':
      need(o?.status==='accepted','Nimm zuerst am Schreibtisch einen neuen Auftrag an.');
      need(Object.hasOwn(MATERIALS,arg),'Unbekanntes Material.');need(w.stock[arg]>0,'Dieses Material ist aufgebraucht. Bestelle es am Lagerregal.');
      w.stock[arg]-=1;o.piece=blankPiece(j,arg);o.status='material';return arg===j.material?'Rohling bereit. Rüste jetzt den Werkzeugwagen.':'Dieser Rohling hat den falschen Werkstoff. Du kannst ihn bearbeiten, aber nicht für diesen Auftrag abgeben.';
    case 'buy-material': need(Object.hasOwn(MATERIALS,arg),'Unbekanntes Material.');need(w.stock[arg]<=9996,'Das Materiallager ist voll.');pay(w,MATERIALS[arg].price*3);w.stock[arg]+=3;return 'Drei Rohlinge wurden ins Lager gelegt.';
    case 'cutter':
      need(Object.hasOwn(CUTTERS,arg),'Unbekannte Meißelform.');need(o?.status!=='machining'||o.paused,'Stoppe zuerst die Spindel für den Meißelwechsel.');
      w.cutter=arg;return `${CUTTERS[arg].name} eingesetzt. Prüfe Zustellung und Schnittwerte vor dem nächsten Schnitt.`;
    case 'operation':
      need(o?.piece&&['prepared','machining'].includes(o.status),'Spanne zuerst ein Werkstück ein.');need(o.status!=='machining'||o.paused,'Stoppe zuerst die Spindel.');need(['turn','face'].includes(arg),'Unbekannter Arbeitsgang.');
      o.piece.operation=arg;o.piece.feeding=0;o.piece.z=Math.min(o.piece.z,partLength(o.piece));return arg==='face'?'Plandrehen: axial zustellen, dann den Meißel radial über die Stirnfläche führen.':'Längsdrehen: radial zustellen, dann den Meißel entlang des Werkstücks führen.';
    case 'tool': need(['hss','carbide'].includes(arg),'Unbekanntes Werkzeug.');need(o?.status!=='machining'||o.paused,'Stoppe zuerst die Spindel.');need(w.tool!==arg,'Dieses Werkzeug ist bereits ausgewählt.');if(arg==='carbide')pay(w,12);w.tool=arg;return 'Schneidstoff gewechselt. Prüfe die Schnittwerte.';
    case 'sharpen': need(o?.status!=='machining'||o.paused,'Stoppe zuerst die Spindel.');need(w.wear>0,'Das Werkzeug ist bereits scharf.');pay(w,5);w.wear=0;return 'Werkzeug instand gesetzt.';
    case 'prepare': need(o?.status==='material','Wähle zuerst das passende Rohmaterial.');need(w.wear<85,'Setze das Werkzeug zuerst am Schrank instand.');w.cartReady=true;o.status='prepared';return 'Werkzeug und Messschieber liegen bereit. Die Drehbank ist dran.';
    case 'settings':
      need(o?.status!=='machining'||o.paused,'Stoppe die Spindel vor dem Umstellen.');
      need([300,450,800,1200].includes(arg?.rpm)&&[0.05,0.1,0.2,0.3].includes(arg?.feed)&&typeof arg?.coolant==='boolean','Ungültige Einstellung.');
      w.settings={rpm:arg.rpm,feed:arg.feed,coolant:arg.coolant};return 'Schnittwerte eingestellt. Vorschub, Wärme und Oberfläche ändern sich entsprechend.';
    case 'refill-coolant': need(o?.status!=='machining'||o.paused,'Stoppe zuerst die Spindel.');need(w.coolant<100,'Der Kühlmitteltank ist voll.');pay(w,6);w.coolant=100;return 'Kühlmitteltank aufgefüllt.';
    case 'touch': {
      need(o?.piece&&['prepared','machining'].includes(o.status),'Spanne zuerst einen Rohling ein.');
      need(o.status!=='machining'||o.paused,'Stoppe die Spindel zum Antasten.');
      const p=o.piece;
      if(p.operation==='face'){p.faceReference=p.faces[faceIndex(p,j,p.faceR)];p.faceDepth=0;p.notice='Stirnfläche angetastet. Axiale Zustellung auf null.';return p.notice;}
      p.reference=p.diameters[profileIndex(p,j,p.z)];p.depth=0;p.target=p.reference;
      p.notice='Schneide an dieser Stelle angetastet. Die radiale Zustellung steht auf null.';return p.notice;
    }
    case 'depth': {
      need(o?.piece&&['prepared','machining'].includes(o.status),'Spanne zuerst einen Rohling ein.');
      const depth=Number(arg);need(finite(depth,0,3),'Schnitttiefe zwischen 0 und 3 mm wählen.');
      if(o.piece.operation==='face'){need(depth<=1.5&&o.piece.faceReference-depth>=1,'Axiale Zustellung bis 1,5 mm innerhalb des Werkstücks wählen.');o.piece.faceDepth=depth;o.piece.notice='Axiale Zustellung eingestellt. Kürzen erfolgt beim radialen Werkzeugweg.';return o.piece.notice;}
      const target=o.piece.reference-2*depth;need(target>=1,'Der Querschlitten erreicht seine mechanische Grenze.');
      o.piece.depth=depth;o.piece.target=target;o.piece.notice='Radiale Schnitttiefe eingestellt. Der nächste Werkzeugweg schneidet mit dieser Zustellung.';
      return o.piece.notice;
    }
    case 'probe-position':
      need(o?.piece&&['prepared','machining'].includes(o.status),'Das Werkstück muss eingespannt sein.');
      need(o.status!=='machining'||o.paused,'Stoppe die Spindel zum Anlegen des Messschiebers.');
      need(finite(Number(arg),0,partLength(o.piece)),'Messstelle außerhalb des Werkstücks.');o.piece.probeZ=Number(arg);return 'Messstelle ausgewählt. Lege jetzt den Messschieber an.';
    case 'measure-lathe': {
      need(o?.piece&&['prepared','machining'].includes(o.status),'Das Werkstück muss eingespannt sein.');
      need(o.status!=='machining'||o.paused,'Messen ist nur bei stehender Spindel möglich.');
      const p=o.piece;need(p.probeZ<=Math.min(...activeFaces(p).map(v=>v.l)),'Diese Messstelle liegt außerhalb der vollständig erhaltenen Länge. Wähle eine Stelle weiter links.');p.reading={z:p.probeZ,diameter:Number(p.diameters[profileIndex(p,j,p.probeZ)].toFixed(2)),revision:p.revision};
      p.notice='Messschieber angelegt. Der Messwert gilt nur für diese Stelle und diesen Bearbeitungsstand.';
      return p.notice;
    }
    case 'measure-length': {
      need(o?.piece&&['prepared','machining'].includes(o.status),'Das Werkstück muss eingespannt sein.');need(o.status!=='machining'||o.paused,'Länge nur bei stehender Spindel messen.');
      const p=o.piece;p.lengthReading={length:Number(partLength(p).toFixed(2)),revision:p.revision};p.notice='Gesamtlänge gemessen. Eine unebene Stirnfläche kann trotzdem Nacharbeit erfordern.';return p.notice;
    }
    case 'position':
      need(o?.piece&&['prepared','machining'].includes(o.status),'Spanne zuerst einen Rohling ein.');
      need(o.status!=='machining'||o.paused,'Zum freien Positionieren muss die Spindel stehen.');
      if(o.piece.operation==='face'){need(finite(Number(arg),0,(j.diameter+4)/2),'Radialposition außerhalb des Arbeitswegs.');o.piece.faceR=Number(arg);o.piece.feeding=0;return 'Radialer Schlitten positioniert.';}
      need(finite(Number(arg),0,partLength(o.piece)),'Position außerhalb des Werkstücks.');o.piece.z=Number(arg);o.piece.feeding=0;return 'Schlitten positioniert.';
    case 'start':
      need(o?.status==='prepared'&&w.cartReady,'Bereite zuerst Material und Werkzeugwagen vor.');need(w.wear<85,'Das Werkzeug ist zu stumpf.');need(w.chips<5,'Reinige zuerst den Arbeitsplatz.');
      o.status='machining';o.paused=false;o.actual=null;o.measured=false;o.piece.feeding=0;return 'Spindel läuft. Halte eine Vorschubtaste, um selbst zu schneiden.';
    case 'pause':
      need(o?.status==='machining','Es läuft keine Bearbeitung.');
      if(o.paused){need(w.wear<95,'Die Schneide ist stumpf. Spanne aus und setze sie instand.');need(o.piece.heat<100,'Lass das Werkstück erst abkühlen.');}
      o.paused=!o.paused;o.piece.feeding=0;return o.paused?'Spindel steht. Jetzt kannst du zustellen und positionieren.':'Spindel läuft. Den Vorschub steuerst du selbst.';
    case 'feed':
      need(o?.status==='machining','Spanne zuerst ein Werkstück ein.');need([-1,0,1].includes(Number(arg)),'Ungültige Vorschubrichtung.');
      need(Number(arg)===0||!o.paused,'Schalte zuerst die Spindel ein.');o.piece.feeding=Number(arg);return Number(arg)?'Vorschub aktiv – Taste halten.':'Vorschub angehalten.';
    case 'finish-cut':
      need(o?.status==='machining'&&o.paused,'Stoppe vor dem Ausspannen die Spindel.');
      o.status='machined';o.progress=j.duration;o.actual=Math.max(...keptProfile(o.piece).map(v=>v.d));o.piece.feeding=0;
      if(o.piece.removed>0){w.chips=Math.min(9999,w.chips+1);o.piece.removed=0;}return 'Werkstück ausgespannt. Entgrate es und prüfe die Fertigung.';
    case 'scrap-piece':
      need(o?.piece&&!['new','accepted','completed'].includes(o.status),'Es gibt kein Werkstück zum Verwerfen.');
      need(o.status!=='machining'||o.paused,'Stoppe zuerst die Spindel.');
      o.piece=null;o.status='accepted';o.progress=0;o.actual=null;o.measured=false;o.paused=false;w.cartReady=false;w.scrap=Math.min(9999,w.scrap+1);
      return 'Werkstück verworfen. Der Rohling ist verbraucht; wähle neues Material.';
    case 'deburr': need(o?.status==='machined','Es liegt noch kein gedrehtes Teil zum Entgraten bereit.');o.status='deburred';return 'Kanten entgratet. Miss das Teil am Schreibtisch.';
    case 'measure':
      need(o?.status==='deburred','Drehe das Teil und entgrate es zuerst am Schraubstock.');o.measured=true;
      if(inTolerance(o)){o.status='checked';return 'Maßhaltig. Der Auftrag kann am Schreibtisch abgegeben werden.';}
      return qualityReport(o,j).reasons.join(' ');
    case 'rework':
      need(o&&['deburred','checked'].includes(o.status)&&o.measured,'Prüfe das Werkstück vor der Nacharbeit.');
      need(!qualityReport(o,j).undersize&&o.piece.material===j.material,'Untermaß, zu kurze Länge oder falscher Werkstoff: Für diesen Auftrag ist ein neuer Rohling nötig.');
      need(w.wear<85,'Setze das Werkzeug vor der Nacharbeit instand.');need(w.chips<5,'Reinige zuerst den Arbeitsplatz.');
      o.status='prepared';o.passes=Math.min(100,o.passes+1);o.measured=false;w.cartReady=true;o.piece.z=0;o.piece.feeding=0;
      return 'Dasselbe Teil ist wieder eingespannt. Trage nur das verbliebene Aufmaß ab.';
    case 'deliver': {
      need(o?.status==='checked','Der Auftrag muss zuerst gefertigt, entgratet und geprüft werden.');
      const reward=rewardFor(o,j);need(reward.total>0,'Dieses Werkstück besteht die Abnahme nicht.');
      o.payout=reward.total;w.money+=reward.total;o.status='completed';w.active=null;w.cartReady=false;
      return `${reward.total} € erhalten: ${reward.base} € Grundlohn + ${reward.bonus} € Genauigkeitsbonus.`;
    }
    case 'clean': need(w.chips>0,'Der Boden ist bereits sauber.');w.scrap+=w.chips;w.chips=0;return 'Späne eingesammelt. Du kannst sie am Eimer verkaufen.';
    case 'sell-scrap': need(w.scrap>0,'Es sind noch keine Späne eingesammelt.');const cash=w.scrap*3;w.money+=cash;w.scrap=0;return `${cash} € für Späne erhalten.`;
    case 'radio': w.radio=!w.radio;return w.radio?'Werkstattradio eingeschaltet.':'Werkstattradio ausgeschaltet.';
    case 'volume': need(finite(arg,0,100),'Ungültige Lautstärke.');w.volume=arg;return 'Lautstärke eingestellt.';
    case 'light': w.light=!w.light;return w.light?'Arbeitslicht eingeschaltet.':'Arbeitslicht ausgeschaltet.';
    case 'pet': w.catPets+=1;return 'Späne schnurrt zufrieden.';
    case 'extend': need(!w.room.extension,'Der Anbau ist bereits vorhanden.');pay(w,200);w.room.extension=true;w.room.width=8;return 'Der erste Anbau ist fertig: 10 m² mehr Werkstattfläche.';
    case 'buy-drill': need(w.room.extension,'Baue zuerst die Werkstatt an.');need(!w.room.drill,'Die Bohrmaschine steht bereits im Anbau.');pay(w,180);w.room.drill=true;return 'Die Standbohrmaschine wurde im Anbau aufgestellt.';
    case 'drill-test': need(w.room.drill,'Es steht noch keine Bohrmaschine im Anbau.');need(w.stock.aluminium>0,'Für die Probebohrung fehlt ein Aluminium-Rohling.');w.stock.aluminium-=1;w.scrap+=1;return 'Probebohrung ausgeführt. Der verbrauchte Rohling liegt im Schrott.';
    default: throw new Error('Unbekannte Werkstattaktion.');
  }
}
export function advance(w,elapsed) {
  const o=activeOrder(w);return o?cutTick(w,o,jobFor(o),elapsed):false;
}
export function nextTask(w){
  const o=activeOrder(w);
  if(!o)return w.orders.every(x=>x.status==='completed')?{station:'build',text:'Alle drei Testaufträge erledigt. Probiere den Anbau aus.'}:{station:'desk',text:'Tippe auf den Schreibtisch und nimm einen Auftrag an.'};
  return ({accepted:{station:'rack',text:'Wähle den passenden Rohling am Materialständer.'},material:{station:'cart',text:'Lege die Werkzeuge am Wagen bereit.'},prepared:{station:'lathe',text:'Stelle die Drehbank ein und starte die Bearbeitung.'},machining:{station:'lathe',text:o.paused?'Spindel steht: zustellen, positionieren oder Teil ausspannen.':'Halte den Vorschub an der Drehbank. Ohne deine Hand schneidet sie nicht.'},machined:{station:'vise',text:'Entgrate das Werkstück am Schraubstock.'},deburred:{station:o.measured?'lathe':'measure',text:o.measured?'Prüfung nicht bestanden. Prüfe Nacharbeit oder einen neuen Rohling.':'Prüfe Maß, Oberfläche und Werkstoff am Messschieber.'},checked:{station:'desk',text:'Gib den geprüften Auftrag am Schreibtisch ab.'}})[o.status];
}
