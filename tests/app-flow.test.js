// Ereignistests mit einem kleinen DOM-Testadapter; kein Ersatz für einen Browsertest.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import vm from 'node:vm';
const source=['workshop-state.js','storage.js','scene.js','workshop-ui.js','app.js'].map(name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8').replace(/^import .*;\n/gm,'').replaceAll('export ','')).join('\n');
function app(values=new Map()) {
 const elements=new Map();const intervals=[];let clock=0;
 const element=id=>{
  if(!elements.has(id)) elements.set(id,{id,value:'',textContent:'',innerHTML:'',hidden:false,dataset:{},handlers:{},addEventListener(n,fn){this.handlers[n]=fn;},focus(){},click(){},remove(){}});
  return elements.get(id);
 };
 const document={querySelector:s=>element(s.slice(1)),body:{append(){}},createElement:()=>element('anchor'),addEventListener(){}};
 const localStorage={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)};
 const context={document,window:{localStorage,addEventListener(){}},crypto:webcrypto,structuredClone,Intl,Date,JSON,Blob,performance:{now:()=>clock},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},setTimeout:()=>1,clearTimeout(){},setInterval(fn){intervals.push(fn);},console};
 vm.runInNewContext(source,context);
 const click=(action,slot,mode)=>element('panel').handlers.click({target:{closest:()=>({dataset:{action,slot,mode},disabled:false})}});
 const start=(name='Testwerkstatt',slot='1')=>{click('new');element('owner').value='Robin';element('workshop').value=name;element('first-slot').value=slot;element('panel').handlers.submit({target:{id:'new-form'},preventDefault(){}});};
 const work=(action,arg='')=>element('workshop-app').handlers.click({target:{closest:()=>({dataset:{work:action,arg},disabled:false})}});
 const tick=ms=>{clock+=ms;intervals[0]();};
 const menu=()=>element('workshop-app').handlers.click({target:{closest:()=>({dataset:{openMenu:''},disabled:false})}});
 return {click,start,work,tick,menu,values,element,html:()=>element('panel').innerHTML+element('workshop-app').innerHTML,read:id=>JSON.parse(values.get('turningpoint.save.v1.'+id)),importFile:async data=>element('import-file').handlers.change({target:{files:[{size:data.length,text:async()=>data}]}})};
}
test('Menüablauf: neues Spiel, Autosave, manueller Snapshot und Laden',()=>{
 const a=app();assert.match(a.html(),/Neues Spiel/);a.start('Erste Werkstatt');assert.equal(a.read('1').state.workshopName,'Erste Werkstatt');
 assert.equal(a.read('auto').state.workshopName,'Erste Werkstatt');assert.equal(a.read('auto').state.note,undefined);
 assert.doesNotMatch(a.html(),/textarea|journal-note|Werkstattnotiz/);
 a.click('save');a.click('write','2','save');assert.equal(a.read('2').state.workshopName,'Erste Werkstatt');
 a.start('Zweite Werkstatt','3');assert.equal(a.read('auto').state.workshopName,'Zweite Werkstatt');
 a.click('load');a.click('read','2');assert.match(a.html(),/Spielstand laden\?/);a.click('confirm');
 assert.equal(a.read('auto').state.workshopName,'Erste Werkstatt');assert.match(a.html(),/Erste Werkstatt/);
 const restart=app(a.values);restart.click('continue');assert.match(restart.html(),/Erste Werkstatt/);
});
test('Belegten Platz erst nach Bestätigung ändern; Abbrechen erhält Original',()=>{
 const a=app();a.start('Erste Werkstatt');a.start('Zweite Werkstatt');
 assert.equal(a.read('1').state.workshopName,'Erste Werkstatt');a.click('cancel');assert.equal(a.read('1').state.workshopName,'Erste Werkstatt');
 a.start('Zweite Werkstatt');a.click('confirm');assert.equal(a.read('1').state.workshopName,'Zweite Werkstatt');
 a.click('load');a.click('delete','1','load');a.click('cancel');assert.equal(a.read('1').state.workshopName,'Zweite Werkstatt');
});
test('Import zuerst prüfen und Ziel wählen; ungültiger Import lässt vorhandene Stände erhalten',async()=>{
 const a=app();a.start('Exportierte Werkstatt');a.click('home');const backup=JSON.stringify(a.read('auto'));
 const b=app();await b.importFile(backup);assert.match(b.html(),/Sicherung übernehmen/);assert.equal(b.values.size,0);
 b.click('write','3','import');assert.equal(b.read('3').state.workshopName,'Exportierte Werkstatt');
 const old=b.values.get('turningpoint.save.v1.3');await b.importFile('{invalid');assert.equal(b.values.get('turningpoint.save.v1.3'),old);assert.match(b.element('toast').textContent,/gültiges JSON/);
});

test('Update-002-Sicherung bleibt ladbar, ohne ein Notizfeld anzuzeigen',async()=>{
 const old=app();old.start('Alte Werkstatt');const backup=old.read('1');backup.version=1;delete backup.state.workshop;backup.state.note='Vor dem Update gespeicherter Text';
 const updated=app();await updated.importFile(JSON.stringify(backup));updated.click('write','2','import');
 assert.match(updated.html(),/Alte Werkstatt/);assert.doesNotMatch(updated.html(),/textarea|journal-note|Werkstattnotiz|Vor dem Update gespeicherter Text/);
 assert.equal(updated.read('2').state.note,backup.state.note);
});

test('Werkstattaktionen laufen über die Oberfläche, sichern Fortschritt und pausieren beim Menüwechsel',()=>{
 const a=app();a.start('Spielbare Werkstatt');assert.equal(a.element('workshop-app').hidden,false);
 assert.match(a.element('workshop-app').innerHTML,/data-station="lathe"/);
 a.work('accept','bolt');a.work('select-material','aluminium');a.work('prepare');a.work('start');
 a.tick(1000);a.menu();assert.equal(a.read('auto').state.workshop.orders[0].progress,1000);assert.equal(a.read('auto').state.workshop.orders[0].paused,true);
 assert.equal(a.element('workshop-app').hidden,true);a.click('continue');a.work('pause');
 for(let n=0;n<12;n++)a.tick(1000);
 assert.equal(a.read('auto').state.workshop.orders[0].status,'machined');a.work('deburr');a.work('measure');a.work('deliver');
 const done=a.read('auto').state.workshop;assert.equal(done.money,340);assert.equal(done.stock.aluminium,3);assert.equal(done.orders[0].status,'completed');
 a.work('deliver');assert.equal(a.read('auto').state.workshop.money,340);
 const restart=app(a.values);restart.click('continue');assert.equal(restart.read('auto').state.workshop.money,340);
});
