import test from 'node:test';
import assert from 'node:assert/strict';
import { freshWorkshop, validateWorkshop, act, advance, activeOrder, nextTask, JOBS } from '../src/workshop-state.js';
import { qualityReport, rewardFor } from '../src/machining.js';
import { makeSave, newState, validateSave, createStore } from '../src/storage.js';
const step=(w,a,arg)=>{const result=act(w,a,arg);validateWorkshop(w);return result;};
function ready(id='bolt',material){const w=freshWorkshop(),j=JOBS.find(j=>j.id===id);step(w,'accept',id);step(w,'select-material',material??j.material);step(w,'prepare');step(w,'depth',.5);return w;}
function pass(w,target,{feed=.1,rpm=450,coolant=true,direction=1}={}){
 const o=activeOrder(w),j=JOBS.find(j=>j.id===o.id);
 if(o.status==='machining'&&!o.paused)step(w,'pause');
 step(w,'settings',{rpm,feed,coolant});step(w,'position',direction===1?0:j.length);step(w,'touch');step(w,'depth',(o.piece.reference-target)/2);
 step(w,o.status==='prepared'?'start':'pause');step(w,'feed',direction);
 for(let n=0;n<2000&&o.piece.feeding;n++)advance(w,100);
 validateWorkshop(w);return o;
}
function cutGood(w,j){for(const d of [j.diameter+2,j.diameter+.4,j.diameter+.02])pass(w,d);assert.equal(qualityReport(activeOrder(w),j).ok,true);}
function inspect(w){if(!activeOrder(w).paused)step(w,'pause');step(w,'finish-cut');step(w,'deburr');step(w,'measure');}
function finish(w,id,material){step(w,'accept',id);step(w,'select-material',material);step(w,'prepare');cutGood(w,JOBS.find(j=>j.id===id));inspect(w);step(w,'deliver');}
test('Alle Aufträge lassen sich manuell fertigen; Material, Qualität und Bezahlung bleiben konsistent',()=>{
 const w=freshWorkshop();for(const j of JOBS)finish(w,j.id,j.material);
 assert.equal(w.money,250+w.orders.reduce((sum,o)=>sum+o.payout,0));assert.deepEqual(w.stock,{aluminium:3,c45:2,brass:1});assert.equal(w.chips,3);
 assert.ok(w.orders.every(o=>o.status==='completed'));assert.equal(w.active,null);assert.equal(nextTask(w).station,'build');
 assert.throws(()=>act(w,'deliver'));assert.equal(w.money,250+w.orders.reduce((sum,o)=>sum+o.payout,0));
});
test('Spindel allein und losgelassener Vorschub entfernen kein Material',()=>{
 const w=ready();step(w,'start');const before=structuredClone(activeOrder(w).piece.diameters);
 for(let n=0;n<100;n++)advance(w,1000);assert.deepEqual(activeOrder(w).piece.diameters,before);assert.equal(activeOrder(w).status,'machining');
 step(w,'feed',1);advance(w,500);step(w,'feed',0);const profile=[...activeOrder(w).piece.diameters];
 assert.ok(profile.some((d,i)=>d<before[i]));assert.ok(profile.some((d,i)=>d===before[i]));
 advance(w,1000);assert.deepEqual(activeOrder(w).piece.diameters,profile);
});
test('Nur überfahrene Abschnitte werden geschnitten; beide Vorschubrichtungen funktionieren',()=>{
 const w=ready();step(w,'position',30);step(w,'start');step(w,'feed',1);advance(w,1000);step(w,'feed',0);
 const p=activeOrder(w).piece;assert.equal(p.diameters[0],24);assert.ok(p.diameters[13]<24);assert.equal(p.diameters.at(-1),24);
 step(w,'pause');step(w,'position',60);step(w,'pause');step(w,'feed',-1);advance(w,1000);assert.ok(p.diameters.at(-1)<24);
});
test('Untermaß bleibt irreversibel und kostet beim Neustart einen weiteren Rohling',()=>{
 const w=ready();pass(w,22);pass(w,20.4);pass(w,19.8);inspect(w);
 assert.equal(qualityReport(activeOrder(w),JOBS[0]).undersize,true);assert.throws(()=>act(w,'deliver'));assert.throws(()=>act(w,'rework'));
 const old=[...activeOrder(w).piece.diameters];assert.ok(old.every(d=>d<19.9));step(w,'scrap-piece');assert.equal(w.stock.aluminium,3);step(w,'select-material','aluminium');assert.equal(w.stock.aluminium,2);assert.equal(w.scrap,1);
});
test('Übermaß kann auf demselben Rohling nachgearbeitet werden',()=>{
 const w=ready();pass(w,22);pass(w,20.4);inspect(w);assert.equal(activeOrder(w).status,'deburred');step(w,'rework');
 assert.ok(activeOrder(w).piece.diameters.every(d=>d<20.5));pass(w,20.02);inspect(w);step(w,'deliver');assert.equal(w.money,250+w.orders[0].payout);assert.equal(w.stock.aluminium,3);
});
test('Falscher Werkstoff ist wählbar, wird verbraucht und von der Abnahme zurückgewiesen',()=>{
 const w=ready('bolt','brass');pass(w,22);pass(w,20.4);pass(w,20.02);inspect(w);
 assert.equal(w.stock.brass,1);assert.match(qualityReport(activeOrder(w),JOBS[0]).reasons.join(' '),/Werkstoff/);assert.throws(()=>act(w,'deliver'));
});
test('Hoher Vorschub spart Zeit, erzeugt aber schlechtere Oberfläche',()=>{
 const a=ready(),b=ready();pass(a,23,{feed:.1});pass(b,23,{feed:.3});
 const pa=activeOrder(a).piece,pb=activeOrder(b).piece;
 assert.ok(pb.seconds<pa.seconds);assert.ok(Math.max(...pb.surface)>Math.max(...pa.surface)+2);
});
test('Zu tiefer Schnitt löst Überlast aus und verschleißt das Werkzeug',()=>{
 const w=ready('pin');step(w,'settings',{rpm:450,feed:.3,coolant:false});step(w,'depth',2);step(w,'start');step(w,'feed',1);advance(w,500);
 assert.equal(activeOrder(w).paused,true);assert.equal(activeOrder(w).piece.feeding,0);assert.match(activeOrder(w).piece.notice,/Überlast/);assert.ok(w.wear>20);
});
test('Drehzahl, Werkstoff, Kühlung und Werkzeug haben messbare Folgen',()=>{
 const dry=ready('pin'),wet=ready('pin');pass(dry,19,{rpm:800,coolant:false});pass(wet,19,{rpm:800,coolant:true});
 assert.ok(activeOrder(dry).piece.heat>activeOrder(wet).piece.heat);assert.equal(dry.coolant,100);assert.ok(wet.coolant<100);
 const low=ready(),high=ready();pass(low,23,{rpm:300});pass(high,23,{rpm:1200});assert.ok(activeOrder(high).piece.seconds<activeOrder(low).piece.seconds);
 const hss=ready(),carbide=ready();step(carbide,'tool','carbide');step(carbide,'prepare');pass(hss,23,{rpm:1200});pass(carbide,23,{rpm:1200});assert.ok(carbide.wear<hss.wear);assert.equal(carbide.money,238);
 const soft=ready(),hard=ready('bolt','c45');pass(soft,23,{coolant:false});pass(hard,23,{coolant:false});assert.ok(hard.wear>soft.wear);
});
test('Einstellungen und Positionieren sind bei laufender Spindel gesperrt; leere Kühlung hat keine Wirkung',()=>{
 const w=ready();step(w,'start');const before=structuredClone(w);
 for(const [a,arg] of [['position',30],['touch'],['settings',{rpm:800,feed:.2,coolant:true}],['finish-cut'],['scrap-piece'],['deliver']]){assert.throws(()=>act(w,a,arg));assert.deepEqual(w,before);}
 const a=ready('pin'),b=ready('pin');a.coolant=0;b.coolant=0;pass(a,19,{coolant:true});pass(b,19,{coolant:false});assert.equal(activeOrder(a).piece.heat,activeOrder(b).piece.heat);
});
test('Profile, Wärme und Einstellungen überleben Speichern; Pausieren verhindert weiteren Abtrag',()=>{
 const state=newState('Werkstatt','Robin');state.workshop=ready();const w=state.workshop;step(w,'start');step(w,'feed',1);advance(w,700);step(w,'pause');
 const save=validateSave(JSON.parse(JSON.stringify(makeSave(state))));const restored=save.state.workshop;
 assert.deepEqual(activeOrder(restored).piece,activeOrder(w).piece);const profile=[...activeOrder(restored).piece.diameters];advance(restored,1000);assert.deepEqual(activeOrder(restored).piece.diameters,profile);
});
test('Update-004-Spielstände migrieren laufende und abgeschlossene Werkstücke ohne Verlust der Kasse',()=>{
 const w=ready();w.version=1;delete w.coolant;delete w.settings.coolant;for(const o of w.orders)delete o.piece;
 w.orders[0].status='machining';w.orders[0].progress=1700;
 const migrated=validateWorkshop(w);assert.equal(migrated.version,3);assert.equal(migrated.orders[0].paused,true);assert.ok(migrated.orders[0].piece.diameters.every(d=>d===24));assert.equal(migrated.stock.aluminium,3);
 w.orders[0]={...w.orders[0],status:'completed',actual:20.04,measured:true,progress:12000};w.active=null;w.money=340;
 const done=validateWorkshop(w);assert.equal(done.money,340);assert.equal(done.orders[0].status,'completed');validateWorkshop(done);
});
test('Beschädigte Profile und falsche abgeschlossene Qualität werden abgelehnt',()=>{
 const w=ready();for(const mutate of [x=>x.orders[0].piece.diameters.pop(),x=>x.orders[0].piece.heat=NaN,x=>x.orders[0].piece.material='holz',x=>x.settings.coolant='ja',x=>x.coolant=-1]){const copy=structuredClone(w);mutate(copy);assert.throws(()=>validateWorkshop(copy));}
 cutGood(w,JOBS[0]);inspect(w);step(w,'deliver');w.orders[0].piece.diameters[0]=19.5;assert.throws(()=>validateWorkshop(w));
});
test('Ausbau und zusätzliche Maschine funktionieren weiterhin',()=>{
 const w=freshWorkshop();for(const j of JOBS)finish(w,j.id,j.material);
 step(w,'clean');step(w,'sell-scrap');step(w,'extend');step(w,'buy-drill');assert.equal(w.money,250+w.orders.reduce((sum,o)=>sum+o.payout,0)+9-380);assert.equal(w.room.width,8);
 assert.throws(()=>act(w,'extend'));assert.throws(()=>act(w,'buy-drill'));step(w,'drill-test');assert.equal(w.stock.aluminium,2);
});
test('Radio und Speicherplatzkopien bleiben unabhängig',()=>{
 const state=newState('Test','Robin');step(state.workshop,'radio');step(state.workshop,'volume',48);step(state.workshop,'pet');
 const data=new Map(),store=createStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)});store.write('1',makeSave(state));state.workshop.money=0;
 const saved=store.read('1').save.state.workshop;assert.equal(saved.money,250);assert.equal(saved.radio,true);assert.equal(saved.volume,48);assert.equal(saved.catPets,1);
});
test('Späne lassen sich ohne tatsächlichen Abtrag nicht erzeugen',()=>{
 const w=ready();step(w,'start');step(w,'pause');step(w,'finish-cut');assert.equal(w.chips,0);
 step(w,'deburr');step(w,'measure');step(w,'rework');step(w,'start');step(w,'pause');step(w,'finish-cut');assert.equal(w.chips,0);
});
test('Maßhaltiges, aber grob gedrehtes Teil erhält keine Freigabe',()=>{
 const w=ready();pass(w,22);pass(w,20.4);pass(w,20.02,{feed:.3});inspect(w);
 const q=qualityReport(activeOrder(w),JOBS[0]);assert.ok(q.min>=19.9&&q.max<=20.1);assert.ok(q.roughness>3.2);assert.equal(q.ok,false);assert.throws(()=>act(w,'deliver'));
});

