import test from 'node:test';
import assert from 'node:assert/strict';
import { freshWorkshop, validateWorkshop, act, advance, activeOrder, nextTask, JOBS } from '../src/workshop-state.js';
import { makeSave, newState, validateSave, createStore } from '../src/storage.js';
const step=(w,a,arg)=>{const result=act(w,a,arg);validateWorkshop(w);return result;};
const machine=(w)=>{for(let n=0;n<30&&activeOrder(w)?.status==='machining';n++)advance(w,1000);validateWorkshop(w);};
function finish(w,id,material){step(w,'accept',id);step(w,'select-material',material);step(w,'prepare');step(w,'start');machine(w);step(w,'deburr');step(w,'measure');step(w,'deliver');}
test('Drei durchgängige Aufträge: Ressourcen, Zahlung und Abschluss sind konsistent',()=>{
 const w=freshWorkshop();for(const j of JOBS)finish(w,j.id,j.material);
 assert.equal(w.money,630);assert.deepEqual(w.stock,{aluminium:3,c45:2,brass:1});assert.equal(w.chips,3);
 assert.ok(w.orders.every(o=>o.status==='completed'));assert.equal(w.active,null);assert.equal(nextTask(w).station,'build');
 assert.throws(()=>act(w,'deliver'));assert.equal(w.money,630);
});
test('Falsches Material, doppelte Annahme und verfrühte Abgabe verändern den Stand nicht',()=>{
 const w=freshWorkshop();step(w,'accept','bolt');const before=structuredClone(w);
 for(const [a,arg] of [['select-material','c45'],['accept','pin'],['deliver'],['start'],['measure']]){assert.throws(()=>act(w,a,arg));assert.deepEqual(w,before);}
});
test('Schlechte Schnittwerte erfordern Messen und Nacharbeit, ohne erneuten Materialverbrauch',()=>{
 const w=freshWorkshop();step(w,'accept','bolt');step(w,'select-material','aluminium');step(w,'prepare');step(w,'settings',{rpm:800,feed:0.3});step(w,'start');machine(w);
 step(w,'deburr');step(w,'measure');assert.equal(activeOrder(w).status,'deburred');assert.equal(activeOrder(w).actual,20.24);assert.throws(()=>act(w,'deliver'));
 step(w,'rework');step(w,'settings',{rpm:450,feed:0.1});step(w,'start');machine(w);step(w,'deburr');step(w,'measure');step(w,'deliver');
 assert.equal(w.stock.aluminium,3);assert.equal(w.money,340);assert.equal(w.chips,2);
});
test('Speichern und Laden in der Bearbeitung erhält den exakten Fortschritt und verhindert doppelte Auszahlungen',()=>{
 const state=newState('Werkstatt','Robin'),w=state.workshop;step(w,'accept','bolt');step(w,'select-material','aluminium');step(w,'prepare');step(w,'start');advance(w,1700);step(w,'pause');
 const save=validateSave(JSON.parse(JSON.stringify(makeSave(state))));assert.equal(save.state.workshop.orders[0].progress,1700);
 advance(save.state.workshop,2000);assert.equal(save.state.workshop.orders[0].progress,1700);step(save.state.workshop,'pause');machine(save.state.workshop);
 step(save.state.workshop,'deburr');step(save.state.workshop,'measure');step(save.state.workshop,'deliver');
 const restored=validateSave(JSON.parse(JSON.stringify(makeSave(save.state)))).state.workshop;assert.equal(restored.money,340);assert.throws(()=>act(restored,'deliver'));
});
test('Alte Speicherstände werden erweitert; beschädigte neue Werkstattdaten werden abgelehnt',()=>{
 const old={game:'turningpoint',version:1,savedAt:new Date().toISOString(),state:newState('Alt','Robin')};delete old.state.workshop;
 const migrated=validateSave(old);assert.equal(migrated.version,2);assert.equal(migrated.state.workshop.money,250);
 for(const mutate of [s=>s.state.workshop.money=-1,s=>s.state.workshop.stock.aluminium='9',s=>s.state.workshop.orders[0].status='completed',s=>s.state.workshop.room.width=50,s=>s.state.workshop.active='x',s=>delete s.state.workshop]){
  const save=makeSave(newState('Test','Robin'));mutate(save);assert.throws(()=>validateSave(save));
 }
});
test('Ausbau, zusätzliche Maschine, Einkauf und Späneverkauf verbuchen genau einmal',()=>{
 const w=freshWorkshop();for(const j of JOBS)finish(w,j.id,j.material);
 step(w,'clean');step(w,'sell-scrap');assert.equal(w.money,639);assert.throws(()=>act(w,'sell-scrap'));
 step(w,'extend');step(w,'buy-drill');assert.equal(w.money,259);assert.equal(w.room.width,8);assert.equal(w.room.drill,true);
 assert.throws(()=>act(w,'extend'));assert.throws(()=>act(w,'buy-drill'));step(w,'drill-test');assert.equal(w.stock.aluminium,2);assert.equal(w.scrap,1);
 step(w,'buy-material','aluminium');assert.equal(w.stock.aluminium,5);assert.equal(w.money,223);
});
test('Spielzustand ist von Speicherplatzkopien unabhängig; Radio und Layout werden mitgesichert',()=>{
 const state=newState('Test','Robin');step(state.workshop,'radio');step(state.workshop,'volume',48);step(state.workshop,'light');step(state.workshop,'pet');
 const data=new Map(),store=createStore({getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)});store.write('1',makeSave(state));
 state.workshop.money=0;const saved=store.read('1').save.state.workshop;assert.equal(saved.money,250);assert.equal(saved.radio,true);assert.equal(saved.volume,48);assert.equal(saved.light,false);assert.equal(saved.catPets,1);assert.equal(saved.room.layout.length,12);
});
