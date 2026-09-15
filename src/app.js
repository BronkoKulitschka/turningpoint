import { machineReadout, measurementText } from './lathe-ui.js?v=007';
import { SLOT_IDS, createStore, makeSave, newState, validateSave } from './storage.js?v=007';
import { act, advance, activeOrder, jobFor, validateWorkshop } from './workshop-state.js?v=007';
import { workshopHTML } from './workshop-ui.js?v=007';

const $ = s => document.querySelector(s);
const panel = $('#panel');
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const when = s => new Intl.DateTimeFormat('de-DE', {dateStyle:'short', timeStyle:'short'}).format(new Date(s));
let local;
try { local = window.localStorage; } catch { local = {getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}}; }
const store = createStore(local);
let current = null, dirty = false, view = 'home', pending = null, cancelled = null, imported = null;
let autoTimer, toastTimer, autoSuspended = false;
let feedPointerId = null;
let station = null, orderTab = 'new', zoom = 1, lastTick = 0, persistElapsed = 0;
let audioContext = null, audioGain = null, audioOscillators = [], audioAllowed = false;
const shop = $('#workshop-app');
function silenceRadio() { if(audioGain && audioContext) audioGain.gain.setTargetAtTime(0,audioContext.currentTime,0.03); }
function syncRadio() {
  const w=current?.workshop;
  if(!w?.radio || !audioAllowed || view!=='workshop' || document.hidden){silenceRadio();return;}
  try {
    if(!audioContext){
      const Audio=window.AudioContext||window.webkitAudioContext;
      if(!Audio)throw new Error('Dieser Browser unterstützt die Radiowiedergabe nicht.');
      audioContext=new Audio();audioGain=audioContext.createGain();audioGain.gain.value=0;audioGain.connect(audioContext.destination);
      [130.81,164.81,196,261.63].forEach((f,i)=>{const oscillator=audioContext.createOscillator();oscillator.type='sine';oscillator.frequency.value=f;const gain=audioContext.createGain();gain.gain.value=0.13/(i+1);oscillator.connect(gain);gain.connect(audioGain);oscillator.start();audioOscillators.push(oscillator);});
    }
    audioContext.resume().catch(()=>{toast('Tippe erneut auf das Radio, um die Wiedergabe zu erlauben.',true);});
    audioGain.gain.setTargetAtTime(w.volume/100*.18,audioContext.currentTime,0.15);
    if($('#audio-state'))$('#audio-state').textContent='Werkstattklang läuft.';
  }catch(e){toast(e.message,true);}
}
function leaveWorkshop(){
  if(current && view==='workshop'){
    const order=activeOrder(current.workshop);
    if(order?.status==='machining'&&!order.paused){order.paused=true;if(order.piece)order.piece.feeding=0;dirty=true;flushAuto();}
  }
  shop.hidden=true;$('.workbench').hidden=false;silenceRadio();
}
function renderShop(){
  if(!current)return;
  const scroll=$('.scene-scroll');const x=scroll?.scrollLeft||0, y=scroll?.scrollTop||0;
  const extra=$('.lathe-extras'),extraY=extra?.scrollTop||0;
  shop.innerHTML=workshopHTML(current.workshop,current.workshopName,station,orderTab,zoom);
  const nextExtra=$('.lathe-extras');if(nextExtra)nextExtra.scrollTop=extraY;
  const nextScroll=$('.scene-scroll');if(nextScroll){nextScroll.scrollLeft=x;nextScroll.scrollTop=y;}
  const saved=$('#shop-save-state');if(saved)saved.textContent=autoSuspended?'Autosave wegen eines anderen Tabs angehalten. Bitte manuell sichern.':dirty?'Noch nicht gespeichert – bitte über das Menü sichern.':'✓ Fortschritt automatisch auf diesem Gerät gesichert.';
}
function refreshMachine(){
  const o=current&&activeOrder(current.workshop),live=$('#machine-live');
  if(station==='lathe'&&o?.piece&&live){
    const expanded=live.querySelector?.('details')?.open;
    live.innerHTML=machineReadout(current.workshop,o,jobFor(o));
    const details=live.querySelector?.('details');if(details)details.open=!!expanded;
    const reading=$('#lathe-reading');if(reading)reading.textContent=measurementText(o.piece);
    const notice=$('#cut-notice');if(notice)notice.textContent=o.piece.notice;
    const depth=$('#cut-depth');if(depth&&document.activeElement!==depth)depth.value=(o.piece.operation==='face'?o.piece.faceDepth:o.piece.depth).toFixed(3);
  }
}
function releaseFeed(event){
  if(event?.pointerId!==undefined&&feedPointerId!==null&&event.pointerId!==feedPointerId)return;
  if(event?.type==='keyup'&&event.key!==' '&&event.key!=='Enter')return;
  feedPointerId=null;
  const o=current&&activeOrder(current.workshop);
  if(o?.piece?.feeding){o.piece.feeding=0;dirty=true;flushAuto();refreshMachine();}
}
function haltMachining(){
  const o=current&&activeOrder(current.workshop);
  if(o?.status==='machining'){o.paused=true;o.piece.feeding=0;dirty=true;flushAuto();}
}
function commitWork(action,arg,quiet=false){
  if(!current)return;
  if(autoSuspended)throw new Error('Ein anderer Tab hat gespeichert. Sichere deinen Stand manuell und lade ihn anschließend über das Menü.');
  const copy=validateWorkshop(current.workshop);
  if(action==='depth-step'){const p=activeOrder(copy)?.piece;if(!p)return;arg=Math.max(0,Math.min(p.operation==='face'?1.5:3,Math.round(((p.operation==='face'?p.faceDepth:p.depth)+Number(arg))*1000)/1000));action='depth';}
  if(['depth','probe-position','measure-lathe','measure-length','touch'].includes(action))quiet=true;
  const result=act(copy,action,arg);current.workshop=copy;
  current.updatedAt=new Date().toISOString();dirty=true;flushAuto();
  if(action==='accept')orderTab='active';if(action==='deliver')orderTab='done';
  if(action==='radio')audioAllowed=true;
  if(quiet){refreshMachine();}else{renderShop();syncRadio();toast(result);}
}


