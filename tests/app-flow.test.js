// Ereignistests mit einem kleinen DOM-Testadapter; kein Ersatz für einen Browsertest.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
const source=readFileSync(new URL('../src/storage.js',import.meta.url),'utf8').replaceAll('export ','')+'\n'+readFileSync(new URL('../src/app.js',import.meta.url),'utf8').split('\n').slice(1).join('\n');
function app(values=new Map()) {
 const elements=new Map();
 const element=id=>{
  if(!elements.has(id)) elements.set(id,{id,value:'',textContent:'',innerHTML:'',hidden:false,dataset:{},handlers:{},addEventListener(n,fn){this.handlers[n]=fn;},focus(){},click(){},remove(){}});
  return elements.get(id);
 };
 const document={querySelector:s=>element(s.slice(1)),body:{append(){}},createElement:()=>element('anchor'),addEventListener(){}};
 const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const context={document,window:{localStorage,addEventListener(){}},crypto:webcrypto,structuredClone,Intl,Date,JSON,Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout:()=>1,clearTimeout(){},setInterval(){},console};
 vm.runInNewContext(source,context);
 const click=(action,slot,mode)=>element('panel').handlers.click({target:{closest:()=>({dataset:{action,slot,mode},disabled:false})}});
 const start=(name='Testwerkstatt',slot='1')=>{click('new');element('owner').value='Robin';element('workshop').value=name;element('first-slot').value=slot;element('panel').handlers.submit({target:{id:'new-form'},preventDefault(){}});};
 const note=text=>element('panel').handlers.input({target:{id:'journal-note',value:text}});
 return {click,start,note,values,element,html:()=>element('panel').innerHTML,read:id=>JSON.parse(values.get('turningpoint.save.v1.'+id)),importFile:async data=>element('import-file').handlers.change({target:{files:[{size:data.length,text:async()=>data}]}})};
}
test('Menüablauf: neues Spiel, Notiz, Autosave, manueller Snapshot und Laden',()=>{
 const a=app();assert.match(a.html(),/Neues Spiel/);a.start();assert.equal(a.read('1').state.workshopName,'Testwerkstatt');
 a.note('Meine erste Notiz');a.click('home');assert.equal(a.read('auto').state.note,'Meine erste Notiz');
 a.click('save');a.click('write','2','save');assert.equal(a.read('2').state.note,'Meine erste Notiz');
 a.click('continue');a.note('Neuere Notiz');a.click('home');assert.equal(a.read('auto').state.note,'Neuere Notiz');
 a.click('load');a.click('read','2');assert.match(a.html(),/Spielstand laden\?/);a.click('confirm');
 assert.equal(a.read('auto').state.note,'Meine erste Notiz');assert.match(a.html(),/Meine erste Notiz/);
 const restart=app(a.values);restart.click('continue');assert.match(restart.html(),/Meine erste Notiz/);
});
test('Belegten Platz erst nach Bestätigung ändern; Abbrechen erhält Original',()=>{
 const a=app();a.start('Erste Werkstatt');a.start('Zweite Werkstatt');
 assert.equal(a.read('1').state.workshopName,'Erste Werkstatt');a.click('cancel');assert.equal(a.read('1').state.workshopName,'Erste Werkstatt');
 a.start('Zweite Werkstatt');a.click('confirm');assert.equal(a.read('1').state.workshopName,'Zweite Werkstatt');
 a.click('load');a.click('delete','1','load');a.click('cancel');assert.equal(a.read('1').state.workshopName,'Zweite Werkstatt');
});
test('Import zuerst prüfen und Ziel wählen; ungültiger Import lässt vorhandene Stände erhalten',async()=>{
 const a=app();a.start();a.note('Exportierte Notiz');a.click('home');const backup=JSON.stringify(a.read('auto'));
 const b=app();await b.importFile(backup);assert.match(b.html(),/Sicherung übernehmen/);assert.equal(b.values.size,0);
 b.click('write','3','import');assert.equal(b.read('3').state.note,'Exportierte Notiz');
 const old=b.values.get('turningpoint.save.v1.3');await b.importFile('{invalid');assert.equal(b.values.get('turningpoint.save.v1.3'),old);assert.match(b.element('toast').textContent,/gültiges JSON/);
});
