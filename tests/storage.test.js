import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore, newState, makeSave, validateSave, PREFIX } from '../src/storage.js';
const memory = () => { const values=new Map(); return { getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k) }; };
const sample = () => makeSave(newState('Opas Werkstatt','Robin'));
test('Manuelle Sicherung ist ein unveränderlicher Snapshot; Autosave darf weiterlaufen',()=>{
 const storage=memory(),store=createStore(storage),save=sample();store.write('1',save);
 save.state.note='Erste Notiz';store.write('auto',makeSave(save.state));
 assert.equal(store.read('1').save.state.note,undefined);assert.equal(store.read('auto').save.state.note,'Erste Notiz');
 const restarted=createStore(storage);assert.equal(restarted.read('auto').save.state.note,'Erste Notiz');
 restarted.remove('1');assert.equal(restarted.read('1').status,'empty');assert.equal(restarted.read('auto').status,'ok');
});
test('Export/Import erhält Namen, Umlaute, Notiz und Identität',()=>{
 const save=sample();save.state.note='Späne & Öl: Ø 20 mm';
 const restored=validateSave(JSON.parse(JSON.stringify(save)));assert.deepEqual(restored,save);
});
test('Unbekannte Versionen, fehlende Felder und übergroße Werte werden abgelehnt',()=>{
 for(const mutate of [s=>s.version=2,s=>s.game='other',s=>delete s.state.ownerName,s=>s.state.note='a'.repeat(2001),s=>s.savedAt='invalid',s=>s.state.workshopName='   ',s=>s.state.chapter=99]){
  const save=sample();mutate(save);assert.throws(()=>validateSave(save));
 }
});
test('Beschädigte Daten bleiben unverändert und Fortsetzen findet einen gesunden Platz',()=>{
 const storage=memory(),store=createStore(storage);storage.setItem(PREFIX+'auto','broken');store.write('2',sample());
 assert.equal(store.read('auto').status,'corrupt');assert.equal(store.read('auto').raw,'broken');assert.equal(store.latest().id,'2');
 assert.equal(storage.getItem(PREFIX+'auto'),'broken');
});
test('Fehlgeschlagene Schreibvorgänge zerstören den bisherigen Stand nicht',()=>{
 const storage=memory(),store=createStore(storage);const old=sample();store.write('1',old);
 storage.setItem=()=>{throw new Error('quota');};const next=sample();next.state.note='neu';
 assert.throws(()=>store.write('1',next),/Speichern nicht möglich/);assert.deepEqual(store.read('1').save,old);
});
test('Gesperrter Speicher wird als nicht verfügbar erkannt',()=>{
 const store=createStore({getItem(){throw Error();},setItem(){throw Error();}});
 assert.equal(store.read('1').status,'unavailable');assert.equal(store.latest(),null);assert.throws(()=>store.write('1',sample()));
});
test('Nur erlaubte Felder werden importiert; ungültige Speicherplätze werden abgelehnt',()=>{
 const save=sample();save.state.extra={danger:'ignored'};save.extra='ignored';const clean=validateSave(save);
 assert.equal(clean.extra,undefined);assert.equal(clean.state.extra,undefined);assert.throws(()=>createStore(memory()).write('4',save));
});