test('Radiale Schnitttiefe wirkt auch während des Vorschubs; Rückstellen repariert nichts',()=>{
 const w=ready(),p=activeOrder(w).piece;step(w,'depth',0);step(w,'start');step(w,'feed',1);advance(w,500);assert.ok(p.diameters.every(d=>d===24));
 step(w,'depth',.1);advance(w,500);const local=p.diameters.filter(d=>d<24);assert.ok(local.length);assert.ok(local.every(d=>d>=23.8&&d<23.83));
 const before=[...p.diameters];step(w,'depth',0);advance(w,500);assert.deepEqual(p.diameters,before);
});
test('Antasten nullt relativ zur örtlichen Oberfläche, ohne Material zu ändern',()=>{
 const w=ready();pass(w,22);step(w,'pause');step(w,'position',0);const p=activeOrder(w).piece,before=[...p.diameters];
 step(w,'touch');assert.equal(p.depth,0);assert.equal(p.reference,before[0]);assert.deepEqual(p.diameters,before);
 step(w,'depth',.1);assert.ok(Math.abs(p.target-(before[0]-.2))<1e-10);
});
test('Messung am eingespannten Werkstück ist örtlich, explizit und nur bei stehender Spindel möglich',()=>{
 const w=ready(),p=activeOrder(w).piece;assert.equal(p.reading,null);step(w,'measure-lathe');assert.equal(p.reading.diameter,24);assert.equal(activeOrder(w).status,'prepared');
 step(w,'start');const old=structuredClone(p.reading);assert.throws(()=>act(w,'measure-lathe'));assert.deepEqual(p.reading,old);
 step(w,'feed',1);advance(w,500);step(w,'pause');step(w,'probe-position',0);step(w,'measure-lathe');const left=p.reading.diameter;
 step(w,'probe-position',60);assert.equal(p.reading.diameter,left);step(w,'measure-lathe');assert.equal(p.reading.diameter,24);assert.ok(left<24);
 assert.equal(activeOrder(w).measured,false);assert.throws(()=>act(w,'deliver'));
});
test('Gespeicherter Messwert verändert sich beim Weiterdrehen nicht und wird als alt erkannt',()=>{
 const w=ready(),p=activeOrder(w).piece;step(w,'measure-lathe');const old=structuredClone(p.reading);step(w,'start');step(w,'feed',1);advance(w,500);
 assert.deepEqual(p.reading,old);assert.ok(p.revision>p.reading.revision);step(w,'pause');const restored=validateWorkshop(JSON.parse(JSON.stringify(w)));assert.deepEqual(activeOrder(restored).piece.reading,old);
});
test('Genauigkeitsbonus steigt bis 50 Prozent; schlechtester Abschnitt zählt',()=>{
 const w=ready(),o=activeOrder(w);o.piece.surface.fill(1);
 const values=[];for(const d of [20.10,20.05,20.00]){o.piece.diameters.fill(d);values.push(rewardFor(o,JOBS[0]).total);}
 assert.deepEqual(values,[90,113,135]);o.piece.diameters[12]=20.1;assert.equal(rewardFor(o,JOBS[0]).total,90);
 o.piece.diameters[12]=19.8;assert.equal(rewardFor(o,JOBS[0]).total,0);
});
test('Bonus wird genau einmal gezahlt und bleibt beim Laden erhalten',()=>{
 const w=ready();cutGood(w,JOBS[0]);inspect(w);const expected=rewardFor(activeOrder(w),JOBS[0]).total;assert.ok(expected>90);
 step(w,'deliver');assert.equal(w.money,250+expected);assert.equal(w.orders[0].payout,expected);assert.throws(()=>act(w,'deliver'));
 const copy=validateWorkshop(JSON.parse(JSON.stringify(w)));assert.equal(copy.orders[0].payout,expected);assert.equal(copy.money,250+expected);
});
test('Auch ein bestandenes Teil lässt sich für einen höheren Bonus erneut einspannen',()=>{
 const w=ready();pass(w,22);pass(w,20.4);pass(w,20.08);inspect(w);assert.equal(activeOrder(w).status,'checked');const before=rewardFor(activeOrder(w),JOBS[0]).total;
 step(w,'rework');pass(w,20.005);inspect(w);assert.ok(rewardFor(activeOrder(w),JOBS[0]).total>before);assert.equal(w.stock.aluminium,3);
});
test('Update 005 behält Profil, Werkzeugposition und historische Auszahlungen',()=>{
 const w=ready();pass(w,22);const profile=[...activeOrder(w).piece.diameters],target=activeOrder(w).piece.target;
 w.version=2;for(const o of w.orders){delete o.payout;if(o.piece)for(const key of ['reference','depth','probeZ','reading','revision'])delete o.piece[key];}
 const restored=validateWorkshop(w);assert.equal(restored.version,3);assert.deepEqual(activeOrder(restored).piece.diameters,profile);assert.equal(activeOrder(restored).piece.target,target);assert.equal(activeOrder(restored).piece.reading,null);validateWorkshop(restored);
});
test('Manipulierte Messwerte, Zustellungen und Auszahlungen werden abgewiesen',()=>{
 const w=ready();step(w,'measure-lathe');
 for(const mutate of [x=>x.orders[0].piece.depth=-1,x=>x.orders[0].piece.reading.diameter='24',x=>x.orders[0].piece.reading.revision=999,x=>x.orders[0].payout=135]){const copy=structuredClone(w);mutate(copy);assert.throws(()=>validateWorkshop(copy));}
});