function toast(message, error = false) {
  clearTimeout(toastTimer); const el = $('#toast'); el.textContent = message;
  el.dataset.error = error; el.hidden = false;
  toastTimer = setTimeout(() => { el.hidden = true; }, error ? 10000 : 4200);
}
function show(html, number, nextView) {
  leaveWorkshop();
  view = nextView; panel.innerHTML = html; $('#page-number').textContent = number;
  panel.focus({preventScroll:true});
}
function button(action, title, symbol, primary = false, disabled = false, subtitle = '') {
  const number = { continue: '01', new: '02', load: '03', save: '04' }[action] || '•';
  return `<button class="action ${primary ? 'primary' : ''}" data-action="${action}" ${disabled ? 'disabled' : ''}><span class="menu-index" aria-hidden="true">${number}</span><span>${title}${subtitle ? `<small>${escape(subtitle)}</small>` : ''}</span><span class="menu-end" aria-hidden="true">›</span></button>`;
}
const back = () => '<button class="back" data-action="home">← Hauptmenü</button>';
function home() {
  const latest = store.latest();
  show(`<h2>Hauptmenü</h2><div class="menu">
    ${button('continue', current ? 'Zur Werkstatt' : 'Fortsetzen', '', !!(current || latest), !(current || latest), current?.workshopName || latest?.save.state.workshopName || '')}
    ${button('new', 'Neues Spiel', '', !(current || latest))}
    ${button('load', 'Spiel laden', '')}
    ${button('save', 'Spiel speichern', '', false, !current)}
    </div><div class="divider">SPIELSTAND SICHERN</div><div class="backup-row"><button class="small-btn" data-action="export" ${!current && !latest ? 'disabled' : ''}>Datei exportieren</button><button class="small-btn" data-action="import">Datei importieren</button></div><p class="hint">3 Speicherplätze + Autosave. Export für eine Sicherung außerhalb dieses Browsers.</p>`, '01 / START', 'home');
}
function confirmAction(title, message, label, callback, cancel) {
  pending = callback; cancelled = cancel;
  show(`${back()}<h2>${escape(title)}</h2><div class="confirm"><p>${escape(message)}</p><div class="form-actions"><button class="small-btn" data-action="cancel">Abbrechen</button><button class="small-btn primary" data-action="confirm">${escape(label)}</button></div></div>`, 'BITTE PRÜFEN', 'confirm');
}
function newGame(values = {}) {
  show(`${back()}<h2>Dein erster Schlüssel.</h2><p class="description">Opa hat dir seine Werkstatt hinterlassen.<br>Jetzt darf deine Geschichte beginnen.</p><form id="new-form"><label class="field" for="owner">Dein Name</label><input id="owner" name="owner" maxlength="40" required autocomplete="off" placeholder="Wie heißt du?" value="${escape(values.owner || '')}"><label class="field" for="workshop">Name deiner Werkstatt</label><input id="workshop" name="workshop" maxlength="40" required value="${escape(values.workshop || 'Opas Werkstatt')}"><label class="field" for="first-slot">Erster Speicherplatz</label><select id="first-slot" name="slot">${['1','2','3'].map(id => {const r=store.read(id);return `<option value="${id}" ${id === values.slot ? 'selected' : ''}>Platz ${id} · ${r.status==='ok' ? escape(r.save.state.workshopName) : r.status==='empty' ? 'Frei' : 'Nicht lesbar'}</option>`;}).join('')}</select><p class="hint">Der Start wird direkt gespeichert. Ein belegter Platz wird erst nach deiner Bestätigung ersetzt.</p><button class="action primary" type="submit">Werkstatt übernehmen <span class="arrow">→</span></button></form>`, '02 / NEUANFANG', 'new');
  if (!values.slot) { const free = ['1','2','3'].find(id => store.read(id).status==='empty'); if (free) $('#first-slot').value=free; }
}
function setCurrent(save) {
  clearTimeout(autoTimer); current = structuredClone(save.state); current.workshop=validateWorkshop(current.workshop); const order=activeOrder(current.workshop); if(order?.status==='machining'){order.paused=true;if(order.piece)order.piece.feeding=0;} dirty = false; autoSuspended = false; station=null; zoom=1;
  try { store.write('auto', makeSave(current)); $('#storage-status').textContent = 'Automatisch auf diesem Gerät gespeichert.'; }
  catch(e) { dirty = true; toast(e.message, true); $('#storage-status').textContent = 'Nicht gespeichert – bitte Sicherung exportieren.'; }
  workshopSummary();
}
function workshopSummary() {
  if(!current)return home();
  current.workshop=validateWorkshop(current.workshop);
  view='workshop';$('.workbench').hidden=true;shop.hidden=false;lastTick=performance.now();
  orderTab=activeOrder(current.workshop)?'active':'new';renderShop();syncRadio();
}
function flushAuto() {
  clearTimeout(autoTimer);
  if (!current || !dirty || autoSuspended) return;
  try {
    store.write('auto', makeSave(current)); dirty = false;
    if($('#shop-save-state'))$('#shop-save-state').textContent='✓ Fortschritt automatisch auf diesem Gerät gesichert.';
    if ($('#auto-label')) $('#auto-label').textContent='✓ Automatisch gespeichert · '+when(new Date().toISOString());
    $('#storage-status').textContent='Automatisch auf diesem Gerät gespeichert.';
  } catch(e) {
    if ($('#auto-label')) $('#auto-label').textContent='Speichern fehlgeschlagen. Bitte Sicherung exportieren.';
    $('#storage-status').textContent='Nicht gespeichert – bitte Sicherung exportieren.'; if($('#shop-save-state'))$('#shop-save-state').textContent='Speichern fehlgeschlagen. Über das Menü eine Datei exportieren.'; toast(e.message,true);
  }
}
function slots(mode = 'load') {
  if (mode==='save' && !current) return home();
  const source = mode==='import' ? imported?.state : current;
  if (mode==='import' && !source) return home();
  const title = mode==='load' ? 'Deine Spielstände.' : mode==='save' ? 'Gut aufgehoben.' : 'Sicherung übernehmen.';
  const description = mode==='load' ? 'Wähle den Stand, an dem du weitermachen möchtest.' : `${source.workshopName} · Wähle einen Speicherplatz.`;
  show(`${back()}<h2>${title}</h2><p class="description">${escape(description)}</p>${(mode==='load' ? SLOT_IDS : ['1','2','3']).map(id => {
    const r=store.read(id); const label=id==='auto' ? 'AUTOMATISCH' : 'SPEICHERPLATZ '+id;
    if(r.status==='empty') return `<article class="slot empty-slot"><div><span class="slot-number">${label}</span><p>Noch frei</p></div>${mode==='load' ? '' : `<button class="small-btn primary" data-action="write" data-slot="${id}" data-mode="${mode}">Hier speichern</button>`}</article>`;
    if(r.status!=='ok') return `<article class="slot"><span class="slot-number">${label}</span><p class="notice error">${r.status==='corrupt' ? 'Dieser Spielstand ist beschädigt oder hat eine andere Version.' : 'Browserspeicher nicht zugänglich.'}</p>${r.status==='corrupt' ? `<div class="slot-actions"><button class="small-btn" data-action="raw" data-slot="${id}">Originaldatei sichern</button>${mode==='load' ? '' : `<button class="small-btn" data-action="write" data-slot="${id}" data-mode="${mode}">Ersetzen</button>`}</div>` : ''}</article>`;
    return `<article class="slot"><div class="slot-top"><span class="slot-number">${label}</span><span class="tag">KAPITEL 01</span></div><h3>${escape(r.save.state.workshopName)}</h3><p>${escape(r.save.state.ownerName)} · ${when(r.save.savedAt)}</p><div class="slot-actions">${mode==='load' ? `<button class="small-btn primary" data-action="read" data-slot="${id}">Laden</button><button class="small-btn" data-action="export-slot" data-slot="${id}">Export</button>` : `<button class="small-btn primary" data-action="write" data-slot="${id}" data-mode="${mode}">Hier speichern</button>`}<button class="small-btn" data-action="delete" data-slot="${id}" data-mode="${mode}" aria-label="${label} löschen">Löschen</button></div></article>`;
  }).join('')}<p class="hint">Spielstände sind an dieses Gerät und diesen Browser gebunden. Für einen Gerätewechsel exportiere eine Sicherungsdatei.</p>`,mode==='load' ? '04 / LADEN' : '05 / SPEICHERN',mode);
}
function saveTo(id, source, after, cancel) {
  const save = makeSave(source); const existing=store.read(id);
  const perform = () => { store.write(id, save); after(save); toast('Auf Speicherplatz '+id+' gespeichert.'); };
  if(existing.status==='unavailable') throw new Error('Der Browserspeicher ist nicht zugänglich.');
  if(existing.status!=='empty') confirmAction('Spielstand ersetzen?', `Der bisherige Stand auf Platz ${id} wird durch „${source.workshopName}“ ersetzt. Exportiere ihn vorher, wenn du ihn behalten möchtest.`, 'Ersetzen',perform,cancel);
  else perform();
}
function download(content, filename) {
  const blob=new Blob([content],{type:'application/json'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download=filename; document.body.append(a); a.click(); a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000); toast('Sicherungsdatei zum Download bereitgestellt.');
}
function exportSave(save) {
  if(!save) throw new Error('Noch kein Spielstand zum Exportieren vorhanden.');
  const valid=validateSave(save); const name=valid.state.workshopName.replace(/[^a-z0-9äöüß_-]+/gi,'-').slice(0,40);
  download(JSON.stringify(valid,null,2),`turningpoint-spielstand-${name}-${new Date().toISOString().replace(/[:.]/g,'-')}.json`);
}

panel.addEventListener('submit', e => {
  if(e.target.id!=='new-form') return; e.preventDefault();
  const values={owner:$('#owner').value.trim(),workshop:$('#workshop').value.trim(),slot:$('#first-slot').value};
  if(!values.owner || !values.workshop) {toast('Bitte beide Namen ausfüllen.',true);return;}
  try { saveTo(values.slot,newState(values.workshop,values.owner),setCurrent,()=>newGame(values)); }
  catch(e) {toast(e.message,true);}
});
panel.addEventListener('click', e => {
  const b=e.target.closest('button[data-action]'); if(!b || b.disabled) return;
  const id=b.dataset.slot; const mode=b.dataset.mode;
  try {
    switch(b.dataset.action) {
      case 'home': flushAuto(); home(); break;
      case 'new': flushAuto(); newGame(); break;
      case 'continue': if(current) workshopSummary(); else {const r=store.latest(); if(r) setCurrent(r.save);} break;
      case 'load': flushAuto(); slots('load'); break;
      case 'save': flushAuto(); slots('save'); break;
      case 'read': { const r=store.read(id); if(r.status!=='ok') throw new Error('Dieser Spielstand kann nicht geladen werden.');
        const load=()=>{setCurrent(r.save);toast('Spielstand geladen.');};
        if(current) confirmAction('Spielstand laden?','Dein aktueller Autosave wird durch den gewählten Stand ersetzt. Manuelle Speicherplätze bleiben erhalten.','Laden',load,()=>slots('load')); else load(); break; }
      case 'write': saveTo(id,mode==='import' ? imported.state : current,save=>{ if(mode==='import') {imported=null;setCurrent(save);} else slots('save');},()=>slots(mode)); break;
      case 'delete': confirmAction('Speicherplatz leeren?','Dieser gespeicherte Stand wird gelöscht. Sichere ihn bei Bedarf vorher als Datei. Deine geöffnete Werkstatt bleibt erhalten.','Löschen',()=>{store.remove(id);slots(mode);toast('Speicherplatz geleert.');},()=>slots(mode)); break;
      case 'confirm': { const fn=pending; if(fn) fn(); pending=null; break; }
      case 'cancel': { const fn=cancelled; pending=null; cancelled=null; if(fn) fn(); else home(); break; }
      case 'export': exportSave(current ? makeSave(current) : store.latest()?.save); break;
      case 'export-slot': { const r=store.read(id); if(r.status!=='ok') throw new Error('Kein lesbarer Spielstand.'); exportSave(r.save); break; }
      case 'raw': { const r=store.read(id); if(r.status==='corrupt') download(r.raw,`turningpoint-original-platz-${id}.json`); break; }
      case 'import': flushAuto(); $('#import-file').value=''; $('#import-file').click(); break;
    }
  } catch(e) { toast(e.message || 'Die Aktion konnte nicht abgeschlossen werden.',true); }
});
$('#import-file').addEventListener('change', async e => {
  const file=e.target.files?.[0]; if(!file) return;
  try {
    if(file.size>1024*1024) throw new Error('Die Datei ist zu groß. Bitte eine Turning-Point-Sicherung bis 1 MB auswählen.');
    let data; try {data=JSON.parse(await file.text());} catch {throw new Error('Die Datei enthält kein gültiges JSON.');}
    imported=validateSave(data); slots('import');
  } catch(e) {toast(e.message,true);}
});
window.addEventListener('storage', e => {
  if(!e.key?.startsWith('turningpoint.save.v1.')) return;
  if(current && e.key.endsWith('.auto')) { autoSuspended=true; clearTimeout(autoTimer); const order=activeOrder(current.workshop);if(order?.status==='machining'){order.paused=true;if(order.piece)order.piece.feeding=0;} if(view==='workshop')renderShop();toast('Ein anderer Tab hat gespeichert. Sichere deine Änderungen bitte manuell.',true); }
  if(view==='home') home();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden){const order=current&&activeOrder(current.workshop);if(order?.status==='machining'){order.paused=true;if(order.piece)order.piece.feeding=0;dirty=true;}flushAuto();silenceRadio();}else if(view==='workshop'){lastTick=performance.now();renderShop();syncRadio();}});
