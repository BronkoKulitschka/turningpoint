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
  return {version:1,money:250,stock:{aluminium:4,c45:3,brass:2},
    orders:JOBS.map(j=>({id:j.id,status:'new',progress:0,paused:false,actual:null,measured:false,passes:0})),
    active:null,tool:'hss',wear:20,cartReady:false,chips:0,scrap:0,
    settings:{rpm:450,feed:0.1},radio:false,volume:25,light:true,catPets:0,
    room:{width:6,depth:5,extension:false,drill:false,layout:DEFAULT_LAYOUT.map(o=>({...o}))}};
}
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const integer=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
const bool=v=>typeof v==='boolean';
export function validateWorkshop(w) {
  if(w===undefined) return freshWorkshop();
  const bad=()=>{throw new Error('Die Werkstattdaten sind beschädigt oder haben eine nicht unterstützte Version.');};
  if(!w||w.version!==1||!integer(w.money,0,1e8)||!w.stock||!w.settings||!w.room||
    !['aluminium','c45','brass'].every(k=>integer(w.stock[k],0,9999))||
    !['hss','carbide'].includes(w.tool)||!finite(w.wear,0,100)||!bool(w.cartReady)||
    !integer(w.chips,0,9999)||!integer(w.scrap,0,9999)||!bool(w.radio)||!bool(w.light)||!finite(w.volume,0,100)||
    !integer(w.catPets,0,1e7)||![300,450,800].includes(w.settings.rpm)||![0.1,0.2,0.3].includes(w.settings.feed)||
    !Array.isArray(w.orders)||w.orders.length!==JOBS.length||!bool(w.room.extension)||!bool(w.room.drill)||
    w.room.width!==(w.room.extension?8:6)||w.room.depth!==5||!Array.isArray(w.room.layout)||w.room.layout.length!==DEFAULT_LAYOUT.length)bad();
  const orders=JOBS.map(j=>{
    const o=w.orders.find(o=>o?.id===j.id);
    if(!o||!STEPS.includes(o.status)||!finite(o.progress,0,j.duration)||!bool(o.paused)||!bool(o.measured)||
      !integer(o.passes,0,100)||(o.actual!==null&&!finite(o.actual,0,1000)))bad();
    if(STEPS.indexOf(o.status)>=5&&(o.actual===null||o.progress!==j.duration))bad();
    if(['checked','completed'].includes(o.status)&&(!o.measured||Math.abs(o.actual-j.diameter)>0.10001))bad();
    return {id:j.id,status:o.status,progress:o.progress,paused:o.paused,actual:o.actual,measured:o.measured,passes:o.passes};
  });
  const ongoing=orders.filter(o=>!['new','completed'].includes(o.status));
  if(ongoing.length>1|| (ongoing.length? w.active!==ongoing[0].id : w.active!==null))bad();
  const layout=DEFAULT_LAYOUT.map(def=>{
    const o=w.room.layout.find(o=>o?.id===def.id);
    if(!o||!finite(o.x,0,1200)||!finite(o.y,0,820))bad();return {id:def.id,x:o.x,y:o.y};
  });
  return {version:1,money:w.money,stock:{aluminium:w.stock.aluminium,c45:w.stock.c45,brass:w.stock.brass},orders,
    active:w.active,tool:w.tool,wear:w.wear,cartReady:w.cartReady,chips:w.chips,scrap:w.scrap,
    settings:{rpm:w.settings.rpm,feed:w.settings.feed},radio:w.radio,volume:w.volume,light:w.light,catPets:w.catPets,
    room:{width:w.room.width,depth:5,extension:w.room.extension,drill:w.room.drill,layout}};
}
export const activeOrder=w=>w.orders.find(o=>o.id===w.active)||null;
export const jobFor=o=>JOBS.find(j=>j.id===o?.id)||null;
export const inTolerance=o=>!!o&&o.actual!==null&&Math.abs(o.actual-jobFor(o).diameter)<=0.10001;
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
      need(arg===j.material,'Dieser Werkstoff passt nicht zur Auftragszeichnung.');need(w.stock[arg]>0,'Dieses Material ist aufgebraucht. Bestelle es am Lagerregal.');
      w.stock[arg]-=1;o.status='material';return 'Rohling bereit. Rüste jetzt den Werkzeugwagen.';
    case 'buy-material': need(Object.hasOwn(MATERIALS,arg),'Unbekanntes Material.');need(w.stock[arg]<=9996,'Das Materiallager ist voll.');pay(w,MATERIALS[arg].price*3);w.stock[arg]+=3;return 'Drei Rohlinge wurden ins Lager gelegt.';
    case 'tool': need(['hss','carbide'].includes(arg),'Unbekanntes Werkzeug.');need(o?.status!=='machining','Beende die laufende Bearbeitung vor einem Werkzeugwechsel.');w.tool=arg;w.cartReady=false;if(o?.status==='prepared')o.status='material';return 'Werkzeug ausgewählt. Am Wagen für den Auftrag bereitlegen.';
    case 'sharpen': need(o?.status!=='machining','Beende zuerst die laufende Bearbeitung.');need(w.wear>0,'Das Werkzeug ist bereits scharf.');pay(w,5);w.wear=0;return 'Werkzeug instand gesetzt.';
    case 'prepare': need(o?.status==='material','Wähle zuerst das passende Rohmaterial.');need(w.wear<85,'Setze das Werkzeug zuerst am Schrank instand.');w.cartReady=true;o.status='prepared';return 'Werkzeug und Messschieber liegen bereit. Die Drehbank ist dran.';
    case 'settings': need(o?.status!=='machining','Schnittwerte lassen sich erst nach diesem Durchgang ändern.');need([300,450,800].includes(arg?.rpm)&&[0.1,0.2,0.3].includes(arg?.feed),'Ungültige Einstellung.');w.settings={rpm:arg.rpm,feed:arg.feed};return 'Schnittwerte eingestellt.';
    case 'start':
      need(o?.status==='prepared'&&w.cartReady,'Bereite zuerst Material und Werkzeugwagen vor.');need(w.wear<85,'Das Werkzeug ist zu stumpf.');need(w.chips<5,'Reinige zuerst den Arbeitsplatz.');
      o.status='machining';o.progress=0;o.paused=false;o.actual=null;o.measured=false;return 'Die Drehbank läuft.';
    case 'pause': need(o?.status==='machining','Es läuft keine Bearbeitung.');o.paused=!o.paused;return o.paused?'Bearbeitung pausiert.':'Bearbeitung fortgesetzt.';
    case 'deburr': need(o?.status==='machined','Es liegt noch kein gedrehtes Teil zum Entgraten bereit.');o.status='deburred';return 'Kanten entgratet. Miss das Teil am Schreibtisch.';
    case 'measure':
      need(o?.status==='deburred','Drehe das Teil und entgrate es zuerst am Schraubstock.');o.measured=true;
      if(inTolerance(o)){o.status='checked';return 'Maßhaltig. Der Auftrag kann am Schreibtisch abgegeben werden.';}
      return 'Das Teil ist noch zu groß. Führe an der Drehbank einen Schlichtdurchgang aus.';
    case 'rework':
      need(o?.status==='deburred'&&o.measured&&!inTolerance(o),'Eine Nacharbeit ist erst nach einer fehlgeschlagenen Maßprüfung nötig.');
      need(w.wear<85,'Setze das Werkzeug vor der Nacharbeit instand.');need(w.chips<5,'Reinige zuerst den Arbeitsplatz.');
      o.status='prepared';o.passes+=1;w.cartReady=true;return 'Schlichtdurchgang vorbereitet. Wähle 450 U/min und 0,1 mm/U und starte erneut.';
    case 'deliver':
      need(o?.status==='checked','Der Auftrag muss zuerst gefertigt, entgratet und geprüft werden.');w.money+=j.pay;o.status='completed';w.active=null;w.cartReady=false;return `${j.pay} € erhalten. Auftrag abgeschlossen.`;
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
  const o=activeOrder(w);if(!o||o.status!=='machining'||o.paused)return false;
  o.progress=Math.min(jobFor(o).duration,o.progress+Math.max(0,Math.min(elapsed,2000)));
  if(o.progress===jobFor(o).duration){
    const accurate=w.settings.feed===0.1&&w.settings.rpm===450&&w.wear<60;
    o.actual=Number((jobFor(o).diameter+(accurate?0.04:0.24)).toFixed(2));o.status='machined';o.paused=false;
    w.wear=Math.min(100,w.wear+(w.tool==='carbide'?3:7));w.chips+=1;return true;
  }
  return false;
}
export function nextTask(w){
  const o=activeOrder(w);
  if(!o)return w.orders.every(x=>x.status==='completed')?{station:'build',text:'Alle drei Testaufträge erledigt. Probiere den Anbau aus.'}:{station:'desk',text:'Tippe auf den Schreibtisch und nimm einen Auftrag an.'};
  return ({accepted:{station:'rack',text:'Wähle den passenden Rohling am Materialständer.'},material:{station:'cart',text:'Lege die Werkzeuge am Wagen bereit.'},prepared:{station:'lathe',text:'Stelle die Drehbank ein und starte die Bearbeitung.'},machining:{station:'lathe',text:o.paused?'Setze die Bearbeitung an der Drehbank fort.':'Die Drehbank arbeitet. Beobachte den Fortschritt.'},machined:{station:'vise',text:'Entgrate das Werkstück am Schraubstock.'},deburred:{station:o.measured?'lathe':'measure',text:o.measured?'Das Teil ist zu groß. Bereite einen Schlichtdurchgang vor.':'Prüfe das Maß mit dem Messschieber.'},checked:{station:'desk',text:'Gib den geprüften Auftrag am Schreibtisch ab.'}})[o.status];
}
