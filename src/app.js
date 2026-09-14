import { SLOT_IDS, createStore, makeSave, newState, validateSave } from './storage.js?v=003';

const $ = s => document.querySelector(s);
const panel = $('#panel');
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const when = s => new Intl.DateTimeFormat('de-DE', {dateStyle:'short', timeStyle:'short'}).format(new Date(s));
let local;
try { local = window.localStorage; } catch { local = {getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}}; }
const store = createStore(local);
let current = null, dirty = false, view = 'home', pending = null, cancelled = null, imported = null;
let autoTimer, toastTimer, autoSuspended = false;

function toast(message, error = false) {
  clearTimeout(toastTimer); const el = $('#toast'); el.textContent = message;
  el.dataset.error = error; el.hidden = false;
  toastTimer = setTimeout(() => { el.hidden = true; }, error ? 10000 : 4200);
}
function show(html, number, nextView) {
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
  clearTimeout(autoTimer); current = structuredClone(save.state); dirty = false; autoSuspended = false;
  try { store.write('auto', makeSave(current)); $('#storage-status').textContent = 'Automatisch auf diesem Gerät gespeichert.'; }
  catch(e) { dirty = true; toast(e.message, true); $('#storage-status').textContent = 'Nicht gespeichert – bitte Sicherung exportieren.'; }
  workshopSummary();
}
function workshopSummary() {
  if (!current) return home();
  show(`${back()}<div class="chapter-heading"><h2>Betriebsakte</h2><span class="tag">KAPITEL 01</span></div><div class="workshop-card"><img src="./assets/workshop.svg" alt="Opas Werkstatt mit der alten grünen Drehbank"><dl><div><dt>Werkstatt</dt><dd>${escape(current.workshopName)}</dd></div><div><dt>Inhaber</dt><dd>${escape(current.ownerName)}</dd></div><div><dt>Begonnen</dt><dd>${new Intl.DateTimeFormat('de-DE', {dateStyle:'medium'}).format(new Date(current.createdAt))}</dd></div></dl></div><p class="autosave" id="auto-label">${dirty ? 'Noch nicht automatisch gespeichert.' : '✓ Spielstand automatisch gesichert.'}</p><div class="form-actions"><button class="small-btn primary" data-action="save">Spiel speichern</button><button class="small-btn" data-action="export">Datei exportieren</button></div><p class="hint">Die spielbare Werkstatt folgt in einem weiteren Update.</p>`, '03 / BETRIEBSAKTE', 'workshop');
}
function flushAuto() {
  clearTimeout(autoTimer);
  if (!current || !dirty || autoSuspended) return;
  try {
    store.write('auto', makeSave(current)); dirty = false;
    if ($('#auto-label')) $('#auto-label').textContent='✓ Automatisch gespeichert · '+when(new Date().toISOString());
    $('#storage-status').textContent='Automatisch auf diesem Gerät gespeichert.';
  } catch(e) {
    if ($('#auto-label')) $('#auto-label').textContent='Speichern fehlgeschlagen. Bitte Sicherung exportieren.';
    $('#storage-status').textContent='Nicht gespeichert – bitte Sicherung exportieren.'; toast(e.message,true);
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
  if(current && e.key.endsWith('.auto')) { autoSuspended=true; clearTimeout(autoTimer); toast('Ein anderer Tab hat gespeichert. Sichere deine Änderungen bitte manuell.',true); }
  if(view==='home') home();
});
document.addEventListener('visibilitychange',()=>{if(document.hidden) flushAuto();});
window.addEventListener('pagehide',flushAuto);
window.addEventListener('beforeunload',e=>{flushAuto();if(dirty){e.preventDefault();e.returnValue='';}});
setInterval(flushAuto,120000);
if(store.read('auto').status==='unavailable') $('#storage-status').textContent='Browserspeicher gesperrt. Bitte in einem normalen Browser öffnen.';
home();