window.addEventListener('pagehide',flushAuto);
window.addEventListener('beforeunload',e=>{flushAuto();if(dirty){e.preventDefault();e.returnValue='';}});
shop.addEventListener('click',event=>{
  const el=event.target.closest('[data-station],[data-work],[data-open-menu],[data-close-station],[data-order-tab],[data-zoom]');
  if(!el || el.disabled)return;
  try{
    if(el.dataset.openMenu!==undefined){flushAuto();home();return;}
    if(el.dataset.closeStation!==undefined){haltMachining();station=null;renderShop();return;}
    if(el.dataset.station){haltMachining();station=el.dataset.station;if(station==='desk')orderTab=activeOrder(current.workshop)?'active':'new';if(station==='radio')audioAllowed=true;renderShop();syncRadio();return;}
    if(el.dataset.orderTab){orderTab=el.dataset.orderTab;renderShop();return;}
    if(el.dataset.zoom){zoom=el.dataset.zoom==='reset'?1:Math.max(1,Math.min(2,zoom+(el.dataset.zoom==='in' ? 0.25 : -0.25)));renderShop();return;}
    if(el.dataset.work)commitWork(el.dataset.work,el.dataset.arg);
  }catch(e){toast(e.message,true);}
});
shop.addEventListener('submit',event=>{
  if(event.target.id!=='machine-settings')return;event.preventDefault();
  const values=new FormData(event.target);
  try{commitWork('settings',{rpm:Number(values.get('rpm')),feed:Number(values.get('feed')),coolant:values.get('coolant')==='on'});}catch(e){toast(e.message,true);}
});
shop.addEventListener('change',event=>{
  try{
    if(event.target.id==='radio-volume'){audioAllowed=true;commitWork('volume',Number(event.target.value));}
    if(event.target.id==='cutter-choice')commitWork('cutter',event.target.value);
    if(event.target.id==='cut-depth')commitWork('depth',Number(event.target.value));
    if(event.target.id==='probe-position')commitWork('probe-position',Number(event.target.value));
    if(event.target.id==='tool-position')commitWork('position',Number(event.target.value));
    if(event.target.id==='confirm-scrap'){
      const o=activeOrder(current.workshop);$('#scrap-piece').disabled=!event.target.checked||(o?.status==='machining'&&!o.paused);
    }
  }catch(e){releaseFeed();toast(e.message,true);renderShop();}
});
shop.addEventListener('pointerdown',event=>{
  const button=event.target.closest('[data-feed]');if(!button||button.disabled||event.isPrimary===false||(event.button!==undefined&&event.button!==0))return;
  event.preventDefault();
  try{feedPointerId=event.pointerId??null;button.setPointerCapture?.(event.pointerId);commitWork('feed',Number(button.dataset.feed),true);}catch(e){toast(e.message,true);}
});
shop.addEventListener('contextmenu',event=>{if(event.target.closest('[data-feed]'))event.preventDefault();});
// Delegation keeps hold controls available after station rendering. Space/Enter are equivalent to touch.
shop.addEventListener('keyup',event=>{if(event.key===' '||event.key==='Enter')releaseFeed();});
shop.addEventListener('keydown',event=>{
  const button=event.target.closest('[data-feed]');
  if(button&&!button.disabled&&(event.key===' '||event.key==='Enter')){
    event.preventDefault();if(!event.repeat)try{commitWork('feed',Number(button.dataset.feed),true);}catch(e){toast(e.message,true);}
  }else if((event.key==='Enter'||event.key===' ')&&event.target.matches('g[data-station]')){
    event.preventDefault();haltMachining();station=event.target.dataset.station;if(station==='desk')orderTab=activeOrder(current.workshop)?'active':'new';renderShop();
  }
});
for(const name of ['pointerup','pointercancel','lostpointercapture','keyup'])window.addEventListener(name,releaseFeed);
window.addEventListener('blur',()=>{haltMachining();if(view==='workshop')renderShop();});
shop.addEventListener('focusout',event=>{if(event.target.closest('[data-feed]'))releaseFeed();});
setInterval(()=>{
  if(view!=='workshop'||!current||document.hidden||autoSuspended){lastTick=performance.now();return;}
  const now=performance.now(),elapsed=Math.min(1000,Math.max(0,now-lastTick));lastTick=now;
  const order=activeOrder(current.workshop);if(order?.status!=='machining')return;
  if(order.paused&&order.piece.heat<=20)return;
  const done=advance(current.workshop,elapsed);dirty=true;current.updatedAt=new Date().toISOString();persistElapsed+=elapsed;
  if(done||persistElapsed>=1000){persistElapsed=0;flushAuto();}
  if(done){renderShop();toast(order.piece.notice);}else refreshMachine();
},50);
setInterval(flushAuto,120000);
if(store.read('auto').status==='unavailable') $('#storage-status').textContent='Browserspeicher gesperrt. Bitte in einem normalen Browser öffnen.';
home();
